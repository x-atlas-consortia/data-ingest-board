class GoogleTagManager extends Addon {

    constructor(el, app) {
        super(el, app)
        this.prefixes = {
            action: 'js-gtm--btn-cta-'
        }
        this.events()
        return this
    }

    currentTarget(e) {
        return $(e.currentTarget)
    }

    handleCta(e) {
        e.stopPropagation()
        this.event = 'cta'
        const classNames = this.currentTarget(e).attr('class')
        const pos = classNames.indexOf(this.prefixes.action)
        if (pos !== -1) {
            const parts = classNames.substr(pos).split(' ') // remove anything after
            const action = parts[0].split(this.prefixes.action)[1]
            let info = this.currentTarget(e).attr('data-gtm-info')
            if (action.toLowerCase() === 'search') {
                info = 'keyword: ' + this.currentTarget(e).parents('.c-search').find('input').val()
            }
            if (action && action.length) {
                this.gtm({action, info})
            }
        }
    }

    handleFilter(e) {
        this.event = 'filter'
        if (this.currentTarget(e).is(':checked')) {
            const filter = this.currentTarget(e).parents('.ant-dropdown-menu-title-content').find('> span').text()
            this.gtm({filter})
        }
    }

    handleMenuItem(e) {
        e.stopPropagation()
        this.event = 'cta'
        const txt = this.currentTarget(e).text()
        let info = this.currentTarget(e).find('span')?.data('gtm-info')
        let action = this.currentTarget(e).find('span')?.data('gtm-action')
        this.gtm({info: info || `initiate-${txt.toDashedCase()}`, action})
    }

    handleModalCta(e) {
        this.event = 'cta'
        const txt = this.currentTarget(e).text()
        if (txt === 'Submit') {
            this.gtm({info: `submit-${$('.ant-modal-body h5').text().toDashedCase()}`})
        }
    }

    events() {
        const _t = this
        $('body').on('click', `[class*="${this.prefixes.action}"]`, (e)=>{
            e.stopImmediatePropagation()
            _t.handleCta(e)
        })

        $('body').on('change', '.ant-table-filter-dropdown .ant-checkbox-input', (e)=>{
            e.stopImmediatePropagation()
            _t.handleFilter(e)
        })

        $('body').on('click', '.ant-dropdown-menu-item .ant-dropdown-menu-title-content', (e)=> {
            e.stopImmediatePropagation()
            _t.handleMenuItem(e)
        })

        $('body').on('click', '.ant-modal-footer .ant-btn-primary', (e)=> {
            e.stopImmediatePropagation()
            _t.handleModalCta(e)
        })
    }

    getPath() {
        const href = window.location.href
        return href.length > 70 ? window.location.pathname : href;
    }

    hasUser() {
        return (this.ops?.email !== null)
    }

    getContext() {
        if (!this.hasUser()) return null
        if (window.location.href.includes('entity_type=uploads')) {
            return 'uploads'
        } else if (window.location.pathname == '/usage') {
            return 'usage'
        } else {
            return 'datasets'
        }
    }

    getPerson(bto = false) {
        if (!this.hasUser()) return 'anonymous'
        const id = this.ops.email
        let result
        if (id) {
            result = bto ? btoa(id.replace('@', '*')) : `${id.split('@')[0]}***`
        }
        return result
    }

    gtm(args) {
        let data = {
            event: this.event,
            context: this.getContext(),
            path: this.getPath(),
            person: this.getPerson(),
            user_id: this.getPerson(true),
            ...args
        }
        Addon.log('Pushing GTM info ...', {color: 'orange', data})
        dataLayer.push(data)
    }

    static gtm(args) {
        const model = new GoogleTagManager(args.el, {...args.info, app: 'self'})
        model.gtm(args.gtm)
    }

    
}