export const indexFixtures = {
    apiUsage:  {date: 'request_date_time',},
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
    apiUsage: {
        summary: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: 'request_date_time'
            })
            return `SELECT host, COUNT(*) AS total_usage FROM api_usage ${whereClause} GROUP BY host`
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
                return `SELECT SUM(bytes_transferred) AS total_bytes_transferred FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months} MONTH`.trim()
            },
            filesDownloaded: ({ months = 12 }) => {
                return `SELECT COUNT(*) AS files_downloaded FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months} MONTH`.trim()
            },
            uniqueUsers: ({ months = 12 }) => {
                return `SELECT COUNT(DISTINCT user_name) AS unique_users FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months} MONTH`.trim()
            },
            uniqueOrganizations: ({ months = 12 }) => {
                return `SELECT COUNT(DISTINCT user_domain) AS unique_organizations FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months} MONTH`.trim()
            },
            uniqueCountries: ({ months = 12 }) => {
                return `SELECT COUNT(DISTINCT country_code) AS unique_countries FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months} MONTH`.trim()
            },
            uniqueEntities: ({ months = 12 }) => {
                return `SELECT COUNT(DISTINCT entity_uuid) AS unique_entities FROM file_download WHERE download_date_time >= CURRENT_DATE - INTERVAL ${months} MONTH`.trim()
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
            //return `WITH fd AS ( SELECT *, coalesce(nullif(trim(regexp_replace(dataset_type, '\s*\[.*\]$', '')), ''), 'NA') AS assay, date_trunc('month', download_date) AS mon FROM file_download ) SELECT user_domain AS org, mode(country_name) AS country, count(DISTINCT user_name) AS users, count(*) AS files, sum(bytes_transferred) AS total_bytes_transferred, count(DISTINCT entity_uuid) AS datasets, count(DISTINCT assay) AS assays, count(DISTINCT mon) AS active_months, strftime(min(download_date), '%Y-%m-%d') AS first_download, strftime(max(download_date), '%Y-%m-%d') AS last_download FROM fd ${whereClause} GROUP BY 1 ORDER BY total_bytes_transferred DESC;`
            //return `WITH fd AS ( SELECT *, coalesce(nullif(trim(regexp_replace(dataset_type, '\s*\[.*\]$', '')), ''), 'NA') AS assay, date_trunc('month', download_date) AS mon FROM file_download ) SELECT user_domain AS org, mode(country_name) AS country, count(DISTINCT user_name) AS users, count(*) AS files, round(sum(bytes_transferred) / 1e12, 4) AS tb, count(DISTINCT entity_uuid) AS datasets, count(DISTINCT assay) AS assays, count(DISTINCT mon) AS active_months, strftime(min(download_date), '%Y-%m-%d') AS first_download, strftime(max(download_date), '%Y-%m-%d') AS last_download FROM fd ${whereClause} GROUP BY 1 ORDER BY tb DESC;`
        },
        monthlyDatasetPullsTouched: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date,
                initialClauses: [`entity_type = 'Dataset'`, `coalesce(dataset_type, '') NOT LIKE 'Publication%'`]
            })
            return `SELECT DATE_TRUNC('month', download_date_time) AS time_bucket, count(DISTINCT (user_name, entity_uuid, download_date)) AS dataset_pulls, count(DISTINCT entity_uuid) AS datasets_touched FROM file_download ${whereClause} GROUP BY 1 ORDER BY 1 ASC`
        },
        perAssay: ({ from, to }) => {
            const whereClause = SQL.whereClause({
                from,
                to,
                field: indexFixtures.fileDownloads.date
            })
            //return `SELECT DATE_TRUNC('month', download_date_time) AS time_bucket, coalesce(nullif(trim(regexp_replace(dataset_type, '\s*\[.*\]$', '')), ''), 'NA') AS assay, SUM(bytes_transferred) AS total_bytes_transferred FROM file_download ${whereClause} GROUP BY ALL ORDER BY time_bucket ASC, assay ASC`
            return `WITH fd AS (   SELECT *,     coalesce(nullif(trim(regexp_replace(dataset_type, '\\s*\\[.*\\]$', '')), ''), 'NA') AS assay, date_trunc('month', download_date_time) AS mon  FROM file_download ), top_assays AS (SELECT assay FROM fd GROUP BY 1 ORDER BY sum(bytes_transferred) DESC LIMIT 7) SELECT mon AS time_bucket,   CASE WHEN assay IN (SELECT assay FROM top_assays) THEN assay ELSE 'Other' END AS assay, sum(bytes_transferred) AS total_bytes_transferred FROM fd ${whereClause} GROUP BY ALL ORDER BY time_bucket, assay;`
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
            return `WITH fd AS (   SELECT *,     coalesce(nullif(trim(regexp_replace(dataset_type, '\\s*\\[.*\\]$', '')), ''), 'NA') AS assay,       date_trunc('month', download_date_time) AS mon   FROM file_download ) SELECT dataset_type, assay,   count(*) AS files,   round(sum(bytes_transferred) / 1e12, 4) AS terabytes,   count(DISTINCT user_name) AS users,   count(DISTINCT entity_uuid) AS datasets,   count(DISTINCT user_tld) AS orgs,   round(median(bytes_transferred) / 1e6, 2) AS median_mb FROM fd ${whereClause} GROUP BY ALL ORDER BY terabytes DESC; `
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