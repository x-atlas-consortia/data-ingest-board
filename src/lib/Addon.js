
class Addon {

    constructor(ops, app) {
        this.ops = ops
        this.localLog(`Addon ${app}`)
    }

    currentTarget(e) {
        return $(e.currentTarget)
    }

    static isLocal() {
        return (location.host.indexOf('localhost') !== -1) || (location.host.indexOf('dev') !== -1)
    }

    static localLog(msg, fn = 'log', color = '#bada55') {
        if (Addon.isLocal()) {
            Addon.log(msg, fn, color)
        }
    }

    localLog(msg, fn = 'log', color = '#bada55') {
        Addon.localLog(msg, fn, color)
    }

    static log(msg, fn = 'log', color = '#bada55') {
        if (Addon.isLocal()) {
            console[fn](`%c ${msg}`, `background: #222; color: ${color}`)
        }
    }

    log(msg, fn = 'log') {
        Addon.log(msg, fn)
    }
}

export default Addon