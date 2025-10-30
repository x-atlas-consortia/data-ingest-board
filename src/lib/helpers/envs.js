import {eq, parseJSON} from "./general";

const ENVS = {
    ubkg: {
        base: () => process.env.NEXT_PUBLIC_UBKG_API_BASE,
        sab: () => process.env.NEXT_PUBLIC_APP_CONTEXT
    },
    theme: () => parseJSON(process.env.NEXT_PUBLIC_THEME),
    locale: () => {
        return process.env.NEXT_PUBLIC_LOCALE || 'en/hubmap'
    },
    isHM: () => {
        return eq(ENVS.appContext(), 'hubmap')
    },
    appContext: () => {
        return process.env.NEXT_PUBLIC_APP_CONTEXT || 'Hubmap'
    },
    urlFormat: {
        entity: (path) => `${process.env.NEXT_PUBLIC_ENTITY_API_BASE}${path}`,
        portal: (path) => `${process.env.NEXT_PUBLIC_PORTAL_BASE}${path}`,
        ingest: {
            be: (path) => `${process.env.NEXT_PUBLIC_API_BASE}${path}`,
            fe: (path) => `${process.env.NEXT_PUBLIC_INGEST_BASE}${path}`,
        },
        search: (val) => {
            let path = '/search'
            let base = process.env.NEXT_PUBLIC_SEARCH_API_BASE
            if (eq(typeof val, 'string')) {
                path = `/${val}${path}`
            } else {
                path = `/${val.index}${path}`
                base = val.url || base
            }
            return `${base}${path}`
        },
    },
    tableColumns: () => parseJSON(process.env.NEXT_PUBLIC_TABLE_COLUMNS),
    datasetFilterFields: () => parseJSON(process.env.NEXT_PUBLIC_DATASET_FILTER_FIELDS),
    sharedFilterFields: () => parseJSON(process.env.NEXT_PUBLIC_SHARED_FILTER_FIELDS),
    excludeTableColumns: (cols)=> {
        cols = cols || parseJSON(process.env.NEXT_PUBLIC_EXCLUDE_DATASET_TABLE_COLUMNS)
        const dict = {}
        for (let col of cols) {
            dict[col] = true
        }
        return dict
    },
    excludeTableColumnsUploads: ()=> {
        let cols = parseJSON(process.env.NEXT_PUBLIC_EXCLUDE_UPLOADS_TABLE_COLUMNS)
        if (!Object.entries(cols).length) {
            cols = []
        }
        return ENVS.excludeTableColumns(cols)
    },
    datasetCharts: () => parseJSON(process.env.NEXT_PUBLIC_DATASET_CHARTS),
    uploadsEnabled: () => process.env.NEXT_PUBLIC_UPLOADS_ENABLED === '1',
    searchEnabled: () => process.env.NEXT_PUBLIC_SEARCH_ENABLED === '1',
    searchIndices: (entity) => {
        const config = parseJSON(process.env.NEXT_PUBLIC_ENABLED_SEARCH_FIELDS)
        return config[entity]
    },
    logsIndicies: () => parseJSON(process.env.NEXT_PUBLIC_LOGS_SEARCH_API_INDICIES),
    idleTimeout: () => {
        let num = process.env.NEXT_PUBLIC_IDLE_TIME
        try {
            num = Number(num) || 1000
        } catch (e) {}
        return num * 60 * 60
    },
    cookieDomain: () => process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
    groupName: () => process.env.NEXT_PUBLIC_PRIVS_GROUP_NAME,
    getGoogleTagManagerId: () => process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER,
    bulkEditEnabled: () => process.env.NEXT_PUBLIC_BULK_EDIT_ENABLED === '1',
    bulkValidateEnabled: () => process.env.NEXT_PUBLIC_BULK_VALIDATE_ENABLED === '1',
    favicon: () => process.env.NEXT_PUBLIC_FAVICON || 'hubmap-favicon.ico',
    submissionTestingEnabled: () => process.env.NEXT_PUBLIC_SUBMISSION_TESTING_ENABLED === '1'
}

export default ENVS