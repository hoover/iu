import React, { cloneElement } from 'react'
import url from 'url'
import copy from 'copy-text-to-clipboard'
import langs from 'langs'
import { Tooltip } from '@material-ui/core'
import { ELLIPSIS_TERM_LENGTH } from './constants/general'
import { DateTime } from 'luxon'
import { imageIcons, reactIcons } from './constants/icons'
import { specialTags } from './constants/specialTags'

const typeIconsMap = {
    folder: 'typeFolder',
    archive: 'typeArchive',
    email: 'typeEmail',
    pdf: 'typePdf',
    doc: 'typeDoc',
    xls: 'typeXls',
    'email-archive': 'typeEmailArchive',
    default: 'typeFile',
}

export const getTypeIcon = fileType => typeIconsMap[fileType] || typeIconsMap.default

export const getIconImageElement = fileType => {
    const img = document.createElement('img')
    img.src = (imageIcons[typeIconsMap[fileType]] || imageIcons[typeIconsMap.default])
    return img
}

export const getTagIcon = (tag, isPublic = false, absent = false) => {
    if (specialTags[tag]) {
        const state = absent ? 'absent' : 'present'
        if ((isPublic && specialTags[tag].public) || (!isPublic && !specialTags[tag].public)) {
            return cloneElement(reactIcons[specialTags[tag][state].icon], {
                style: {
                    color: specialTags[tag][state].color,
                },
            })
        }
    }
    return null
}

export const getLanguageName = key => {
    const found = langs.where('1', key)
    return found ? found.name : key
}

export const formatDateTime = dateTime => DateTime
    .fromISO(dateTime, { locale: 'en-US' })
    .toLocaleString(DateTime.DATETIME_FULL)

export const daysInMonth = date => {
    const [, year, month] = /(\d{4})-(\d{2})/.exec(date)
    return new Date(year, month, 0).getDate()
}

const intervalsList = ['year', 'month', 'week', 'day', 'hour']
export const getClosestInterval = range => {
    const from = range.from + 'T00:00:00'
    const to = range.to + 'T23:59:59'

    let selectedInterval = range.interval

    intervalsList.some(interval => {
        const intervalPlural = `${interval}s`
        const duration = DateTime.fromISO(to).diff(DateTime.fromISO(from), intervalPlural)

        if (duration[intervalPlural] > 1) {
            if (intervalsList.indexOf(interval) > intervalsList.indexOf(selectedInterval)) {
                selectedInterval = interval
            }
            return true
        }
    })

    return selectedInterval
}

export const getBasePath = docUrl => url.parse(url.resolve(docUrl, './')).pathname

export const makeUnsearchable = text => {
    let inMark = false;

    const chars = text.split('');

    return chars
        .map((c, i) => {
            if (c === '<') {
                const slice = text.slice(i);
                inMark =
                    slice.indexOf('<mark>') === 0 || slice.indexOf('</mark>') === 0;
            }

            if (c === '>') {
                const prefix = text.slice(i - 5, i);
                inMark = !(
                    prefix.indexOf('<mark') === 0 || prefix.indexOf('</mark')
                );
            }

            if (inMark || c === ' ' || c === '\n') {
                return c;
            } else {
                return `${c}<span class="no-find">S</span>`;
            }
        })
        .join('')
}

export const truncatePath = str => {
    if (str.length < 100) {
        return str;
    }
    const parts = str.split('/');

    return [
        ...parts.slice(0, parts.length / 3),
        '…',
        ...parts.slice(-(parts.length / 3)),
    ].join('/')
}

export const shortenName = (name, length = ELLIPSIS_TERM_LENGTH) => name && name.length > length ?
    <Tooltip title={name}>
        <span>{`${name.substr(0, 2/3*length-3)}...${name.substr(-1/3*length)}`}</span>
    </Tooltip> : name

export const formatThousands = n => {
    let decimalPart = ''
    n = n.toString()
    if ( n.indexOf( '.' ) !== -1 ) {
        decimalPart = '.'+ n.split( '.' )[1]
        n = parseInt(n.split( '.' )[0])
    }

    const array = n.toString().split( '' )
    let index = -3
    while ( array.length + index > 0 ) {
        array.splice( index, 0, ',' )
        // Decrement by 4 since we just added another unit to the array.
        index -= 4;
    }

    return array.join( '' ) + decimalPart
}

export const copyMetadata = doc => {
    const string = [doc.content.md5, doc.content.path].join('\n');

    return copy(string)
        ? `Copied MD5 and path to clipboard`
        : `Could not copy meta metadata – unsupported browser?`
};

const documentUrlPrefix = '/doc'
export const collectionUrl = collection => [documentUrlPrefix, collection].join('/')
export const documentViewUrl = item => [documentUrlPrefix, item._collection, item._id].join('/')
export const getPreviewParams = item => ({ preview: { c: item._collection, i: item._id } })

export const removeCommentsAndSpacing = (str = '') =>
    str.replace(/\/\*.*\*\//g, ' ').replace(/\s+/g, ' ')

export const humanFileSize = (bytes, si= true, dp= 1) => {
    const thresh = si ? 1000 : 1024

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B'
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    let u = -1
    const r = 10**dp

    do {
        bytes /= thresh
        ++u
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)


    return bytes.toFixed(dp) + ' ' + units[u]
}

export const titleCase = string => {
    let sentence = string.toLowerCase().split('_')
    return sentence.map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
}

export const formatTitleCase = name => {
    const [group, func] = name.split('.')
    return (
        <>
            <strong>{titleCase(group)}</strong>: {titleCase(func)}
        </>
    )
}
