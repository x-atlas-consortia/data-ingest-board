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
    groupByField: (field = 'dataset_uuid') => {
        return {
            "field" : `${field}.keyword`,
            "inner_hits": {
                "name": "files",
                "size": 20,
                "sort": [{ [`${field}.keyword`]: "asc" }]
            },
            "max_concurrent_group_searches": 4
        }
    },
    sum: (field) => {
        return { "sum": { "field": field } }
    },
    bucket: (field) => {
        return {
            "terms": {
                "field": `${field}.keyword`,
                "size": 10000
            }
        }
    },
    indexQueries: (from, to) => {
        return {
            // TODO: restructure
            'logs-repos': {
                "query": {
                    [from ? 'range' : 'match_all']: from ? ESQ.dateRange(from, to, 'clones.clones.timestamp') : {}
                },
                "track_total_hits": true,
                //"size": 0,
                aggs: {
                    "repos": ESQ.bucket('host'),
                }
            },
            'logs-api-usage': {
                "query": {
                    [from ? 'range' : 'match_all']: from ? ESQ.dateRange(new Date(from).getTime(), new Date(to).getTime()) : {}
                },
                "track_total_hits": true,
                aggs: {
                    "services": ESQ.bucket('host'),
                    //"endpoints": ESQ.bucket('resource_path_parameter')
                }
            },
            'logs-file-downloads': {
                "query": {
                    [from ? 'range' : 'match_all']: from ? ESQ.fileDownloadDateRange(from, to) : {}
                },
                "track_total_hits": true,
                collapse: ESQ.groupByField(),
                aggs: {
                    "total_bytes": ESQ.sum('bytes_transferred'),
                    "datasets_uuids": ESQ.bucket('datasets_uuid')
                }
            }
        }
    }

}

export default ESQ