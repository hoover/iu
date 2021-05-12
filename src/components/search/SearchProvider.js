import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import qs from 'qs'
import { Button, IconButton, Snackbar } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import fixLegacyQuery from '../../fixLegacyQuery'
import { getPreviewParams } from '../../utils'
import { useHashState } from '../HashStateProvider'
import { buildSearchQuerystring, rollupParams, unwindParams } from '../../queryUtils'
import { aggregationFields } from '../../constants/aggregationFields'
import { search as searchAPI } from '../../api'
import { tags as tagsAPI } from '../../backend/api'
import { TAGS_REFRESH_DELAYS } from '../../constants/general'
import { reactIcons } from '../../constants/icons'

const useStyles = makeStyles((theme) => ({
    close: {
        padding: theme.spacing(0.5),
    },
}))

const SearchContext = createContext({})

const maxAggregationsBatchSize = Math.ceil(Object.entries(aggregationFields).length / process.env.AGGREGATIONS_SPLIT)

export function SearchProvider({ children, serverQuery }) {
    const classes = useStyles()
    const router = useRouter()
    const { pathname } = router

    const { hashState, setHashState } = useHashState()

    const queryString = typeof window === 'undefined' ? serverQuery : window.location.href.split('?')[1]?.split('#')[0]
    const query = useMemo(() => {
        const memoQuery = unwindParams(qs.parse(queryString, { arrayLimit: 100 }))
        fixLegacyQuery(memoQuery)
        return memoQuery
    }, [queryString])

    const [searchText, setSearchText] = useState(query.q || '')
    useEffect(() => {
        setSearchText(query.q)
    }, [query])

    const search = useCallback(params => {
        const newQuery = buildSearchQuerystring({ ...query, q: searchText || '*', ...params })
        router.push(
            { pathname, search: newQuery, hash: hashState ? qs.stringify(rollupParams(hashState)) : undefined },
            undefined,
            { shallow: true },
        )
    }, [query, hashState, searchText])

    const [previewOnLoad, setPreviewOnLoad] = useState()
    const [selectedDocData, setSelectedDocData] = useState()
    useEffect(() => {
        if (hashState?.preview) {
            setSelectedDocData(hashState.preview)
        }
    }, [JSON.stringify(hashState?.preview)])

    const [collectionsCount, setCollectionsCount] = useState([])

    const [error, setError] = useState()
    const [results, setResults] = useState()
    const [resultsLoading, setResultsLoading] = useState(!!query.q)
    useEffect(() => {
        if (query.q) {
            setError(null)
            setResultsLoading(true)

            searchAPI({
                type: 'results',
                fieldList: '*',
                ...query,
            }).then(results => {
                setResults(results)
                setResultsLoading(false)
                setCollectionsCount(results.count_by_index)

                if (previewOnLoad === 'first') {
                    setPreviewOnLoad(null)
                    setHashState({ ...getPreviewParams(results.hits.hits[0]),
                        tab: undefined, subTab: undefined, previewPage: undefined })
                } else if (previewOnLoad === 'last') {
                    setPreviewOnLoad(null)
                    setHashState({ ...getPreviewParams(results.hits.hits[results.hits.hits.length - 1]),
                        tab: undefined, subTab: undefined, previewPage: undefined })
                }
            }).catch(error => {
                if (error.name !== 'AbortError') {
                    setResults(null)
                    setError(error.message)
                    setResultsLoading(false)
                }
            })
        } else {
            setResults(null)
        }
    }, [JSON.stringify({
        ...query,
        facets: null,
        filters: {
            ...query.filters || {},
            date: {
                from: query.filters?.date?.from,
                to: query.filters?.date?.to,
                intervals: query.filters?.date?.intervals,
            },
            ['date-created']: {
                from: query.filters?.['date-created']?.from,
                to: query.filters?.['date-created']?.to,
                intervals: query.filters?.['date-created']?.intervals,
            },
        }
    })])

    const aggregationGroups = Object.entries(aggregationFields)
        .reduce((acc, [key]) => {
            if (acc?.[acc.length - 1]?.fieldList?.length < maxAggregationsBatchSize) {
                acc[acc.length - 1].fieldList.push(key)
            } else {
                acc.push({ fieldList: [key] })
            }
            return acc
        }, [])

    async function* asyncSearchGenerator() {
        let i = 0
        while (i < aggregationGroups.length) {
            try {
                yield searchAPI({
                    type: 'aggregations',
                    fieldList: aggregationGroups[i].fieldList,
                    ...query,
                })
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setAggregations(null)
                    setAggregationsError(error.message)
                    setAggregationsLoading(
                        Object.entries(aggregationFields).reduce((acc, [field]) => {
                            acc[field] = false
                            return acc
                        }, {})
                    )
                }
            }
            i++
        }
    }

    const [forcedRefresh, forceRefresh] = useState({})
    const [aggregations, setAggregations] = useState()
    const [aggregationsError, setAggregationsError] = useState()
    const [aggregationsLoading, setAggregationsLoading] = useState(
        Object.entries(aggregationFields).reduce((acc, [field]) => {
            acc[field] = !!query.collections?.length
            return acc
        }, {})
    )

    useEffect(async () => {
        if (query.collections?.length) {
            setAggregationsError(null)
            setAggregationsLoading(
                Object.entries(aggregationFields).reduce((acc, [field]) => {
                    acc[field] = true
                    return acc
                }, {})
            )

            let i = 0
            for await (let results of asyncSearchGenerator()) {
                setAggregations(aggregations => ({ ...(aggregations || {}), ...results.aggregations }))
                setCollectionsCount(results.count_by_index)
                setAggregationsLoading(loading => ({
                    ...loading,
                    ...aggregationGroups[i++].fieldList.reduce((acc, field) => {
                        acc[field] = false
                        return acc
                    }, {}),
                }))
            }

        } else {
            setAggregations(null)
        }
    }, [JSON.stringify({
        ...query,
        facets: null,
        page: null,
        size: null,
        order: null,
    }), forcedRefresh])

    const prevQueryRef = useRef()
    useEffect(() => {
        const { facets, page, size, order, ...queryRest } = query
        const { facets: prevFacets, page: prevPage, size: prevSize, order: prevOrder, ...prevQueryRest } = prevQueryRef.current || {}

        if (JSON.stringify(queryRest) === JSON.stringify(prevQueryRest)) {
            const loading = state => Object.entries({
                ...(facets || {}),
                ...(prevFacets || {}),
            }).reduce((acc, [field]) => {
                if (JSON.stringify(facets?.[field]) !== JSON.stringify(prevFacets?.[field])) {
                    acc[field] = state
                }
                return acc
            }, {})

            setAggregationsError(null)
            setAggregationsLoading(loading(true))

            searchAPI({
                type: 'aggregations',
                fieldList: Object.entries(loading(true)).map(([key]) => key),
                ...query,
            }).then(results => {
                setAggregations(aggregations => ({...(aggregations || {}), ...results.aggregations}))
                setAggregationsLoading(loading(false))
            }).catch(error => {
                if (error.name !== 'AbortError') {
                    setAggregations(null)
                    setAggregationsError(error.message)
                    setAggregationsLoading(loading(false))
                }
            })
        }
        prevQueryRef.current = query
    }, [JSON.stringify({
        ...query,
        page: null,
        size: null,
        order: null,
    })])

    const clearResults = () => {
        setResults(null)
        setAggregations(null)
        setCollectionsCount(null)
        setSelectedDocData(null)
    }

    const currentIndex = results?.hits.hits.findIndex(
        hit => hit._collection === hashState.preview?.c && hit._id === hashState.preview?.i
    )

    const previewNextDoc = useCallback(() => {
        if (!resultsLoading && results?.hits.hits
            && (parseInt(query.page) - 1) * parseInt(query.size) + currentIndex < results.hits.total - 1) {
            if (currentIndex === results.hits.hits.length - 1) {
                setPreviewOnLoad('first')
                search({ page: parseInt(query.page) + 1 })
            } else {
                setHashState({ ...getPreviewParams(results.hits.hits[currentIndex + 1]),
                    tab: undefined, subTab: undefined, previewPage: undefined })
            }
        }
    }, [query, hashState, results, resultsLoading])

    const previewPreviousDoc = useCallback(() => {
        if (!resultsLoading && results?.hits.hits && parseInt(query.page) > 1 || currentIndex >= 1) {
            if (currentIndex === 0 && parseInt(query.page) > 1) {
                setPreviewOnLoad('last')
                search({ page: parseInt(query.page) - 1 })
            } else {
                setHashState({ ...getPreviewParams(results.hits.hits[currentIndex - 1]),
                    tab: undefined, subTab: undefined, previewPage: undefined })
            }
        }
    }, [query, hashState, results, resultsLoading])


    const periodicallyCheckIndexedTime = (digestUrl) => {
        let timeout, delayIndex = 0

        const promise = new Promise((resolve, reject) => {
            const runDelayedQuery = delay => {
                timeout = setTimeout(() => {
                    tagsAPI(digestUrl).then(data => {
                        if (data.every(tag => !!tag.date_indexed)) {
                            resolve()
                        } else if (delayIndex < TAGS_REFRESH_DELAYS.length) {
                            runDelayedQuery(TAGS_REFRESH_DELAYS[delayIndex++])
                        } else {
                            reject()
                        }
                    })
                }, delay)
            }
            runDelayedQuery(TAGS_REFRESH_DELAYS[delayIndex++])
        })

        const cancel = () => clearTimeout(timeout)

        return { cancel, promise }
    }

    const [tagsRefreshQueue, setTagsRefreshQueue] = useState(null)
    const addTagToRefreshQueue = digestUrl => {
        if (tagsRefreshQueue) {
            tagsRefreshQueue.cancel()
        }
        setTagsRefreshQueue(periodicallyCheckIndexedTime(digestUrl))
    }

    const [snackbarMessage, setSnackbarMessage] = useState(null)
    const handleSnackbarClose = () => setSnackbarMessage(null)
    useEffect(() => {
        if (tagsRefreshQueue) {
            tagsRefreshQueue.promise.then(() => {
                setTagsRefreshQueue(null)
                setSnackbarMessage(
                    <Button color="inherit" onClick={() => {
                        handleSnackbarClose()
                        forceRefresh({})
                    }}>
                        Refresh for new tags
                    </Button>
                )
            }).catch(() => {
                setTagsRefreshQueue(null)
            })
        }

        return () => {
            if (tagsRefreshQueue) {
                tagsRefreshQueue.cancel()
            }
        }
    }, [tagsRefreshQueue])

    return (
        <SearchContext.Provider value={{
            query, error, search, searchText, setSearchText,
            results, aggregations, aggregationsError,
            collectionsCount, resultsLoading, aggregationsLoading,
            previewNextDoc, previewPreviousDoc, selectedDocData,
            clearResults, addTagToRefreshQueue
        }}>
            {children}
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={Boolean(snackbarMessage)}
                autoHideDuration={30000}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
                ClickAwayListenerProps={{
                    mouseEvent: false,
                    touchEvent: false,
                }}
                action={
                    <IconButton
                        aria-label="close"
                        color="inherit"
                        className={classes.close}
                        onClick={handleSnackbarClose}
                    >
                        {reactIcons.close}
                    </IconButton>
                }
            />
        </SearchContext.Provider>
    )
}

export const useSearch = () => useContext(SearchContext)
