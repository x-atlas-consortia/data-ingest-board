import log from 'xac-loglevel'
import { DuckDBInstance, BIGINT, VARCHAR, INTEGER, DATE, TIMESTAMP, DuckDBTimestampValue, dateValue } from '@duckdb/node-api';
import path from 'path';
import { getHeadersWith } from '@/lib/helpers/general';
import URLS from '@/lib/helpers/urls';

export default async function handler(req, res) {
    const dbPath = path.join(process.cwd(), 'data', 'usage-analytics.duckdb')
    //const instance = await DuckDBInstance.fromCache(':memory:');
    const instance = await DuckDBInstance.create(dbPath);
    const connection = await instance.connect();
    const tableName = 'api_usage';
    
    if (req.method === "POST") {
      const body = req.body;
      if (body.length === 0) {
        return res.status(404).json([])
      }
      const placeholder = body.map(() => '?').join(', ');

      const reader = await connection.runAndReadAll(`SELECT * from ${tableName} WHERE id IN (${placeholder});`, body);

      res.status(200).json(reader.getRowObjects())
    }
    else if (req.method === "PUT") {
      // const authHeader = req.headers.authorization || '';

      // if (!authHeader || !authHeader.startsWith('Bearer ')) {
      //   return res.status(401).json({ error: 'Missing or invalid Bearer token' });
      // }

      // // Extract the token string after "Bearer "
      // const token = authHeader.split(' ')[1];

      // const hasReadResponse = await fetch(URLS.ingest.privs.groups(), getHeadersWith(token))
      // const hasRead = await hasReadResponse.json()

      // if (hasRead.groups.length) {
      //   const data = req.body; 
      //   const result = await connection.run(`
      //   INSERT OR IGNORE INTO ip_address (id, country, region, city, longitude, latitude, zip) VALUES 
      //     ('${data.ip}', '${data.country}', '${data.region}', '${data.city}', ${data.longitude}, ${data.latitude}, '${data.zip}');
      // `);
      //   console.log('AFTER INSERT', result)
      //   const reader = await connection.runAndReadAll(`SELECT * from ip_address;`);

        
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
          VARCHAR,
      ]
        const columns = [
            "id",
            "host",
            "response_id",
            "request_date_time",
            "request_date",
            "request_year",
            "request_month",
            "response_code",
            "http_method",
            "resource_path",
            "resource_path_pattern",
            "client_ip",
            "user_agent",
            "entity_uuid",
            "country_code",
            "country_name",
            "region_name",
            "city_name",
            "zip_code",
            "user",
            "user_domain",
            "user_tld"
        ];
        const data = req.body; 
        const values = [];
        for (const c of columns) {
          if (c === 'request_date_time') {
            const jsDate = new Date(data[c]);
            const micros = BigInt(jsDate.getTime()) * 1000n;
            values.push(new DuckDBTimestampValue(micros))
          } else if (c === 'request_date') {
            const jsDate = new Date(data[c]);
            const daysSinceEpoch = Math.floor(jsDate.getTime() / 86400000);
            values.push(dateValue(daysSinceEpoch))
          } else {
            values.push(data[c] === undefined ? '' : data[c])
          }
          
          
        }
        

        // Safely quote column names and create placeholders ($1, $2, $3)
        const quotedCols = columns.map(col => `"${col.replace(/"/g, '""')}"`).join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const sql = `INSERT OR IGNORE INTO "${tableName}" (${quotedCols}) VALUES (${placeholders})`;

        console.log('SQL', sql, values)

        // Example execution using DuckDB Node.js (@duckdb/node-api) or prepared statement
        await connection.run(
          sql,
          values,
          types
        );
        // const stmt = await connection.prepare(sql);
        // stmt.bind(values);
        // await stmt.run();

        res.status(200).json({message: 'Success'})
      } else {
        return res.status(401).json({ error: 'Invalid method' });
      }

      
    }

  