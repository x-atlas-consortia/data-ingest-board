import { createContext, useEffect, useState, useRef} from 'react'

const UsageContext = createContext()

export const UsageProvider = ({ children }) => {

    const getIpDetails = async (ip) => {
        const result = await fetch(`/api/ip/location?q=${ip}`)
        const htmlString = await result.text();
        const parser = new DOMParser();

        // 2. Parse the string into a Document
        const doc = parser.parseFromString(htmlString, 'text/html');
        const table = doc.querySelector('#ipresult .card-body table');
        const rows = table.querySelectorAll('tr')
        const response = {ip}
        const keys = {
            'zip or postal code': {
                name: 'zip_code'
            },
            country: {
                name: 'country_name'
            },
            city: {
                name: 'city_name'
            },
            region: {
                name: 'region_name'
            },
            longitude: {
                formatter: parseFloat
            },
            latitude: {
                formatter: parseFloat
            }
        }
        
        for (let i = 0; i < Math.min(rows.length, 3); i++) {
        if (i === 1 || i === 2) {
            const tds = rows[i].querySelectorAll('td')
            for (const td of tds) {
            let value = Array.from(td.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join('');
            let key = td.querySelector('label').textContent.toLowerCase().trim()
            if (key === 'country') {
                value = td.querySelector('a').textContent.trim()
            }
            let formatter
            if (keys[key]) {
                formatter = keys[key].formatter
                key = keys[key].name || key
            }
            response[key] = formatter ? formatter(value) : value
            }
        }
        }
     
        return response
    }

    return (
        <UsageContext.Provider value={{ getIpDetails  }}>
            {children}
        </UsageContext.Provider>
    )
}

export default UsageContext