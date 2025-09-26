import ENVS from "./envs"
export const indexFixtures = {
    openSourceRepos: {date: 'timestamp',},
    apiUsage:  {date: 'datetime',},
    fileDownloads:  {date: 'download_date_time'} 
}

const ESQ = {
    dateRange: (from, to, field = 'timestamp') => {
        const isoSuffix = 'T00:00:00'
        if (typeof from === 'string') {
            from = from + isoSuffix
        }
        if (to && typeof to === 'string' && to !== 'now') {
            to = to + isoSuffix
        }
        return {
            [field]: {
                "gte": from,
                "lt": to || "now"
            }
        }
    },
    fileDownloadDateRange: (from, to) => {
        return ESQ.dateRange(from, to, indexFixtures.fileDownloads.date)
    },
    apiUsageDateRange: (from, to) => {
        return ESQ.dateRange(from, to, indexFixtures.apiUsage.date)
    },
    timeDateRange: (from, to) => {
        return ESQ.dateRange(new Date(from).getTime(), new Date(to).getTime())
    },
    groupByField: ({ size = 10, field = 'dataset_uuid' }) => {
        return {
            "field": `${field}.keyword`,
            "inner_hits": {
                "name": "files",
                "size": size,
                "sort": [{ [`${field}.keyword`]: "desc" }]
            },
            "max_concurrent_group_searches": 4
        }
    },
    groupSort: ({ sort = 'desc', field = 'dataset_uuid' }) => {
        return {
            "terms": {
                "field": `${field}.keyword`,
                "order": {
                    "_count": sort
                }
            }
        }
    },
    sum: (field) => {
        return { "sum": { "field": field } }
    },
    bucket: (field, count = 10000) => {
        return {
            "terms": {
                "field": `${field}.keyword`,
                "size": count
            }
        }
    },
    bucketHits: (field, count = 20) => {
        return {
            "terms": {
                "field": `${field}.keyword`,
                "size": count,
                "order": {
                  "_count": "desc"
                }
            }
        }
    },
    bucketCount: (field) => {
        return {
            "cardinality": {
                "field": `${field}.keyword`
            }
        }
    },
    composite: (fields, size = 1000) => {
        let sources = []
        for (let field of fields) {
            sources.push({
                [`${field}.keyword`]: {
                    terms: {
                        field: `${field}.keyword`
                    }
                }
            })
        }
        return {
            size,
            sources
        }
    },
    filter: (from, to, field, list = [], rangeFn) => {

        let filter = [
            {
                terms: {
                    [field]: list
                }
            }]
        if (from) {
            filter.push(
                {
                    range: rangeFn ? rangeFn(from, to) : ESQ.dateRange(from, to)
                }
            )
        }
        return {
            bool: {
                filter
            }
        }
    },
    ownerFilter: (from, to) => {
        return ESQ.filter(from, to, 'owner', [`${ENVS.appContext().toLowerCase()}consortium`])
    },
    reposAggs: (field = 'type', size = 20) => {
        return {
            [`${field}.keyword`]: {
                terms: {
                    size,
                    field: `${field}.keyword`
                },
                aggs: {
                    count: ESQ.sum('count'),
                    unique: ESQ.sum('uniques')
                }
            }

        }
    },
    calendarHistogram: ({ interval = 'month', format = 'yyyy-MM', field = 'timestamp' }) => {
        return {
            date_histogram: {
                field,
                calendar_interval: interval,
                format,
                order: {
                    _key: 'asc'
                }
            }
        }
    },
    filesCalendarHistogram: (ops) => {
        return {
            ...ESQ.calendarHistogram({ ...ops, field: "download_date_time" }),
            aggs: {
                totalBytes: ESQ.sum('bytes_transferred'),
            }
        }
    },
    reposCalendarHistogram: (ops) => {
        return {
            ...ESQ.calendarHistogram(ops),
            aggs: {
                'type.keyword': {
                    terms: {
                        field: "type.keyword"
                    },
                    aggs: {
                        count: ESQ.sum('count'),
                        unique: ESQ.sum('uniques')
                    }
                }
            }
        }
    },
    reposRepoCalendarHistogram: (ops, size) => {
        return {
            ...ESQ.calendarHistogram(ops),
            aggs: {
                'type.keyword': {
                    terms: {
                        field: "type.keyword"
                    },
                    aggs: ESQ.reposAggs('repository', size)
                }
            }
        }
    },
    apiUsageCalendarHistogram: (ops) => {
        return {
            ...ESQ.calendarHistogram({ ...ops, field: indexFixtures.apiUsage.date }),
            aggs: {
                'host.keyword': {
                    terms: {
                        field: "host.keyword"
                    },
                    aggs: {
                            endpoints: {
                                ...ESQ.bucketHits('resource_path_pattern'),
                                aggs: {
                                    endpoints: ESQ.bucketHits('resource_path')
                                }
                            } 
                        }
                }
            }
        }
    },
    indexQueries: ({ from, to, list, collapse, size = 0, field = 'uuid' }) => {
        const queryField = from ? 'range' : 'match_all'

        return {
            filter: {
                query: {
                    bool: {
                        filter: [
                            {
                                terms: {
                                    [field]: list
                                }
                            }
                        ]
                    }
                }
            },
            minDate: (dateField = 'timestamp') => {
                return {
                    "size": 1,
                    "sort": [
                        {
                            [dateField]: {
                                "order": "asc"
                            }
                        }
                    ],
                    "query": {
                        "match_all": {}
                    },
                    _source: [dateField]
                }
            },
            openSourceRepos: {
                query: ESQ.ownerFilter(from, to),
                size: 0,
                aggs: {
                    repos: ESQ.bucket('repository'),
                    buckets: {
                        composite: ESQ.composite(['type']),
                        aggs: {
                            count: ESQ.sum('count'),
                            unique: ESQ.sum('uniques')
                        }
                    }

                }
            },
            openSourceReposTable: {
                query: ESQ.ownerFilter(from, to),
                size: 0,
                aggs: {
                    buckets: {
                        composite: ESQ.composite(['repository'], size),
                        aggs: ESQ.reposAggs()
                    }
                }
            },
            openSourceReposHistogram: (ops) => {
                let query = ESQ.ownerFilter(from, to)
                query.bool.filter.push({
                    terms: {
                        ['repository.keyword']: list
                    }
                })
                return {
                    query,
                    size: 0,
                    aggs: {
                        calendarHistogram: ESQ.reposCalendarHistogram(ops)
                    }
                }
            },
            openSourceReposRepoHistogram: (ops) => {
                let query = ESQ.ownerFilter(from, to)
                query.bool.filter.push({
                    terms: {
                        ['repository.keyword']: list
                    }
                })
                return {
                    query,
                    size: 0,
                    aggs: {
                        calendarHistogram: ESQ.reposRepoCalendarHistogram(ops, list.length)
                    }
                }
            },
            apiUsage: {
                query: {
                    [queryField]: from ? ESQ.apiUsageDateRange(from, to) : {} 
                },
                track_total_hits: true,
                size: 0,
                aggs: {
                    services: {
                        ...ESQ.bucket('host'),
                        aggs: {
                            endpoints: {
                                ...ESQ.bucketHits('resource_path_pattern'),
                                aggs: {
                                    endpoints: ESQ.bucketHits('resource_path')
                                }
                            } ,
                            totalEndpoints: ESQ.bucketCount('resource_path_pattern'),
                        
                        }
                    }
                }
            },
            apiUsageHistogram: (ops = {}) => ({
                query: ESQ.filter(from, to, 'host.keyword', list, ESQ.apiUsageDateRange), 
                track_total_hits: true,
                size: 0,
                aggs: {
                    calendarHistogram: ESQ.apiUsageCalendarHistogram(ops)
                }
            }),
            fileDownloads: {
                query: {
                    [queryField]: from ? ESQ.fileDownloadDateRange(from, to) : {}
                },
                size: 0,
                track_total_hits: true,
                collapse: collapse ? ESQ.groupByField({ size: size }) : undefined,
                aggs: {
                    totalBytes: ESQ.sum('bytes_transferred'),
                    totalFiles: ESQ.bucketCount('relative_file_path'),
                    totalDatasets: ESQ.bucketCount('dataset_uuid'),

                }
            },
            fileDownloadsTable: {
                query: {
                    [queryField]: from ? ESQ.fileDownloadDateRange(from, to) : {}
                },
                size: 0,
                aggs: {
                    buckets: {
                        composite: ESQ.composite(['dataset_uuid'], size),
                        aggs: {
                            totalBytes: ESQ.sum('bytes_transferred'),
                        }
                    }
                }
            },
            fileDownloadsHistogram: (ops = {}) => ({
                query: {
                    [queryField]: from ? ESQ.fileDownloadDateRange(from, to) : {}
                },
                size: 0,
                aggs: {
                    calendarHistogram: ESQ.filesCalendarHistogram(ops)
                }
            }),
            fileDownloadsDatasetsHistogram: (ops = {}) => ({
                query: ESQ.filter(from, to, 'dataset_uuid', list, ESQ.fileDownloadDateRange),
                size: 0,
                aggs: {
                    "buckets": {
                        "terms": {
                            size: list.length,
                            "field": "dataset_uuid.keyword"
                        },
                        aggs: {
                            calendarHistogram: ESQ.filesCalendarHistogram(ops)
                        }
                    }
                }

            })
        }
    }

}

export default ESQ