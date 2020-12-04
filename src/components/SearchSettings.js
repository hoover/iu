import React, { memo } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { FormControl, Grid, InputLabel, MenuItem, Select } from '@material-ui/core'
import { SIZE_OPTIONS, SORTABLE_FIELDS } from '../constants'

const useStyles = makeStyles(theme => ({
    root: {
        marginTop: theme.spacing(3),
    },
    formControl: {
        minWidth: 200
    },
}))

function SearchSettings ({ size, changeSize, order, changeOrder }) {
    const classes = useStyles()
    const handleSizeChange = event => changeSize(event.target.value)
    const handleOrderChange = event => changeOrder(event.target.value)

    return (
        <Grid container justify="space-between" className={classes.root}>
            <Grid item>
                <FormControl className={classes.formControl}>
                    <InputLabel>Results per page</InputLabel>
                    <Select autoWidth value={size} onChange={handleSizeChange}>
                        {SIZE_OPTIONS.map(option => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            {/*<Grid item>
                <FormControl className={classes.formControl}>
                    <InputLabel>Order</InputLabel>
                    <Select autoWidth value={order} onChange={handleOrderChange}>
                        {SORTABLE_FIELDS.map(option => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>*/}
        </Grid>
    )
}

export default memo(SearchSettings)
