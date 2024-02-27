import {Dropdown, Tooltip} from "antd";
import React from "react";
import {CaretDownOutlined} from "@ant-design/icons";

export function eq(s1, s2, insensitive = true) {
    let res = s1 === s2
    if (insensitive && s1 !== undefined && s2 !== undefined) {
        res = s1.toLowerCase() === s2.toLowerCase()
    }
    return res
}

export function toDateString(timestamp) {
    const date = new Date(timestamp);
    let options = { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short' }
    return date.toUTCString()
}

Object.assign(Array.prototype, {
    comprises(needle, insensitive = true) {
        return this.some((i) => eq(i, needle, insensitive))
    }
})

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
    if (!window.UBKG) return o
    let organTypes = window.UBKG?.organTypes
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
    options.headers[key] = `Bearer ${value}`
    return options
}

export const parseJSON = (obj) => {
    try {
        return JSON.parse(obj)
    } catch (e) {
        console.error(e)
    }
    return {}
}

export const storageKey = (key = '') => `ingest-board.${key}`

export const deleteFromLocalStorage = (needle, fn = 'startsWith') => {
    Object.keys(localStorage)
        .filter(x =>
            x[fn](needle))
        .forEach(x =>
            localStorage.removeItem(x))
}

export const ENVS = {
    ubkg: {
        base: () => process.env.NEXT_PUBLIC_UBKG_BASE,
        sab: () => process.env.NEXT_PUBLIC_APP_CONTEXT
    },
    theme: () => parseJSON(process.env.NEXT_PUBLIC_THEME),
    locale: () => {
        return process.env.NEXT_PUBLIC_LOCALE || 'en/hubmap'
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
    excludeTableColumns: ()=> {
        let cols = parseJSON(process.env.NEXT_PUBLIC_EXCLUDE_TABLE_COLUMNS)
        const dict = {}
        for (let col of cols) {
            dict[col] = true
        }
        return dict
    },
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
}

let THEME_CONFIG
export const THEME = {
    colors: () => {
      return THEME.lightColors().concat(THEME.darkColors())
    },
    lightColors: () => {
        return [
            '#68bdf6', // light blue
            '#6dce9e', // green #1
            '#faafc2', // light pink
            '#f2baf6', // purple
            '#ff928c', // light red
            '#fcea7e', // light yellow
            '#ffc766', // light orange
            '#78cecb', // green #2,
            '#b88cbb', // dark purple
        ];
    },
    darkColors: () => {
       return [
           // DARK COLORS
           '#405f9e', // navy blue
           '#e84646', // dark red
           '#fa5f86', // dark pink
           '#ffab1a', // dark orange
           '#fcda19', // dark yellow
           '#c9d96f', // pistacchio
           '#47991f', // green #3
           '#ff75ea'  // pink
       ];
    },
    isLightColor: (r, g, b) => {
        let hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))
        return hsp > 127.5
    },
    randomColor: () => {
        let hexTab = "5555556789ABCDEF";
        let r = hexTab[ Math.floor( Math.random() * 16) ];
        let g = hexTab[ Math.floor( Math.random() * 16) ];
        let b = hexTab[ Math.floor( Math.random() * 16) ];
        return {color: "#" + r + g + b, light: THEME.isLightColor(r, g, b)};
    },
    cssProps: () => {
        const themeConfig = ENVS.theme()
        for (let t in themeConfig.cssProps) {
            document.body.style.setProperty(
                `--${t}`,
                `${themeConfig.cssProps[t]}`
            );
        }
        document.documentElement.classList.add(`theme--${themeConfig.theme || 'dark'}`)
    },
    getStatusColor: (status) => {
        status = status.toLowerCase()
        if (!THEME_CONFIG) {
            // Store this to avoid constantly parsing during table build
            THEME_CONFIG = ENVS.theme()
        }
        const statusColors = THEME_CONFIG.statusColors || {}
        const colors =  statusColors[status]?.split(':')
        const bg = colors ? colors[0] : (statusColors.default || 'darkgrey')
        const text = colors && colors.length > 1 ? colors[1] : 'white'
        return {bg, text}
    }
}

