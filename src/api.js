import fetch from 'isomorphic-fetch'
import memoize from 'lodash/memoize'
import { stringify } from 'qs'
import buildSearchQuery from './buildSearchQuery'

const api = {
    prefix: '/api/v0/',

    buildUrl: (...paths) => {
        const queryObj = paths.reduce((prev, curr, index) => {
            if (typeof curr !== 'string' && typeof curr === 'object' && curr !== null) {
                paths.splice(index, 1)
                return Object.assign(prev || {}, curr)
            }
        }, undefined)
        return [api.prefix, ...paths].join('/').replace(/\/+/g, '/')
            + (queryObj ? `?${stringify(queryObj)}` : '')
    },

    fetchJson: async (url, opts = {}) => {
        const apiUrl = typeof window === 'undefined' ? 'http://' + api.host + url : url
        const res = await fetch(apiUrl, {
            ...opts,
            credentials: 'same-origin',
            headers: {
                ...(opts.headers || {}),
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Cookie: api.cookie,
            },
        })

        if (res.ok) {
            return res.json();
        } else {
            throw await res.json()
        }
    },

    collections: memoize(() => api.fetchJson(api.buildUrl('collections'))),

    limits: memoize(() => api.fetchJson(api.buildUrl('limits'))),

    locationsFor: memoize((docUrl, pageIndex) => api.fetchJson(
        api.buildUrl(docUrl, 'locations', { page: pageIndex })
    ), (docUrl, pageIndex) => `${docUrl}/page/${pageIndex}`),

    doc: memoize((docUrl, pageIndex = 1) => api.fetchJson(
        api.buildUrl(docUrl, 'json', { children_page: pageIndex })
    ), (docUrl, pageIndex) => `${docUrl}/page/${pageIndex}`),

    whoami: () => api.fetchJson(api.buildUrl('whoami')),

    batch: query => api.fetchJson(api.buildUrl('batch'), {
        method: 'POST',
        body: JSON.stringify(query),
    }),

    search: params => api.fetchJson(api.buildUrl('search'), {
        method: 'POST',
        body: JSON.stringify(buildSearchQuery(params)),
    }),

    downloadUrl: (docUrl, filename) => api.buildUrl(docUrl, 'raw', filename),

    ocrUrl: (docUrl, tag) => api.buildUrl(docUrl, 'ocr', tag)
}

export default api
