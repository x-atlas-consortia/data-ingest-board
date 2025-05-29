import {eq, parseJSON} from "./general";

const ENVS = {
    ubkg: {
        base: () => process.env.NEXT_PUBLIC_UBKG_BASE,
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
        entity: (path) => `${process.env.NEXT_PUBLIC_ENTITY_BASE}${path}`,
        portal: (path) => `${process.env.NEXT_PUBLIC_PORTAL_BASE}${path}`,
        ingest: {
            be: (path) => `${process.env.NEXT_PUBLIC_API_BASE}${path}`,
            fe: (path) => `${process.env.NEXT_PUBLIC_INGEST_BASE}${path}`,
        }
    },
    tableColumns: () => parseJSON(process.env.NEXT_PUBLIC_TABLE_COLUMNS),
    filterFields: () => parseJSON(process.env.NEXT_PUBLIC_FILTER_FIELDS),
    defaultFilterFields: () => parseJSON(process.env.NEXT_PUBLIC_DEFAULT_FILTER_FIELDS),
    excludeTableColumns: (cols)=> {
        cols = cols || parseJSON(process.env.NEXT_PUBLIC_EXCLUDE_TABLE_COLUMNS)
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
        const config = parseJSON(process.env.NEXT_PUBLIC_SEARCH_INDICES)
        return config[entity]
    },
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
    favicon: () => process.env.NEXT_PUBLIC_FAVICON || 'hubmap-favicon.ico',
    submissionTestingEnabled: () => process.env.NEXT_PUBLIC_SUBMISSION_TESTING_ENABLED === '1'
}

export default ENVS