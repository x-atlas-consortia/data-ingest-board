import axios from "axios";

export function some(s1, s2, insensitive = true) {
    let res = s1 === s2
    if (insensitive && s1 !== undefined && s2 !== undefined) {
        if (typeof s1 === 'string') {
            s1 = s1.split(',')
        }
        for (let t of s1) {
            if (eq(t, s2, insensitive)) {
                res = true
                break
            }
        }
    }
    return res
}

export function eq(s1, s2, insensitive = true) {
    let res = s1 === s2
    if (insensitive && s1 !== undefined && s2 !== undefined) {
        res = s1?.toLowerCase() === s2?.toLowerCase()
    }
    return res
}

export const roundToTheNearest = (num, exponentModifier = -1) => {
    const exponent = Math.floor(Math.log10(num)); 
    const magnitude = Math.pow(10, (exponent + exponentModifier)); 

    return Math.round(num / magnitude) * magnitude; 
}

export function toDateString(timestamp) {
    if (!timestamp || !timestamp.length) return ''
    const date = new Date(timestamp);
    let options = { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short' }
    return date.toUTCString()
}

export const formatNum = (num) => typeof num === 'number' ?  new Intl.NumberFormat().format(num) : 0

export const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes'
        if (bytes <= 1) return `${bytes} Byte`

        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

Object.assign(Array.prototype, {
    comprises(needle, insensitive = true) {
        return this.some((i) => eq(i, needle, insensitive))
    },
    keySort(obj) {
        const keys = this
        
        keys.sort();

        // Create a new object with sorted keys
        const sortedObject = {};
        for (const key of keys) {
            sortedObject[key] = obj[key];
        }
        return sortedObject
    }
})

Object.assign(String.prototype, {
    toCamelCase() {
        return this.replace(/\s(.)/g, function (a) {
            return a.toUpperCase();
        })
        .replace(/\s/g, '')
        .replace(/^(.)/, function (b) {
            return b.toLowerCase();
        });
    },
    toDashedCase() {
        return this
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .toLowerCase();
    },
    upCaseFirst() {
        if (this.length === 0) {
            return "";
        }
        return this.charAt(0).toUpperCase() + this.slice(1);
    },
    format() {
        let args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    }
})

export const getUBKGName = (o) => {
    if (!window.UBKG) return o
    let organTypes = window.UBKG?.organTypes
    for (let organ of organTypes) {
        if (organ.rui_code === o || organ.organ_uberon === o) {
            return organ.term
        }
    }
    return o
}

export const getRequestOptions = () => {
    return {
        headers: {
            'Content-Type': 'application/json'
        }
    };
}

export const getHeadersWith = (value, key = 'Authorization') => {
    const options = getRequestOptions()
    options.headers[key] = `Bearer ${value}`
    return options
}

export const callService = async (url, headers, payload = {}, method = 'put') => {
    try {
        return await axios({
            method: method,
            headers: headers,
            url: url,
            data: payload
        })
    } catch(e) {
        console.error(`${e}`)
        return {...e.response, raw: e}
    }
}

export const parseJSON = (obj) => {
    try {
        return JSON.parse(obj)
    } catch (e) {
        console.error(e)
    }
    return {}
}

export const storageKey = (key = '') => `ingest-board.${key}`

export const deleteFromLocalStorage = (needle, fn = 'startsWith') => {
    Object.keys(localStorage)
        .filter(x =>
            x[fn](needle))
        .forEach(x =>
            localStorage.removeItem(x))
}

export function autoBlobDownloader(data, type, filename) {
    const a = document.createElement('a')
    const url = window.URL.createObjectURL(new Blob(data, {type}))
    a.href = url
    a.download = filename
    document.body.append(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
}
