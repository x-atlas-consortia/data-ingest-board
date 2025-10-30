class Addon {

    constructor(el, args) {
        this.el = $(el)
        this.ops = args
        Addon.log(`Addons args of ${args.app}:`, {color: 'aqua', data: {el, args}})
    }

    currentTarget(e) {
        return $(e.currentTarget)
    }

    static observeMutations(apps, args) {
        const initAddon = ()=> {
            for (let app in apps) {
                document
                    .querySelectorAll(`[class*='js-${app}--'], [data-js-${app}], .js-app--${app}`)
                    .forEach((el) => {
                        if (!$(el).data(app)) {
                            $(el).data(app, new apps[app](el, {app, ...args }))
                        }
                    })
            }
        }

        const observer = new MutationObserver(initAddon)
        observer.observe(document.body,  { childList: true, subtree: true })
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