import React, { memo } from 'react'
import cn from 'classnames'
import isEqual from 'react-fast-compare'
import { makeStyles } from '@material-ui/core/styles'
import {
    Button,
    Checkbox,
    Grid,
    List,
    ListItem,
    ListItemText,
    Typography
} from '@material-ui/core'
import Pagination from './Pagination'
import MoreButton from './MoreButton'
import { formatThousands } from '../../../utils'
import { aggregationFields } from '../../../constants/aggregationFields'

const useStyles = makeStyles(theme => ({
    checkbox: {
        padding: 5,
    },
    label: {
        overflowX: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    labelWithSub: {
        margin: 0,
    },
    subLabel: {
        fontSize: '8.5pt',
    },
    loading: {
        verticalAlign: 'middle',
        marginLeft: theme.spacing(1),
    },
}))

function AggregationFilter({ field, queryFilter, aggregations, loading, onChange,
                               triState, bucketLabel, bucketSubLabel, bucketValue }) {

    const classes = useStyles()
    const aggregation = aggregations?.values

    const handleChange = value => () => {
        const include = new Set(queryFilter?.include || [])
        const exclude = new Set(queryFilter?.exclude || [])

        if (include.has(value)) {
            include.delete(value)
            if (triState) {
                exclude.add(value)
            }
        } else if (exclude.has(value)) {
            exclude.delete(value)
        } else {
            include.add(value)
        }

        onChange(field, {
            include: Array.from(include),
            exclude: Array.from(exclude),
        })
    }

    const handleReset = () => onChange(field, [], true)

    const renderBucket = bucket => {
        const label = bucketLabel ? bucketLabel(bucket) : bucket.key
        const subLabel = bucketSubLabel ? bucketSubLabel(bucket) : null
        const value = bucketValue ? bucketValue(bucket) : bucket.key
        const checked = queryFilter?.include?.includes(value) ||
            queryFilter?.exclude?.includes(value) || false

        return (
            <ListItem
                key={bucket.key}
                role={undefined}
                dense
                button
                onClick={handleChange(value)}
            >
                <Checkbox
                    size="small"
                    tabIndex={-1}
                    disableRipple
                    value={value}
                    checked={checked}
                    indeterminate={triState && queryFilter?.exclude?.includes(value)}
                    classes={{ root: classes.checkbox }}
                    disabled={loading || !bucket.doc_count}
                    onChange={handleChange(value)}
                />

                <ListItemText
                    primary={label}
                    secondary={subLabel}
                    className={cn(classes.label, {[classes.labelWithSub]: subLabel})}
                    secondaryTypographyProps={{
                        className: classes.subLabel
                    }}
                />

                <ListItemText
                    primary={
                        <Typography variant="caption">
                            {formatThousands(bucket.doc_count)}
                        </Typography>
                    }
                    disableTypography
                    align="right"
                />
            </ListItem>
        )
    }

    const disableReset = loading || (!queryFilter?.include?.length && !queryFilter?.exclude?.length)

    return (
        <List dense>
            {aggregation?.buckets.map(renderBucket).filter(Boolean)}

            <ListItem dense>
                <Grid container alignItems="center" justify="space-between">
                    <Grid item>
                        {aggregationFields[field].type === 'date' ?
                            <Pagination field={field} /> :
                            <MoreButton field={field} />
                        }
                    </Grid>
                    <Grid item>
                        <Button
                            size="small"
                            variant="text"
                            disabled={disableReset}
                            onClick={handleReset}>
                            Reset
                        </Button>
                    </Grid>
                </Grid>
            </ListItem>
        </List>
    )
}

export default memo(AggregationFilter, isEqual)
