const Addon = {
    constructor: (ops, app) => {
        Addon.ops = ops
        Addon.localLog(`Addon ${app}`)
    },
    currentTarget: (e) => {
        return $(e.currentTarget)
    },
    isLocal: () => {
        return (location.host.indexOf('localhost') !== -1)
    },
    localLog: (msg, fn = 'log', color = '#bada55') => {
        if (Addon.isLocal()) {
            Addon.log(msg, fn, color)
        }
    },
    log: (msg, fn = 'log', color = '#bada55') => {
        if (Addon.isLocal()) {
            console[fn](`%c ${msg}`, `background: #222; color: ${color}`)
        }
    }
}

export default Addon