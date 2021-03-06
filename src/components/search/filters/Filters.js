import React, { memo, useCallback } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { CircularProgress, Typography } from '@material-ui/core'
import TermsAggregationFilter from './TermsAggregationFilter'
import DateHistogramFilter from './DateHistogramFilter'
import CategoryDrawer from './CategoryDrawer'
import { useSearch } from '../SearchProvider'
import { getLanguageName } from '../../../utils'

const useStyles = makeStyles(theme => ({
    error: {
        padding: theme.spacing(2),
    },
    loading: {
        verticalAlign: 'middle',
        marginLeft: theme.spacing(1),
    },
}))

const formatLang = bucket => getLanguageName(bucket.key)

function Filters({ categories, wideFilters, drawerToolbar, drawerWidth, drawerPinned, drawerPortalRef,
                     drawerOpenCategory, onDrawerOpen, expandedFilters, onFilterExpand }) {

    const classes = useStyles()
    const { query, search, aggregations, aggregationsError, aggregationsLoading, missingAggregations, missingLoading } = useSearch()

    const triggerSearch = params => {
        search({ ...params, page: 1 })
    }

    const handleChange = useCallback((key, value, resetPage) => {
        const { [key]: prevFilter, ...restFilters } = query.filters || {}

        if (resetPage) {
            const { [key]: prevFacet, ...restFacets } = query.facets || {}
            triggerSearch({ filters: { [key]: value, ...restFilters }, facets: { ...restFacets } })
        } else {
            triggerSearch({ filters: { [key]: value, ...restFilters } })
        }
    }, [query])

    if (aggregationsError) {
        return <Typography color="error" className={classes.error}>{aggregationsError}</Typography>
    }

    return Object.entries(categories).map(([category, { label, icon, filters }]) => {
        const highlight = filters.some(filter => {
            const queryFilter = query.filters?.[filter.field]

            return !!queryFilter?.include?.length || !!queryFilter?.exclude?.length || !!queryFilter?.missing
                || !!(queryFilter?.from || queryFilter?.to || queryFilter?.intervals)
        })

        const greyed = filters.every(({ field }) => {
            return aggregations?.[field]?.values?.buckets?.length === 0
        })

        const loading = filters.some(({ field }) => aggregationsLoading[field])

        return (
            <CategoryDrawer
                key={category}
                title={
                    <>
                        {label}
                        {loading && (
                            <CircularProgress
                                size={16}
                                thickness={4}
                                className={classes.loading}
                            />
                        )}
                    </>
                }
                icon={icon}
                greyed={greyed}
                highlight={highlight}
                wideFilters={wideFilters}
                portalRef={drawerPortalRef}
                width={drawerWidth}
                pinned={drawerPinned}
                toolbar={drawerToolbar}
                category={category}
                open={drawerOpenCategory === category}
                onOpen={onDrawerOpen}
            >
                {filters.map(({ field, type, buckets, filterLabel }) => {

                    let FilterComponent, filterTypeProps = {}
                    if (type === 'date') {
                        FilterComponent = DateHistogramFilter
                    } else {
                        FilterComponent = TermsAggregationFilter
                    }

                    if (field === 'lang') {
                        filterTypeProps.bucketLabel = formatLang
                    }

                    if (buckets) {
                        filterTypeProps.bucketLabel = key => {
                            const bucket = buckets.find(bucket => bucket.key === key.key)
                            return bucket ? bucket.label || bucket.key : key.key
                        }
                    }

                    const onToggle = open => {
                        if (open) {
                            onFilterExpand({ ...expandedFilters, ...{ [category]: field } })
                        } else {
                            const { [category]: closed, ...expanded } = expandedFilters
                            onFilterExpand(expanded)
                        }
                    }

                    return (
                        <FilterComponent
                            key={field}
                            title={filterLabel}
                            field={field}
                            queryFilter={query.filters?.[field]}
                            queryFacets={query.facets?.[field]}
                            aggregations={aggregations?.[field]}
                            loading={aggregationsLoading[field]}
                            missing={missingAggregations?.[`${field}-missing`]}
                            missingLoading={missingLoading}
                            open={expandedFilters[category] === field}
                            onToggle={filters.length > 1 && expandedFilters[category] !== field ? onToggle : null}
                            onChange={handleChange}
                            {...filterTypeProps}
                        />
                    )
                })}
            </CategoryDrawer>
        )
    })
}

export default memo(Filters)