export const TABLE = {
    cols: {
        n: (k, n) => {
            const cols = ENVS.tableColumns()
            return cols[k]?.name || n || k
        },
        f: (k) => {
            const cols = ENVS.tableColumns()
            return cols[k]?.field || k
        }
    },
    getStatusDefinition: (status, entityType = 'Dataset') => {
        let msg
        if (status) {
            status = status.toUpperCase();
            switch(status) {
                case 'NEW':
                    msg = <span>The Globus directory is ready for data upload.</span>
                    break;
                case 'INCOMPLETE':
                    msg = <span>The data provider has begun to upload data but is not ready for validation or processing via the ingest pipeline.</span>
                    break;
                case 'INVALID':
                    msg = <span>The data did not pass validation prior to processing via the ingest pipeline.</span>
                    break;
                case 'QA':
                    msg = <span>The data has been successfully processed via the ingest pipeline and is awaiting data provider curation.</span>
                    break;
                case 'ERROR':
                    msg = <span>An error occurred during processing via the ingest pipeline.</span>
                    break;
                case 'PROCESSING':
                    msg = <span>The data is currently being processed via the ingest pipeline.</span>
                    break;
                case 'REORGANIZED':
                    msg = <span>Datasets included in this <code>Upload</code> have been registered and data has been reorganized on the Globus Research Management system.</span>
                    break;
                case 'SUBMITTED':
                    msg = <span>The data provider has finished uploading data and the data is ready for validation.</span>
                    break;
                case 'PUBLISHED':
                    msg = <span>The data has been successfully curated and released for public use.</span>
                    break;
                default:
                    msg = <span>The <code>{entityType}</code> has been {status}.</span>
                    break;
            }
        }
        return msg;
    },
    getStatusFilters: (entityTypeFilters) => {
        const filters = [
            {text: 'Error', value: 'error'},
            {text: 'Invalid', value: 'invalid'},
            {text: 'New', value: 'new'},
            {text: 'Processing', value: 'processing'},
            {text: 'Submitted', value: 'submitted'},
            {text: 'Incomplete', value: 'incomplete'},
        ]
        return filters.concat(entityTypeFilters)
    },
    countFilteredRecords: (data, filters, dataIndexList, special) => {
        const filteredData = data.filter(item => {
            for (const key in filters) {
                if (!dataIndexList.includes(key) || !filters[key]) {
                    continue;
                }
                const filterValue = filters[key].toLowerCase();
                const filterValues = filterValue.split(",");
                if (filterValues.includes(special.case1)) {
                    if (eq(item[key], special.case2)) {
                        return false;
                    }
                } else if (item[key] && !filterValues.some(value => eq(item[key], value))) {
                    return false;
                } else if (!item[key]) {
                    return false;
                }
            }
            return true;
        });
        return filteredData;
    },
    flattenDataForCSV: (data) => {
        return data.map(item => {
            for (const key in item) {
                if (['last_touch', 'created_timestamp', 'published_timestamp'].comprises(key)) {
                    item[key] = toDateString(item[key])
                }

                if (['processed_datasets', 'descendant_datasets', 'descendants'].comprises(key)) {
                    delete item[key]
                }
                if (Array.isArray(item[key])) {
                    // Convert objects to string representations
                    item[key] = item[key].map(element => (typeof element === 'object' ? JSON.stringify(element).replace(/"/g, '""') : element));

                    // Convert other arrays to comma-delimited strings
                    if (Array.isArray(item[key])) {
                        item[key] = `${item[key].join(', ')}`;
                    }
                }
            }
            return item;
        })
    },
    renderDropdownContent: (record) => {
        const items = [
            {
                key: '1',
                label: (
                    <a href={URLS.portal.view(record.uuid)} target="_blank" rel="noopener noreferrer">Data Portal</a>
                )
            }
        ]

        if (!eq(URLS.portal.main(), URLS.ingest.main())) {
            items.push(
                {
                    key: '2',
                    label: (
                        <a href={URLS.ingest.view(record.uuid)} target="_blank" rel="noopener noreferrer">Ingest Portal</a>
                    )
                }
            )
        }

        items.push(
            {
                key: '3',
                label: (
                    <a href={record.globus_url} target="_blank" rel="noopener noreferrer">Globus Directory</a>
                )
            }
        )

        return items
    },
    reusableColumns: (defaultSortOrder, defaultFilteredValue) => {
        return {
            id: {
                title: TABLE.cols.n('id'),
                width: 190,
                dataIndex: TABLE.cols.f('id'),
                align: "left",
                defaultSortOrder: defaultSortOrder[TABLE.cols.f('id')] || null,
                sorter: (a,b) => a[TABLE.cols.f('id')].localeCompare(b[TABLE.cols.f('id')]),
                ellipsis: true,
                render: (id, record) => (
                    <Dropdown menu={{items: TABLE.renderDropdownContent(record)}} trigger={['click']}>
                        <a href="#" onClick={(e) => e.preventDefault()} className='lnk--ic'>{id} <CaretDownOutlined style={{verticalAlign: 'middle'}} /></a>
                    </Dropdown>
                )
            },
            status: {
                title: "Status",
                width: 150,
                dataIndex: "status",
                align: "left",
                defaultSortOrder: defaultSortOrder["status"] || null,
                sorter: (a,b) => a.status.localeCompare(b.status),
                defaultFilteredValue: defaultFilteredValue["status"] || null,
                ellipsis: true,
                filters: TABLE.getStatusFilters( [
                    {text: 'Unpublished', value: 'unpublished'},
                    {text: 'Published', value: 'published'},
                    {text: 'QA', value: 'qa'}
                ]),
                onFilter: (value, record) => {
                    if (eq(value, 'Unpublished')) {
                        return !eq(record.status, 'published');
                    }
                    return eq(record.status, value);
                },
                render: (status) => (
                    <Tooltip title={TABLE.getStatusDefinition(status)}>
                    <span className={`c-badge c-badge--${status.toLowerCase()}`} style={{backgroundColor: THEME.getStatusColor(status).bg, color: THEME.getStatusColor(status).text}}>
                        {status}
                    </span>
                    </Tooltip>

                )
            }
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
    entity: {
       revisions: (uuid) => {
           let path = process.env.NEXT_PUBLIC_REVISIONS_PATH.format(uuid)
           return ENVS.urlFormat.entity(path)
       }
    },
    ingest: {
        data: {
          datasets: () => process.env.NEXT_PUBLIC_DATASET_URL,
          uploads: () => process.env.NEXT_PUBLIC_UPLOAD_URL
        },
        main: () => process.env.NEXT_PUBLIC_INGEST_BASE,
        view: (uuid, entity = 'dataset') => {
            let path = process.env.NEXT_PUBLIC_INGEST_VIEW_PATH.format(entity, uuid)
            return ENVS.urlFormat.ingest.fe(path)
        },
        privs: {
            groups: () => process.env.NEXT_PUBLIC_PRIVS_GROUP_URL
        },
        auth: {
          login: () => ENVS.urlFormat.ingest.be('/data-ingest-board-login'),
          logout: () => ENVS.urlFormat.ingest.be('/data-ingest-board-logout')
        }
    }
}