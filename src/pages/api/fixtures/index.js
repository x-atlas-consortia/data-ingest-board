import log from 'xac-loglevel'
import {
    DuckDBInstance,
    BIGINT,
    VARCHAR,
    INTEGER,
    DATE,
    TIMESTAMP,
    DuckDBTimestampValue,
    dateValue
} from '@duckdb/node-api'
import path from 'path'

// A local sample db helper
export default async function handler(req, res) {
    if (req.method === 'GET') {
        const ip = req.query.ip
        const result = await fetch(
            `https://www.geolocation.com/?ip=${ip}#ipresult`
        )
        const html = await result.text()
        res.status(200).send(html)
    } else {
        const dbPath = path.join(
            process.cwd(),
            'data',
            'usage-analytics.duckdb'
        )
        const instance = await DuckDBInstance.create(dbPath)
        const connection = await instance.connect()
        const tableName = 'api_usage'

        if (req.method === 'POST') {
            const body = req.body
            const query = body?.query

            const reader = await connection.runAndReadAll(query)

            res.status(200).json(reader.getRowObjects())
        } else if (req.method === 'PUT') {
            const types = [
                BIGINT,
                VARCHAR,
                VARCHAR,
                TIMESTAMP,
                DATE,
                INTEGER,
                INTEGER,
                INTEGER,
                VARCHAR,
                VARCHAR,
                VARCHAR,
                VARCHAR,
                VARCHAR,
                VARCHAR,
                VARCHAR,
                VARCHAR,
                VARCHAR,
                VARCHAR,
                VARCHAR,
                VARCHAR,
                VARCHAR
            ]
            const columns = [
                'id',
                'host',
                'response_id',
                'request_date_time',
                'request_date',
                'request_year',
                'request_month',
                'response_code',
                'http_method',
                'resource_path',
                'resource_path_pattern',
                'client_ip',
                'user_agent',
                'entity_uuid',
                'country_code',
                'country_name',
                'region_name',
                'city_name',
                'zip_code',
                'user',
                'user_domain',
                'user_tld'
            ]
            const data = req.body
            const values = []
            for (const c of columns) {
                if (c === 'request_date_time') {
                    const jsDate = new Date(data[c])
                    const micros = BigInt(jsDate.getTime()) * 1000n
                    values.push(new DuckDBTimestampValue(micros))
                } else if (c === 'request_date') {
                    const jsDate = new Date(data[c])
                    const daysSinceEpoch = Math.floor(
                        jsDate.getTime() / 86400000
                    )
                    values.push(dateValue(daysSinceEpoch))
                } else {
                    values.push(data[c] === undefined ? '' : data[c])
                }
            }

            // Safely quote column names and create placeholders ($1, $2, $3)
            const quotedCols = columns
                .map((col) => `"${col.replace(/"/g, '""')}"`)
                .join(', ')
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

            const sql = `INSERT OR IGNORE INTO "${tableName}" (${quotedCols}) VALUES (${placeholders})`

            
            try {
              console.log('SQL', sql, values)

              // Example execution using DuckDB Node.js (@duckdb/node-api) or prepared statement
              await connection.run(sql, values, types)
            } finally {
              // Explicitly close the connection (equivalent to connection.disconnectSync())
              connection.closeSync();
            }
            instance.closeSync();

            res.status(200).json({ message: 'Success' })
        } else {
            return res.status(401).json({ error: 'Invalid method' })
        }
    }
}
