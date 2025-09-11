import ENVS from "./envs"

const ESQ = {
    dateRange: (from, to, field = 'timestamp') => {
        return {
            [field]: {
                "gte": from,
                "lt": to || "now"
            }
        }
    },
    fileDownloadDateRange: (from, to) => {
        return ESQ.dateRange(from, to, 'download_date_time')
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
    bucketStats: (field) => {
        return {
            "stats_bucket": {
                "buckets_path": `${field}._count`
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
    ownerFilter: (from, to) => {
        let filter = [
            {
                terms: {
                    owner: [`${ENVS.appContext().toLowerCase()}consortium`]
                }
            }]
        if (from) {
            filter.push(
                {
                    range: ESQ.dateRange(from, to)
                }
            )
        }
        return {
            bool: {
                filter
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
                        aggs: {
                            'type.keyword': {
                                terms: {
                                    field: 'type.keyword'
                                },
                                aggs: {
                                    count: ESQ.sum('count'),
                                    unique: ESQ.sum('uniques')
                                }
                            }

                        }
                    }

                }
            },
            apiUsage: {
                query: {
                    [queryField]: from ? ESQ.dateRange(new Date(from).getTime(), new Date(to).getTime()) : {}
                },
                track_total_hits: true,
                size: size,
                aggs: {
                    services: ESQ.bucket('host'),
                    endpoints: ESQ.bucket('resource_path_parameter')
                }
            },
            fileDownloads: {
                query: {
                    [queryField]: from ? ESQ.fileDownloadDateRange(from, to) : {}
                },
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
                        composite: ESQ.composite(['dataset_uuid']),
                        aggs: {
                            totalBytes: ESQ.sum('bytes_transferred'),
                        }
                    }
                }
            },
            fileDownloadsHistogram: {
                query: {
                    [queryField]: from ? ESQ.fileDownloadDateRange(from, to) : {}
                },
                size: 0,
                aggs: {
                    monthly: {
                        date_histogram: {
                            field: "download_date_time",
                            calendar_interval: "month",
                            format: "yyyy-MM"
                        },
                        aggs: {
                            totalBytes: ESQ.sum('bytes_transferred'),
                        }
                    }
                }
            }
        }
    }

}

export default ESQ