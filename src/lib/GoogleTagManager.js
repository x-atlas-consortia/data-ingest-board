import Addon from "./Addon";
import {eq} from "./helpers/general";
const GoogleTagManager  = {

    constructor: (ops, app) => {
        Addon.constructor(ops, app)
        GoogleTagManager.ops = ops
        GoogleTagManager.prefixes = {
            action: 'js-gtm--btn-cta-'
        }
        GoogleTagManager.events()
    },

    currentTarget: (e) => {
        return $(e.currentTarget)
    },

    handleCta: (e) => {
        GoogleTagManager.event = 'cta'
        const classNames = Addon.currentTarget(e).attr('class')
        const pos = classNames.indexOf(GoogleTagManager.prefixes.action)
        if (pos !== -1) {
            const parts = classNames.substr(pos).split(' ') // remove anything after
            const action = parts[0].split(GoogleTagManager.prefixes.action)[1]
            let info = Addon.currentTarget(e).attr('data-gtm-info')
            if (eq(action, 'search')) {
                info = 'keyword: ' + Addon.currentTarget(e).parents('.c-search').find('input').val()
            }
            if (action && action.length) {
                GoogleTagManager.gtm({action, info})
            }
        }
    },

    handleFilter: (e) => {
        GoogleTagManager.event = 'filter'
        if (Addon.currentTarget(e).is(':checked')) {
            const filter = Addon.currentTarget(e).parents('.ant-dropdown-menu-title-content').find('> span').text()
            GoogleTagManager.gtm({filter})
        }
    },

    handleMenuItem: (e) => {
        e.stopPropagation()
        GoogleTagManager.event = 'cta'
        const txt = Addon.currentTarget(e).text()
        if (txt === 'Submit For Processing') {
            GoogleTagManager.gtm({filter: 'initiate-submit-for-processing'})
        }
    },

    handleModalCta: (e) => {
        GoogleTagManager.event = 'cta'
        const txt = Addon.currentTarget(e).text()
        if (txt === 'Submit') {
            GoogleTagManager.gtm({filter: 'submit-for-processing'})
        }
    },

    events: () => {
        const _t = GoogleTagManager
        $('body').on('click', `[class*="${_t.prefixes.action}"]`, (e)=>{
            _t.handleCta(e)
        })

        $('body').on('change', '.ant-table-filter-dropdown .ant-checkbox-input', (e)=>{
            _t.handleFilter(e)
        })

        $('body').on('click', '.ant-dropdown-menu-item .ant-dropdown-menu-title-content', (e)=> {
            _t.handleMenuItem(e)
        })

        $('body').on('click', '.ant-modal-footer .ant-btn-primary', (e)=> {
            _t.handleModalCta(e)
        })
    },

    getPath: () => {
        const href = window.location.href
        return href.length > 70 ? window.location.pathname : href;
    },

    hasUser: () => {
        return (GoogleTagManager.ops?.email !== null)
    },

    getContext: () => {
        if (!GoogleTagManager.hasUser()) return null
        return window.location.href.includes('entity_type=uploads') ? 'uploads' : 'datasets'
    },

    getPerson: (bto = false) => {
        if (!GoogleTagManager.hasUser()) return 'anonymous'
        const id = GoogleTagManager.ops.email
        let result
        if (id) {
            result = bto ? btoa(id.replace('@', '*')) : `${id.split('@')[0]}***`
        }
        return result
    },

    gtm: (args) => {
        let data = {
            event: GoogleTagManager.event,
            context: GoogleTagManager.getContext(),
            path: GoogleTagManager.getPath(),
            person: GoogleTagManager.getPerson(),
            user_id: GoogleTagManager.getPerson(true),
            ...args
        }
        if (Addon.isLocal()) {
            console.log(data)
        }
        dataLayer.push(data)
    }
}

export default GoogleTagManager