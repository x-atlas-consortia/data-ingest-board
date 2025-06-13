import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import TABLE from "@/lib/helpers/table";
import {Table} from "antd";
import AppTableContext from "@/context/TableContext";
import ColumnToggle from "@/components/DataTable/ColumnToggle";
import RouterContext from "@/context/RouterContext";

function AppTable({countFilteredRecords, data, rowSelection, loading, menuProps, selectedEntities, modifiedData}) {
    const {filters, page, pageSize} = useContext(RouterContext)
    const {columns, TableBodyCell, TableHeaderCell, handleHiddenColumns, context, getHiddenColumns, handleTableChange, baseColumns, getColumnsDict} = useContext(AppTableContext)
    const [tableColumns, setTableColumns] = useState(columns)

    useEffect(() => {
        let dict = getColumnsDict(baseColumns)
        let result = []
        // The filteredValue property gets lost with the drag feature, so let's replenish it from the source.
        for (let i = 0; i < columns.length; i++) {
            result.push({...columns[i], filteredValue: dict[columns[i].dataIndex].filteredValue})
        }
        setTableColumns(result)

    }, [filters])

    return (
        <>
            <div className="count c-table--header">
                {TABLE.rowSelectionDropdown({menuProps, selectedEntities, countFilteredRecords, modifiedData, filters, entity: context})}
                {TABLE.viewSankeyButton({filters})}
                <ColumnToggle hiddenColumns={getHiddenColumns()} columns={columns} handleSelectionChange={handleHiddenColumns} />
            </div>
            <Table className={`c-table--main ${countFilteredRecords(data, filters).length > 0 ? '' : 'no-data'}`}
                 columns={tableColumns}
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