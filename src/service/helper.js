export function eq(s1, s2, insensitive = true) {
    let res = s1 === s2
    if (insensitive && s1 !== undefined && s2 !== undefined) {
        res = s1.toLowerCase() === s2.toLowerCase()
    }
    return res
}

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
    let organTypes = window.UBKG.organTypes
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
    options.headers[key] = value
    return options
}

const parseJSON = (obj) => {
    try {
        return JSON.parse(obj)
    } catch (e) {
        console.error(e)
    }
    return {}
}



export const ENVS = {
    ubkg: {
        base: () => process.env.NEXT_PUBLIC_UBKG_BASE,
        sab: () => process.env.NEXT_PUBLIC_UBKG_SAB
    },
    privsGroupReadName: () => process.env.NEXT_PUBLIC_PRIVS_READ_NAME,
    theme: () => parseJSON(process.env.NEXT_PUBLIC_THEME),
    locale: () => {
        return process.env.NEXT_PUBLIC_LOCALE || 'en/hubmap'
    },
    urlFormat: {
        portal: (path) => `${process.env.NEXT_PUBLIC_PORTAL_BASE}${path}`,
        ingest: {
            be: (path) => `${process.env.NEXT_PUBLIC_API_BASE}${path}`,
            fe: (path) => `${process.env.NEXT_PUBLIC_INGEST_BASE}${path}`,
        }
    },
    tableColumns: () => parseJSON(process.env.NEXT_PUBLIC_TABLE_COLUMNS),
    filterFields: () => parseJSON(process.env.NEXT_PUBLIC_FILTER_FIELDS),
    defaultFilterFields: () => parseJSON(process.env.NEXT_PUBLIC_DEFAULT_FILTER_FIELDS),
    excludeTableColumns: ()=> {
        let cols = parseJSON(process.env.NEXT_PUBLIC_EXCLUDE_TABLE_COLUMNS)
        const dict = {}
        for (let col of cols) {
            dict[col] = true
        }
        return dict
    },
    uploadsEnabled: () => process.env.NEXT_PUBLIC_UPLOADS_ENABLED === 1
}

let THEME_CONFIG
export const THEME = {
    cssProps: () => {
        const themeConfig = ENVS.theme()
        for (let t in themeConfig.cssProps) {
            document.body.style.setProperty(
                `--${t}`,
                `${themeConfig.cssProps[t]}`
            );
        }
    },
    getStatusColor: (status) => {
        status = status.toLowerCase()
        if (!THEME_CONFIG) {
            // Store this to avoid constantly parsing during table build
            THEME_CONFIG = ENVS.theme()
        }
        const statusColors = THEME_CONFIG.statusColors
        return statusColors[status] || statusColors.default || 'darkgrey'
    }
}

export const TABLE = {
    cols: {
        n: (k) => {
            const cols = ENVS.tableColumns()
            return cols[k].name || k
        },
        f: (k) => {
            const cols = ENVS.tableColumns()
            return cols[k].field || k
        }
    }
}

export const URLS = {
    portal: {
      main: () => process.env.NEXT_PUBLIC_PORTAL_BASE,
      view: (uuid, entity = 'dataset')  => {
          let path = process.env.NEXT_PUBLIC_PORTAL_VIEW_PATH.format(entity, uuid)
          return ENVS.urlFormat.portal(path)
      }
    },
    ingest: {
        main: () => process.env.NEXT_PUBLIC_INGEST_BASE,
        view: (uuid, entity = 'dataset') => {
            let path = process.env.NEXT_PUBLIC_INGEST_VIEW_PATH.format(entity, uuid)
            return ENVS.urlFormat.ingest.fe(path)
        },
        auth: {
          login: () => ENVS.urlFormat.ingest.be('/data-ingest-board-login'),
          logout: () => ENVS.urlFormat.ingest.be('/data-ingest-board-logout')
        },
        privs: {
            hasRW: () => ENVS.urlFormat.ingest.be(process.env.NEXT_PUBLIC_PRIVS_HAS_RW_PATH),
            userGroups: () => ENVS.urlFormat.ingest.be(process.env.NEXT_PUBLIC_PRIVS_GROUP_PATH)
        }
    }
}

export const ensureTrailingSlash = (url) => url.endsWith('/') ? url : `${url}/`