import { connect } from 'react-redux';
import LinearProgress from '@material-ui/core/LinearProgress';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    linear: {
        position: 'fixed',
        top: 0,
        height: '5px',
        width: '100%',
        zIndex: theme.zIndex.appBar + 1,
    },
    circular: {
        position: 'fixed',
        top: theme.spacing(1),
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
    },
});

function getType(type) {
    if (type === 'circular') {
        return <CircularProgress color="secondary" size={20} />;
    } else {
        return <LinearProgress variant="query" color="secondary" />;
    }
}

const ProgressIndicator = withStyles(styles)(({ classes, isFetching, type }) => (
    <div className={classes[type]}>{isFetching && getType(type)}</div>
));

export default connect(
    ({
        search: { isFetching: searchFetching },
        collections: { isFetching: collectionsFetching },
        doc: { isFetching: docFetching },
        batch: { isFetching: batchFetching },
    }) => ({
        isFetching:
            searchFetching || collectionsFetching || docFetching || batchFetching,
    })
)(ProgressIndicator);
