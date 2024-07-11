class GoogleTagManager extends Addon {

    constructor(ops, app) {
        super(ops, app)
        this.prefixes = {
            action: 'js-gtm--btn-cta-'
        }
        this.events()
    }

    currentTarget(e) {
        return $(e.currentTarget)
    }

    handleCta(e) {
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
        if (txt === 'Submit For Processing') {
            this.gtm({filter: 'initiate-submit-for-processing'})
        }
    }

    handleModalCta(e) {
        this.event = 'cta'
        const txt = this.currentTarget(e).text()
        if (txt === 'Submit') {
            this.gtm({filter: 'submit-for-processing'})
        }
    }

    events() {
        const _t = this
        $('body').on('click', `[class*="${this.prefixes.action}"]`, (e)=>{
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
        return window.location.href.includes('entity_type=uploads') ? 'uploads' : 'datasets'
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
        console.log(data)
        dataLayer.push(data)
    }
}