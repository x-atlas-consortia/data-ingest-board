export const indexFixtures = {
    decimalPlaces: 4,
    apiRequests:  {date: 'request_date_time',},
    fileDownloads:  {date: 'download_date_time'} 
}

const SQL = {
    whereClause: ({ from, to, field, initialClauses = [] }) => {
        const whereClauses = [`${field} IS NOT NULL`, ...initialClauses]
        if (from) {
            whereClauses.push(`${field} >= '${from}'`)
        }
        if (to) {
            whereClauses.push(`${field} <= '${to}'`)
        }
        return whereClauses.length > 0
            ? `WHERE ${whereClauses.join(' AND ')}`
            : ''
    },
    minDate: ({ table, field }) => {
        return `SELECT MIN(${field}) AS min_date FROM ${table}`
    },
    wherePrior: ({ months = 12, field }) => {
        return `WHERE ${field} >= date_trunc('month', current_date) - INTERVAL ${months} MONTH AND ${field} < date_trunc('month', current_date)`
    },
    wherePriorToPrior: ({ months1 = 12, months2 = 24, field }) => {
        return `WHERE ${field} >= date_trunc('month', current_date) - INTERVAL ${months2} MONTH AND ${field} <  date_trunc('month', current_date) - INTERVAL ${months1} MONTH`
    },
    apiRequests: {
        summary: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.apiRequests.date
            })
            return `SELECT host, COUNT(*) AS total_usage FROM api_usage ${whereClause} GROUP BY host`
        },
        requestsPerDay: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.apiRequests.date
            })
            return `SELECT DATE_TRUNC('day', request_date_time) AS time_bucket, COUNT(*) AS requests, count(*) FILTER (WHERE host = 'search-api') AS search_api, count(*) FILTER (WHERE host = 'entity-api') AS entity_api, count(*) FILTER (WHERE host = 'uuid-api') AS uuid_api, count(DISTINCT client_ip) AS clients FROM api_usage ${whereClause} GROUP BY 1 ORDER BY 1 ASC`
        },
        monthly: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.apiRequests.date
            })
            return `SELECT DATE_TRUNC('month', request_date_time) AS time_bucket, COUNT(*) AS requests, count(*) FILTER (WHERE host = 'search-api') AS search_api, count(*) FILTER (WHERE host = 'entity-api') AS entity_api, count(*) FILTER (WHERE host = 'uuid-api') AS uuid_api, count(DISTINCT client_ip) AS clients, COUNT(DISTINCT entity_uuid) AS entities FROM api_usage ${whereClause} GROUP BY 1 ORDER BY 1 ASC`
        },
        requestsPerResponseCode: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.apiRequests.date
            })
            return `SELECT response_code, COUNT(*) AS requests FROM api_usage ${whereClause} GROUP BY response_code ORDER BY requests DESC`
        },
        requestsByTimeOfDay: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.apiRequests.date
            })
            return `SELECT isodow(request_date_time) AS dow, hour(request_date_time) AS hour, count(*) AS requests, count(DISTINCT client_ip) AS clients FROM api_usage ${whereClause} IS NOT NULL GROUP BY ALL ORDER BY 1, 2;`
        },
        endpoints: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.apiRequests.date
            })
            return `WITH au AS (   SELECT *,     CASE WHEN response_code >= 500 THEN '5xx' WHEN response_code >= 400 THEN '4xx' WHEN response_code >= 300 THEN '3xx' ELSE '2xx' END AS status_class,     coalesce(resource_path_pattern, '(unmatched)') AS endpoint,     strftime(date_trunc('month', request_date), '%Y-%m') AS month   FROM api_usage ) SELECT endpoint, host, coalesce(http_method, '(none)') AS http_method,   count(*) AS requests,   count(*) / (SELECT count(*) FROM api_usage) AS share,   count(DISTINCT client_ip) AS clients,   count(DISTINCT entity_uuid) AS entities,   avg((response_code >= 400 AND response_code < 500)::INT) AS rate_4xx,   avg((response_code >= 500)::INT) AS rate_5xx,   strftime(max(request_date), '%Y-%m-%d') AS last_call FROM au ${whereClause} GROUP BY ALL ORDER BY requests DESC;`
        },
        httpMethods: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.apiRequests.date
            })
            return `SELECT coalesce(http_method, '(none)') AS http_method,   count(*) AS requests,   count(*) FILTER (WHERE host = 'search-api') AS search_api,   count(*) FILTER (WHERE host = 'entity-api') AS entity_api,   count(*) FILTER (WHERE host = 'uuid-api') AS uuid_api FROM api_usage ${whereClause} GROUP BY 1 ORDER BY requests DESC;`
        },
        mostRequestedEntities: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.apiRequests.date
            })
            return `WITH f AS (     SELECT entity_uuid, any_value(application_id) AS application_id, any_value(dataset_type) AS dataset_type   FROM file_download   WHERE entity_type = 'Dataset' AND dataset_type NOT LIKE 'Publication%'     GROUP BY 1 ), e AS (   SELECT entity_uuid, count(*) AS requests, count(DISTINCT client_ip) AS clients, count(DISTINCT coalesce(resource_path_pattern, '(unmatched)')) AS endpoints,     strftime(max(request_date), '%Y-%m-%d') AS last_call   FROM api_usage WHERE entity_uuid IN (SELECT entity_uuid FROM f)   GROUP BY 1 ) SELECT e.entity_uuid, f.application_id, 'Dataset' AS entity_type, f.dataset_type,   e.requests, e.clients, e.endpoints, e.last_call FROM e JOIN f USING (entity_uuid) ORDER BY clients DESC, requests DESC, entity_uuid LIMIT 50;`
        },
        lastXMonths: {
            totalRequests: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.apiRequests.date })
                return `SELECT COUNT(*) AS total_requests FROM api_usage ${wherePriorClause}`.trim()
            },
            clientIps: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.apiRequests.date })
                return `SELECT COUNT(DISTINCT client_ip) AS unique_client_ips FROM api_usage ${wherePriorClause}`.trim()
            },
            entitiesRequested: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.apiRequests.date })
                return `SELECT COUNT(DISTINCT entity_uuid) AS unique_entities FROM api_usage ${wherePriorClause}`.trim()
            },
            errorRate: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.apiRequests.date })
                return `SELECT ROUND(SUM(CASE WHEN response_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), ${indexFixtures.decimalPlaces}) AS error_rate FROM api_usage ${wherePriorClause}`.trim()
            },
            serverErrors: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.apiRequests.date })
                return `SELECT ROUND(SUM(CASE WHEN response_code >= 500 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), ${indexFixtures.decimalPlaces}) AS error_rate FROM api_usage ${wherePriorClause}`.trim()
            }
        },
        priorToLastXMonths: {
            totalRequests: ({ months1 = 12, months2 = 24 }) => {
                const wherePriorClause = SQL.wherePriorToPrior({ months1, months2, field: indexFixtures.apiRequests.date })
                return `SELECT COUNT(*) AS total_requests FROM api_usage ${wherePriorClause}`.trim()
            },
            clientIps: ({ months1 = 12, months2 = 24 }) => {
                const wherePriorClause = SQL.wherePriorToPrior({ months1, months2, field: indexFixtures.apiRequests.date })
                return `SELECT COUNT(DISTINCT client_ip) AS unique_client_ips FROM api_usage ${wherePriorClause}`.trim()
            },
            entitiesRequested: ({ months1 = 12, months2 = 24 }) => {
                const wherePriorClause = SQL.wherePriorToPrior({ months1, months2, field: indexFixtures.apiRequests.date })
                return `SELECT COUNT(DISTINCT entity_uuid) AS unique_entities FROM api_usage ${wherePriorClause}`.trim()
            },
            errorRate: ({ months1 = 12, months2 = 24 }) => {
                const wherePriorClause = SQL.wherePriorToPrior({ months1, months2, field: indexFixtures.apiRequests.date })
                return `SELECT ROUND(SUM(CASE WHEN response_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), ${indexFixtures.decimalPlaces}) AS error_rate FROM api_usage ${wherePriorClause}`.trim()
            },
            serverErrors: ({ months1 = 12, months2 = 24 }) => {
                const wherePriorClause = SQL.wherePriorToPrior({ months1, months2, field: indexFixtures.apiRequests.date })
                return `SELECT ROUND(SUM(CASE WHEN response_code >= 500 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), ${indexFixtures.decimalPlaces}) AS error_rate FROM api_usage ${wherePriorClause}`.trim()
            }
        }
    },
    fileDownloads: {
        totalEntities: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            return `SELECT COUNT(DISTINCT entity_uuid) AS total_entities FROM file_download ${whereClause}`.trim()
        },
        totalDownloads: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            return `SELECT COUNT(*) AS total_downloads FROM file_download ${whereClause}`.trim()
        },
        totalBytesTransferred: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            return `SELECT SUM(bytes_transferred) AS total_bytes_transferred FROM file_download ${whereClause}`.trim()
        },
        lastXMonths: {
            totalBytesTransferred: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.fileDownloads.date })
                return `SELECT SUM(bytes_transferred) AS total_bytes_transferred FROM file_download ${wherePriorClause}`.trim()
            },
            filesDownloaded: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.fileDownloads.date })
                return `SELECT COUNT(*) AS files_downloaded FROM file_download ${wherePriorClause}`.trim()
            },
            uniqueUsers: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.fileDownloads.date })
                return `SELECT COUNT(DISTINCT user_name) AS unique_users FROM file_download ${wherePriorClause}`.trim()
            },
            uniqueOrganizations: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.fileDownloads.date })
                return `SELECT COUNT(DISTINCT user_domain) AS unique_organizations FROM file_download ${wherePriorClause}`.trim()
            },
            uniqueCountries: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.fileDownloads.date })
                return `SELECT COUNT(DISTINCT country_code) AS unique_countries FROM file_download ${wherePriorClause}`.trim()
            },
            uniqueEntities: ({ months = 12 }) => {
                const wherePriorClause = SQL.wherePrior({ months, field: indexFixtures.fileDownloads.date })
                return `SELECT COUNT(DISTINCT entity_uuid) AS unique_entities FROM file_download ${wherePriorClause}`.trim()
            }
        },
        priorToLastXMonths: {
            totalBytesTransferred: ({ months1 = 12, months2 = 24 }) => {
                return `SELECT SUM(bytes_transferred) AS total_bytes_transferred FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months2} MONTH AND download_date_time < CURRENT_DATE - INTERVAL ${months1} MONTH`.trim()
            },
            filesDownloaded: ({ months1 = 12, months2 = 24 }) => {
                return `SELECT COUNT(*) AS files_downloaded FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months2} MONTH AND download_date_time < CURRENT_DATE - INTERVAL ${months1} MONTH`.trim()
            },
            uniqueUsers: ({ months1 = 12, months2 = 24 }) => {
                return `SELECT COUNT(DISTINCT user_name) AS unique_users FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months2} MONTH AND download_date_time < CURRENT_DATE - INTERVAL ${months1} MONTH`.trim()
            },
            uniqueOrganizations: ({ months1 = 12, months2 = 24 }) => {
                return `SELECT COUNT(DISTINCT user_domain) AS unique_organizations FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months2} MONTH AND download_date_time < CURRENT_DATE - INTERVAL ${months1} MONTH`.trim()
            },
            uniqueCountries: ({ months1 = 12, months2 = 24 }) => {
                return `SELECT COUNT(DISTINCT country_code) AS unique_countries FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months2} MONTH AND download_date_time < CURRENT_DATE - INTERVAL ${months1} MONTH`.trim()
            },
            uniqueEntities: ({ months1 = 12, months2 = 24 }) => {
                return `SELECT COUNT(DISTINCT entity_uuid) AS unique_entities FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months2} MONTH AND download_date_time < CURRENT_DATE - INTERVAL ${months1} MONTH`.trim()
            }
        },
        monthly: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            return `SELECT DATE_TRUNC('month', download_date_time) AS time_bucket, count(*) AS files, sum(bytes_transferred) AS total_bytes_transferred, count(DISTINCT entity_uuid) AS datasets FROM file_download ${whereClause} GROUP BY 1 ORDER BY 1 ASC`
        },
        monthlyDatasetPullsTouched: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date,
                initialClauses: [`entity_type = 'Dataset'`, `coalesce(dataset_type, '') NOT LIKE 'Publication%'`]
            })
            return ` WITH pulls AS (   SELECT date_trunc('month', download_date_time) AS time_bucket,          user_name,          entity_uuid,          download_date   FROM file_download ${whereClause}   GROUP BY ALL ) SELECT time_bucket,        count(*) AS dataset_pulls,        count(DISTINCT entity_uuid) AS datasets_touched FROM pulls GROUP BY time_bucket ORDER BY time_bucket ASC`
        },
        perAssay: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            return `WITH all_time AS (  SELECT dataset_type, sum(bytes_transferred) AS bytes   FROM file_download   GROUP BY dataset_type ), top_assays AS (     SELECT coalesce(nullif(trim(regexp_replace(dataset_type, '\\s*\\[.*\\]$', '')), ''), 'NA') AS assay   FROM all_time   GROUP BY 1   ORDER BY sum(bytes) DESC   LIMIT 7 ), monthly AS (   SELECT date_trunc('month', download_date_time) AS mon,          dataset_type,          sum(bytes_transferred) AS bytes   FROM file_download  ${whereClause}   GROUP BY ALL ), labeled AS (   SELECT mon,          coalesce(nullif(trim(regexp_replace(dataset_type, '\\s*\\[.*\\]$', '')), ''), 'NA') AS assay,          bytes   FROM monthly ) SELECT mon AS time_bucket,        CASE WHEN assay IN (SELECT assay FROM top_assays) THEN assay ELSE 'Other' END AS assay,        sum(bytes) AS total_bytes_transferred FROM labeled GROUP BY ALL ORDER BY time_bucket, assay;`
        },
        activeUsers: ({ from, to }) => {
          const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            return `WITH fd AS (   SELECT *,     coalesce(nullif(trim(regexp_replace(dataset_type, '\\s*\\[.*\\]$', '')), ''), 'NA') AS assay,       date_trunc('month', download_date_time) AS mon   FROM file_download ), m AS (SELECT * FROM fd ${whereClause}), first_month AS (SELECT user_name, min(mon) AS first_mon FROM m GROUP BY 1) SELECT um.mon AS time_bucket,   count(*) AS users,   count(*) FILTER (WHERE um.mon = f.first_mon) AS new_users,   count(*) FILTER (WHERE um.mon > f.first_mon) AS returning_users FROM (SELECT DISTINCT user_name, mon FROM m WHERE user_name IS NOT NULL) um JOIN first_month f USING (user_name) GROUP BY um.mon ORDER BY um.mon;`
        },
        datasetTypes: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            return ` SELECT dataset_type,        coalesce(nullif(trim(regexp_replace(dataset_type, '\\s*\\[.*\\]$', '')), ''), 'NA') AS assay,        count(*) AS files,        round(sum(bytes_transferred) / 1e12, 4) AS terabytes,        count(DISTINCT user_name) AS users,        count(DISTINCT entity_uuid) AS datasets,        count(DISTINCT user_tld) AS orgs,        round(median(bytes_transferred) / 1e6, 2) AS median_mb FROM file_download ${whereClause} GROUP BY dataset_type ORDER BY terabytes DESC, dataset_type`
        },
        popularDatasets: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date,
                initialClauses: [`entity_type NOT IN ('UNRESOLVED', 'UNTRACKED')`]
            })
            return `SELECT application_id, entity_type,   any_value(dataset_type) AS dataset_type,   count(DISTINCT user_name) AS users,   count(DISTINCT user_tld) AS orgs,   count(*) AS files,   approx_count_distinct(relative_file_path) AS unique_files, round(sum(bytes_transferred) / 1e12, 4) AS terabytes,   strftime(max(download_date), '%Y-%m-%d') AS last_download FROM file_download ${whereClause} GROUP BY application_id, entity_type ORDER BY users DESC, terabytes DESC LIMIT 50;`
        },
        // Locations 
        locations: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            return `SELECT country_name AS country, country_code AS code,   count(*) AS files,   sum(bytes_transferred) AS total_bytes_transferred,   count(DISTINCT user_name) AS users,   count(DISTINCT user_tld) AS orgs,   count(DISTINCT entity_uuid) AS datasets,   count(DISTINCT city_name) AS cities FROM file_download ${whereClause} GROUP BY ALL ORDER BY total_bytes_transferred DESC`
        },
        organizations: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            return `WITH fd AS (   SELECT *,     coalesce(nullif(trim(regexp_replace(dataset_type, '\s*\[.*\]$', '')), ''), 'NA') AS assay,      date_trunc('month', download_date) AS mon   FROM file_download ) SELECT user_tld AS organization,   mode(country_name) AS country,   count(DISTINCT user_name) AS users,   count(*) AS files,   round(sum(bytes_transferred) / 1e12, 4) AS terabytes,   count(DISTINCT entity_uuid) AS datasets,   count(DISTINCT assay) AS assays,   count(DISTINCT mon) AS active_months,   strftime(min(download_date), '%Y-%m-%d') AS first_download,   strftime(max(download_date), '%Y-%m-%d') AS last_download FROM fd ${whereClause} GROUP BY 1 ORDER BY terabytes DESC LIMIT 50;`
        },
        topCities: ({ from, to }) => {  
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            return `SELECT city_name AS city, region_name AS region, country_name AS country,   count(*) AS files,   round(sum(bytes_transferred) / 1e12, 4) AS terabytes,   count(DISTINCT user_name) AS users FROM file_download ${whereClause} GROUP BY ALL ORDER BY terabytes DESC LIMIT 25;`
        }
    }
}

export default SQL