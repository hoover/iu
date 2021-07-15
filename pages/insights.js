import React from 'react'
import { SearchProvider } from '../src/components/search/SearchProvider'
import getAuthorizationHeaders from '../src/backend/getAuthorizationHeaders'
import { collections as collectionsAPI } from '../src/backend/api'
import Insights from '../src/components/insights/Insights'

export default function InsightsPage({ collections, serverQuery }) {
    return (
        <SearchProvider serverQuery={serverQuery}>
            <Insights collections={collections} />
        </SearchProvider>
    )
}

export async function getServerSideProps({ req }) {
    const headers = getAuthorizationHeaders(req)
    const collections = await collectionsAPI(headers)

    const serverQuery = req.url.split('?')[1]?.split('#')[0] || ''

    return { props: { collections, serverQuery }}
}
