export const indexFixtures = {
    apiUsage:  {date: 'request_date_time',},
    fileDownloads:  {date: 'download_date_time'} 
}

const SQL = {
  whereClause: ({ from, to, field }) => {
    const whereClauses = []
    if (from) {
      whereClauses.push(`${field} >= '${from}'`)
    }
    if (to) {
      whereClauses.push(`${field} <= '${to}'`)
    }
    return whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
  },
  minDate: ({ table, field }) => {
    return `SELECT MIN(${field}) AS min_date FROM ${table}`
  },
  apiUsage: {
    summary: ({ from, to }) => {
      const whereClause = SQL.whereClause({ from, to, field: 'request_date_time' })
      return `SELECT host, COUNT(*) AS total_usage FROM api_usage ${whereClause} GROUP BY host`
    }
  },
  fileDownloads: {
    totalEntities: ({ from, to }) => {
      const whereClause = SQL.whereClause({ from, to, field: 'download_date_time' })
      return `SELECT COUNT(DISTINCT entity_uuid) AS total_entities FROM file_download ${whereClause}`.trim()
    },
    totalDownloads: ({ from, to }) => {
      const whereClause = SQL.whereClause({ from, to, field: 'download_date_time' })
      return `SELECT COUNT(*) AS total_downloads FROM file_download ${whereClause}`.trim()
    },
    totalBytesTransferred: ({ from, to }) => {
      const whereClause = SQL.whereClause({ from, to, field: 'download_date_time' })
      return `SELECT SUM(bytes_transferred) AS total_bytes_transferred FROM file_download ${whereClause}`.trim()
    },
    lastXMonths: {
      totalBytesTransferred: ({ months = 12}) => {
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
      },
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
      const whereClause = SQL.whereClause({ from, to, field: 'download_date_time' })
      return `SELECT DATE_TRUNC('month', download_date_time) AS time_bucket, count(*) AS files, sum(bytes_transferred) AS total_bytes_transferred, count(DISTINCT entity_uuid) AS datasets FROM file_download ${whereClause} GROUP BY 1 ORDER BY 1 ASC`
      //return `WITH fd AS ( SELECT *, coalesce(nullif(trim(regexp_replace(dataset_type, '\s*\[.*\]$', '')), ''), 'NA') AS assay, date_trunc('month', download_date) AS mon FROM file_download ) SELECT user_domain AS org, mode(country_name) AS country, count(DISTINCT user_name) AS users, count(*) AS files, sum(bytes_transferred) AS total_bytes_transferred, count(DISTINCT entity_uuid) AS datasets, count(DISTINCT assay) AS assays, count(DISTINCT mon) AS active_months, strftime(min(download_date), '%Y-%m-%d') AS first_download, strftime(max(download_date), '%Y-%m-%d') AS last_download FROM fd ${whereClause} GROUP BY 1 ORDER BY total_bytes_transferred DESC;`
      //return `WITH fd AS ( SELECT *, coalesce(nullif(trim(regexp_replace(dataset_type, '\s*\[.*\]$', '')), ''), 'NA') AS assay, date_trunc('month', download_date) AS mon FROM file_download ) SELECT user_domain AS org, mode(country_name) AS country, count(DISTINCT user_name) AS users, count(*) AS files, round(sum(bytes_transferred) / 1e12, 4) AS tb, count(DISTINCT entity_uuid) AS datasets, count(DISTINCT assay) AS assays, count(DISTINCT mon) AS active_months, strftime(min(download_date), '%Y-%m-%d') AS first_download, strftime(max(download_date), '%Y-%m-%d') AS last_download FROM fd ${whereClause} GROUP BY 1 ORDER BY tb DESC;`
    }
  }
}

export default SQL