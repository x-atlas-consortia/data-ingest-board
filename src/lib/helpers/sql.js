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
    }
  }
}

export default SQL