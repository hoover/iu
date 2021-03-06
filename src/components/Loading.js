import React, { memo } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { CircularProgress } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
    progress: {
        padding: '1rem',
        textAlign: 'center',
    }
}))

function Loading(props) {
    const classes = useStyles()

    return (
        <div className={classes.progress}>
            <CircularProgress {...props} />
        </div>
    )
}

export default memo(Loading)
