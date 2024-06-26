class Addon {

    constructor(ops, app) {
        this.ops = ops
        Addon.log(`Addons args of ${app}:`, {color: 'aqua', data: ops})
    }

    currentTarget(e) {
        return $(e.currentTarget)
    }

    static isLocal() {
        return (location.host.indexOf('localhost') !== -1) || (location.host.indexOf('dev') !== -1)
    }

    static log(msg, ops) {
        ops = ops || {}
        let {fn, color, data} = ops
        fn = fn || 'log'
        color = color || '#bada55'
        data = data || ''
        if (Addon.isLocal()) {
            console[fn](`%c ${msg}`, `background: #222; color: ${color}`, data)
        }
    }

    log(msg, fn = 'log') {
        Addon.log(msg, {fn})
    }
}