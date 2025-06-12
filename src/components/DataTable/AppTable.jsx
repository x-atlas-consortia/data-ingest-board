import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import TABLE from "@/lib/helpers/table";
import {Table} from "antd";
import AppTableContext from "@/context/TableContext";

function AppTable({ countFilteredRecords, data, filters, rawData, page, pageSize, handleTableChange, rowSelection, loading}) {
    const {columns, TableBodyCell, TableHeaderCell} = useContext(AppTableContext)

    useEffect(() => {
    }, [])

    return (
        <Table className={`c-table--main ${countFilteredRecords(data, filters).length > 0 ? '' : 'no-data'}`}
               columns={columns}
               dataSource={countFilteredRecords(rawData, filters)}
               showHeader={!loading}
               bordered={false}
               loading={loading}
               pagination={{ ...TABLE.paginationOptions, current: page, defaultPageSize: pageSize}}
               scroll={{ x: 1500, y: 1500 }}
               onChange={handleTableChange}
               rowKey={TABLE.cols.f('id')}
               rowSelection={{
                   type: 'checkbox',
                   ...rowSelection,
               }}
               components={{
                   header: { cell: TableHeaderCell },
                   body: { cell: TableBodyCell },
               }}
        />
    )
}

AppTable.defaultProps = {}

AppTable.propTypes = {
    children: PropTypes.node
}

export default AppTable