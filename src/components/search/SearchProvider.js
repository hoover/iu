import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import qs from 'qs'
import fixLegacyQuery from '../../fixLegacyQuery'
import { getPreviewParams } from '../../utils'
import { useHashState } from '../HashStateProvider'
import { buildSearchQuerystring, unwindParams } from '../../queryUtils'
import { aggregations as aggregationsAPI, search as searchAPI } from '../../api'

const SearchContext = createContext({})

export function SearchProvider({ children, serverQuery }) {
    const router = useRouter()
    const { pathname } = router

    const { hashState, setHashState } = useHashState()

    const queryString = typeof window === 'undefined' ? serverQuery : window.location.href.split('?')[1]?.split('#')[0]
    const query = useMemo(() => {
        const memoQuery = unwindParams(qs.parse(queryString, { arrayLimit: 100 }))
        fixLegacyQuery(memoQuery)
        return memoQuery
    }, [queryString])

    const search = useCallback(params => {
        const newQuery = buildSearchQuerystring({ ...query, ...params })
        router.push(
            { pathname, search: newQuery },
            undefined,
            { shallow: true },
        )
    }, [query])

    const [previewOnLoad, setPreviewOnLoad] = useState()
    const [selectedDocData, setSelectedDocData] = useState()
    useEffect(() => {
        if (hashState?.preview) {
            setSelectedDocData(hashState.preview)
        }
    }, [hashState])

    const [error, setError] = useState()
    const [results, setResults] = useState()
    const [resultsLoading, setResultsLoading] = useState(!!query.q)
    useEffect(() => {
        if (query.q) {
            setError(null)
            setResultsLoading(true)

            searchAPI(query).then(results => {
                setResults(results)
                setResultsLoading(false)

                if (previewOnLoad === 'first') {
                    setPreviewOnLoad(null)
                    setHashState({ ...getPreviewParams(results.hits.hits[0]),
                        tab: undefined, subTab: undefined })
                } else if (previewOnLoad === 'last') {
                    setPreviewOnLoad(null)
                    setHashState({ ...getPreviewParams(results.hits.hits[results.hits.hits.length - 1]),
                        tab: undefined, subTab: undefined })
                }
            }).catch(error => {
                setResults(null)
                setError(error.reason ? error.reason : error.message)
                setResultsLoading(false)
            })
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

    const [aggregations, setAggregations] = useState()
    const [aggregationsLoading, setAggregationsLoading] = useState(!!query.collections?.length)
    useEffect(() => {
        if (query.collections?.length) {
            setAggregationsLoading(true)

            aggregationsAPI(query).then(results => {
                setAggregations(results.aggregations)
                setAggregationsLoading(false)
            }).catch(error => {
                setAggregations(null)
                //setError(error.reason ? error.reason : error.message)
                setAggregationsLoading(false)
            })
        } else {
            setAggregations(null)
        }
    }, [JSON.stringify({
        ...query,
        page: null,
        size: null,
        order: null,
    })])

    const clearResults = () => {
        setResults(null)
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
                    tab: undefined, subTab: undefined })
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
                    tab: undefined, subTab: undefined })
            }
        }
    }, [query, hashState, results, resultsLoading])

    return (
        <SearchContext.Provider value={{
            query, error, search, results, aggregations,
            resultsLoading, aggregationsLoading,
            previewNextDoc, previewPreviousDoc, selectedDocData,
            clearResults, getPreviewParams
        }}>
            {children}
        </SearchContext.Provider>
    )
}

export const useSearch = () => useContext(SearchContext)
