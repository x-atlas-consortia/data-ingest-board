import React from 'react';
import { Select, Space } from 'antd';

const ColumnToggle = ({columns, handleSelectionChange, hiddenColumns}) => {
    const options = [];
    for (let c of columns) {
        options.push({
            label: c.title,
            value: c.dataIndex,
        });
    }
    const handleChange = value => {
        handleSelectionChange(value)
        console.log(`selected ${value}`);
    };

    return (<Space className='c-table__columnToggle' direction="vertical">
        <Select
            mode="multiple"
            allowClear
            style={{width: '100%'}}
            placeholder="Choose columns to hide"
            defaultValue={hiddenColumns}
            onChange={handleChange}
            options={options}
        />
    </Space>)
};
export default ColumnToggle;