import axios from "axios";

export function eq(s1, s2, insensitive = true) {
    let res = s1 === s2
    if (insensitive && s1 !== undefined && s2 !== undefined) {
        res = s1.toLowerCase() === s2.toLowerCase()
    }
    return res
}

export function toDateString(timestamp) {
    const date = new Date(timestamp);
    let options = { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short' }
    return date.toUTCString()
}

Object.assign(Array.prototype, {
    comprises(needle, insensitive = true) {
        return this.some((i) => eq(i, needle, insensitive))
    }
})

String.prototype.format = function() {
    let args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
    });
};

export const getUBKGName = (o) => {
    if (!window.UBKG) return o
    let organTypes = window.UBKG?.organTypes
    for (let organ of organTypes) {
        if (organ.rui_code === o) {
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
