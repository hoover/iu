import fetch from 'node-fetch'
import { stringify } from 'qs'
import memoize from 'lodash/memoize'
import buildSearchQuery from './buildSearchQuery'

const { API_URL } = process.env

const prefix = '/api/v1/'

const buildUrl = (...paths) => {
    const queryObj = paths.reduce((prev, curr, index) => {
        if (typeof curr !== 'string' && typeof curr === 'object' && curr !== null) {
            paths.splice(index, 1)
            return Object.assign(prev || {}, curr)
        }
    }, undefined)
    return [prefix, ...paths].join('/').replace(/\/+/g, '/')
        + (queryObj ? `?${stringify(queryObj)}` : '')
}

const fetchJson = async (url, opts = {}) => {
    const res = await fetch((typeof window === 'undefined' ? API_URL : '') + url, {
        ...opts,
        timeout: 100000,
        headers: {
            ...(opts.headers || {}),
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    })

    if (res.ok) {
        if (res.status === 204) {
            return true
        }
        return res.json()
    } else {
        throw res
    }
}

/*
 called only by node.js
 */
export const whoami = headers => fetchJson(buildUrl('whoami'), { headers })
export const limits = headers => fetchJson(buildUrl('limits'), { headers })
export const collections = headers => fetchJson(buildUrl('collections'), { headers })
export const searchFields = headers => fetchJson(buildUrl('search_fields'), { headers })
export const search = async (headers, params, type, fieldList, missing, searchFields, uuid) => fetchJson(buildUrl('search'), {
    headers,
    method: 'POST',
    body: JSON.stringify(buildSearchQuery(params, type, fieldList, missing, searchFields, uuid)),
})

/*
 called only by browser
 */
export const doc = memoize((docUrl, pageIndex = 1) => fetchJson(
    buildUrl(docUrl, 'json', { children_page: pageIndex })
), (docUrl, pageIndex) => `${docUrl}/page/${pageIndex}`)

export const locations = memoize((docUrl, pageIndex) => fetchJson(
    buildUrl(docUrl, 'locations', { page: pageIndex })
), (docUrl, pageIndex) => `${docUrl}/page/${pageIndex}`)

export const tags = docUrl => fetchJson(buildUrl(docUrl, 'tags'))

export const tag = (docUrl, tagId) => fetchJson(buildUrl(docUrl, 'tags', tagId))

export const createTag = (docUrl, data) => fetchJson(buildUrl(docUrl, 'tags'), {
    method: 'POST',
    body: JSON.stringify(data)
})

export const updateTag = (docUrl, tagId, data) => fetchJson(buildUrl(docUrl, 'tags', tagId), {
    method: 'PATCH',
    body: JSON.stringify(data)
})

export const deleteTag = (docUrl, tagId) => fetchJson(buildUrl(docUrl, 'tags', tagId), { method: 'DELETE' })

export const batch = query => fetchJson(buildUrl('batch'), {
    method: 'POST',
    body: JSON.stringify(query),
})

export const collectionsInsights = () => fetchJson(buildUrl('collections'))

/*
 URL building only
 */
export const createDownloadUrl = (docUrl, filename) => buildUrl(docUrl, 'raw', filename)
export const createOcrUrl = (docUrl, tag) => buildUrl(docUrl, 'ocr', tag)
