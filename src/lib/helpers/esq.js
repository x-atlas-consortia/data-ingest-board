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
    indexQueries: ({ from, to, list, collapse, size = 0, field = 'uuid' }) => {
        const queryField = from ? 'range' : 'match_all'
        return {
            // TODO: restructure
            'logs-repos': {
                query: {
                    [queryField]: from ? ESQ.dateRange(from, to, 'clones.clones.timestamp') : {}
                },
                track_total_hits: true,
                aggs: {
                    repos: ESQ.bucket('host'),
                }
            },
            'logs-api-usage': {
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
            'logs-file-downloads': {
                query: {
                    [queryField]: from ? ESQ.fileDownloadDateRange(from, to) : {}
                },
                track_total_hits: true,
                collapse: collapse ? ESQ.groupByField({ size: size }) : undefined,
                aggs: {
                    totalBytes: ESQ.sum('bytes_transferred'),
                    //datasetGroups: ESQ.bucket('dataset_uuid'),
                    //files: ESQ.bucket('relative_file_path'),
                    totalFiles: ESQ.bucketCount('relative_file_path'),
                    totalDatasets: ESQ.bucketCount('dataset_uuid'),

                }
            },
            filter: {
                "query": {
                    "bool": {
                        "filter": [
                            {
                                "terms": {
                                    [field]: list
                                }
                            }
                        ]
                    }
                }
            },
            filesBucketSearch: {
                query: {
                    [queryField]: from ? ESQ.fileDownloadDateRange(from, to) : {}
                },
                "size": 0,
                "aggs": {
                    "dataset_buckets": {
                        "composite": {
                            "size": size,
                            "sources": [
                                {
                                    "dataset_uuid.keyword": {
                                        "terms": {
                                            "field": "dataset_uuid.keyword"
                                        }
                                    }
                                }
                            ]
                        },
                        "aggs": {
                            "file_download_count": {
                                "value_count": {
                                    "field": "_id"
                                }
                            },
                            "dataset_count_sort": {
                                "bucket_sort": {
                                    "sort": [
                                        {
                                            "file_download_count": {
                                                "order": "desc"
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        }
    }

}

export default ESQ