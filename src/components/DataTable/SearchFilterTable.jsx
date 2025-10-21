import React, {useEffect, useState} from 'react'
import { Table, Input } from 'antd';

function SearchFilterTable({ data, columns, tableProps, formatters = {} }) {
    const [searchText, setSearchText] = useState('')
    const [filteredData, setFilteredData] = useState(data)

    const handleSearch = (value) => {
        setSearchText(value);
        let _filtered = []
        let val
        let i = 0
        let added = {}
        for (let d of data) {
            for (let f in d) {
                val = d[f]
                if (formatters[f]) {
                    val = formatters[f](val)
                }
                if (val?.toString().toLowerCase().includes(value.toLowerCase()) && !added[i]) {
                    _filtered.push(d)
                    added[i] = true
                }
            }
            i++
        }
        setFilteredData(_filtered)
    };

    useEffect(()=> {
        setFilteredData(data)
    }, [data])

    return (
        <div className='c-tableWithSearch'>
            <Input.Search
                placeholder="Search all columns"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)} 
                style={{ marginBottom: 16 }}
            />
            <Table  dataSource={filteredData} columns={columns} {...tableProps} />
            
        </div>
    )
}

export default SearchFilterTable