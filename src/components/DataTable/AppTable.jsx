import React, {useContext, useEffect} from 'react'
import PropTypes from 'prop-types'
import TABLE from "@/lib/helpers/table";
import {Table} from "antd";
import AppTableContext from "@/context/TableContext";
import ColumnToggle from "@/components/DataTable/ColumnToggle";

function AppTable({countFilteredRecords, data, filters, page, pageSize, handleTableChange, rowSelection, loading, menuProps, selectedEntities, modifiedData}) {
    const {columns, TableBodyCell, TableHeaderCell, handleHiddenColumns, context, getHiddenColumns} = useContext(AppTableContext)

    useEffect(() => {
    }, [])

    return (
        <>
            <div className="count c-table--header">
                {TABLE.rowSelectionDropdown({menuProps, selectedEntities, countFilteredRecords, modifiedData, filters, entity: context})}
                {TABLE.viewSankeyButton({filters})}
                <ColumnToggle hiddenColumns={getHiddenColumns()} columns={columns} handleSelectionChange={handleHiddenColumns} />
            </div>
            <Table className={`c-table--main ${countFilteredRecords(data, filters).length > 0 ? '' : 'no-data'}`}
                 columns={columns}
                 dataSource={countFilteredRecords(data, filters)}
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
        </>

    )
}

AppTable.propTypes = {
    data: PropTypes.array.isRequired
}

export default AppTable