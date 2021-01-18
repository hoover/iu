import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import url from 'url'
import { Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import SplitPane from 'react-split-pane'
import { UserContext } from '../../_app'
import Document  from '../../../src/components/document/Document'
import Locations from '../../../src/components/Locations'
import Finder from '../../../src/components/Finder'
import SplitPaneLayout from '../../../src/components/SplitPaneLayout'
import HotKeysWithHelp from '../../../src/components/HotKeysWithHelp'
import { copyMetadata, documentViewUrl } from '../../../src/utils'
import { doc as docAPI } from '../../../src/backend/api'

const useStyles = makeStyles(theme => ({
    splitPane: {
        overflow: 'hidden',
        position: 'relative',
        backfaceVisibility: 'hidden',
        willChange: 'overflow',

        height: 'calc(100vh - 96px)',

        '@media (min-width: 0px) and (orientation: landscape)': {
            height: 'calc(100vh - 88px)',
        },

        '@media (min-width: 600px)': {
            height: 'calc(100vh - 104px)',
        }
    },
    horizontalSplitPane: {
        overflowX: 'hidden',
        overflowY: 'auto',
        height: 'auto',
    },
    title: {
        height: '40px',
        padding: '10px',
        backgroundColor: theme.palette.grey['100'],
        borderBottomColor: theme.palette.grey['400'],
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
    },
}))

export default function Doc() {
    const classes = useStyles()
    const whoAmI = useContext(UserContext)

    const router = useRouter()
    const { query } = router

    const [pathname, setPathname] = useState()
    const [data, setData] = useState()
    const [loading, setLoading] = useState(true)

    const [digest, setDigest] = useState()
    const [digestUrl, setDigestUrl] = useState()
    const [urlIsSha, setUrlIsSha] = useState(true)

    useEffect(() => {
        if ((query.collection && query.id) || query.path) {
            let path = documentViewUrl({ _collection: query.collection, _id: query.id })
            if (query.path) {
                path = query.path
            }
            setPathname(path)
            setLoading(true)
            docAPI(path).then(data => {
                if (data.id.startsWith('_')) {
                    if (data.id.startsWith('_file_')) {
                        setDigest(data.digest)
                        setDigestUrl([url.resolve(path, './'), data.digest].join('/'))
                        setUrlIsSha(false)
                    }
                    if (data.id.startsWith('_directory_')) {
                        setDigest(null)
                        setUrlIsSha(false)
                    }
                } else {
                    setDigest(data.id)
                    setDigestUrl(path)
                    setUrlIsSha(true)
                }
                setData(data)
                setLoading(false)
            })
        }
    }, [JSON.stringify(query)])

    const printMode = query.print && query.print !== 'false'

    useEffect(() => {
        if (printMode && !loading) {
            window.setTimeout(window.print)
        }
    }, [printMode, loading])

    const doc = (
        <Document
            docUrl={pathname}
            data={data}
            loading={loading}
            fullPage
            showMeta
            showToolbar={!printMode}
        />
    )

    const finder = (
        <Finder
            loading={loading}
            data={data}
            url={pathname}
        />
    )

    const infoPane = (
        <>
            {!!digest ?
                <SplitPaneLayout
                    container={false}
                    left={loading ? null : <Locations data={data} url={digestUrl}/>}
                    defaultSizeLeft="25%"
                    defaultSizeMiddle="70%"
                >
                    {doc}
                </SplitPaneLayout>
                :
                doc
            }
        </>
    )

    let content = null

    if (printMode) {
        content = doc
    } else {
        content = urlIsSha ?
            <>
                {data &&
                    <Typography variant="subtitle2" className={classes.title}>
                        Document <b>{data?.id}</b>
                        {' '}
                        filename: <b>{data?.content.filename}</b>
                        {' '}
                        - please pick a location to see the Finder
                    </Typography>
                }
                <div className={classes.splitPane}>
                    {infoPane}
                </div>
            </>
            :
            <>
                {data &&
                    <Typography variant="subtitle2" className={classes.title}>
                        {!!digest ? 'File' : 'Directory'}
                        {' '}
                        <b>{data.content.path}</b>
                    </Typography>
                }
                <div className={classes.splitPane}>
                    <SplitPane
                        split="horizontal"
                        defaultSize="30%"
                        pane1ClassName={classes.horizontalSplitPane}
                        pane2ClassName={classes.horizontalSplitPane}>
                        {finder}
                        {infoPane}
                    </SplitPane>
                </div>
            </>
    }

    const keys = {
        copyMetadata: {
            key: 'c',
            help: 'Copy MD5 and path to clipboard',
            handler: (e, showMessage) => {
                if (data?.content) {
                    showMessage(copyMetadata(data))
                }
            },
        },
    }

    return (
        <>
            <Head>
                <title>Hoover {data && `- ${data?.content.filename}`}</title>
                {whoAmI.urls.hypothesis_embed && (
                    <>
                        <script async src={whoAmI.urls.hypothesis_embed} />
                        <script dangerouslySetInnerHTML={{
                            __html: 'window.hypothesisConfig = function() {'+
                                'return {'+
                                'showHighlights: true,'+
                                "appType: 'bookmarklet'"+
                                '}'+
                                '}'
                        }}>
                        </script>
                    </>
                )}
            </Head>
            <HotKeysWithHelp keys={keys}>
                <div tabIndex="-1">
                    {content}
                </div>
            </HotKeysWithHelp>
        </>
    )
}
