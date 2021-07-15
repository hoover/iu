import React from 'react'
import ReactPlaceholder from 'react-placeholder'
import { ButtonBase, List, ListItem, ListItemText, ListItemSecondaryAction, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useSearch } from '../search/SearchProvider'
import { createSearchUrl } from '../../queryUtils'

const useStyles = makeStyles(theme => ({
    bucket: {
        '&:hover': {
            backgroundColor: theme.palette.grey[100],
        }
    }
}))

export default function AggregationsTable({ aggregation }) {
    const classes = useStyles()
    const { query, aggregations, aggregationsError, aggregationsLoading } = useSearch()

    const loading = aggregationsLoading?.[aggregation]
    const buckets = aggregations?.[aggregation]?.values.buckets.slice(0, 10)

    const handleNewSearch = term => () => {
        window.open(createSearchUrl(term, aggregation, query.collections))
    }

    return (
        <List dense>
            <ReactPlaceholder
                showLoadingAnimation
                ready={!loading}
                type="text"
                rows={10}
            >
                {aggregationsError && (
                    <ListItem>
                        <ListItemText primary={
                            <Typography color="error">{aggregationsError}</Typography>
                        } />
                    </ListItem>
                )}

                {buckets?.length ? buckets.map(({ key, doc_count }) => (
                    <ListItem
                        key={key}
                        component={ButtonBase}
                        className={classes.bucket}
                        onClick={handleNewSearch(key)}
                    >
                        <ListItemText primary={key} />
                        <ListItemSecondaryAction>
                            {doc_count}
                        </ListItemSecondaryAction>
                    </ListItem>
                )) : (
                    <ListItem>
                        <ListItemText primary="Not found" />
                    </ListItem>
                )}
            </ReactPlaceholder>
        </List>
    )
}
