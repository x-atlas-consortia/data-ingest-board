import { useEffect, useState, useContext, useRef } from "react";
import TABLE from '@/lib/helpers/table';
import { Table, Button, Popover } from 'antd';
import ESQ from "@/lib/helpers/esq";
import ENVS from "@/lib/helpers/envs";
import { callService, formatNum, formatBytes, eq, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import LogsContext from "@/context/LogsContext";
import IdLinkDropdown from "../IdLinkDropdown";

const LogsFilesTable = ({ }) => {

    const { globusToken } = useContext(AppContext)

    const {
        tableData, setTableData,
        isBusy, setIsBusy,
        hasMoreData, setHasMoreData,
        afterKey,
        selectedMenuItem, 
        numOfRows, setNumOfRows,
        vizData, setVizData,
        setMenuItems,
        extraActions, setExtraActions,
        updateTableData,
        getMenuItemClassName,
        fromDate, toDate,

    } = useContext(LogsContext)

    const fetchData = async (includePrevData = true) => {
        setIsBusy(true)
        let dataSize = numOfRows
        let i = 'logs-file-downloads'
        let url = ENVS.urlFormat.search(`/${i}/search`)
        let q = ESQ.indexQueries({ from: fromDate, to: toDate, collapse: true, size: dataSize })[`${i}-table`]
        let headers = getHeadersWith(globusToken).headers

        if (afterKey.current !== null) {
            q.aggs.dataset_buckets.composite.after = afterKey.current
        }

        // Get page for grouped Ids
        let res = await callService(url, headers, q, 'POST')
        let _data = res.data?.aggregations?.dataset_buckets

        let ids = []
        if (res.status === 200 && _data?.buckets.length) {

            afterKey.current = _data.after_key

            for (let d of _data.buckets) {
                ids.push(d.key['dataset_uuid.keyword'])
            }

            // Find out info about these ids
            let entitiesSearch = await callService(ENVS.urlFormat.search(`/entities/search`),
                headers,
                ESQ.indexQueries({ list: ids }).filter,
                'POST')

            let entities = {}
            if (entitiesSearch.status == 200) {
                for (let d of entitiesSearch.data.hits.hits) {
                    entities[d._source.uuid] = {
                        [TABLE.cols.f('id')]: d._source.hubmap_id,
                        entityId: d._source.hubmap_id, // TODO change to TABLE.col.f('id')
                        datasetType: d._source.dataset_type,
                    }
                }
            }

            let uuid
            let _tableData = []
            for (let d of _data.buckets) {
                uuid = d.key['dataset_uuid.keyword']
                _tableData.push(
                    {
                        files: d.doc_count,
                        bytes: d.file_bytes.value,
                        uuid,
                        ...(entities[uuid] || {})
                    }
                )
            }

            updateTableData(includePrevData, _tableData)

        } else {
            setHasMoreData(false)
        }
        setIsBusy(false)
    }

    const cols = [
        {
            title: TABLE.cols.n('id'),
            dataIndex: 'entityId',
            key: 'entityId',
            render: (val, row) => {
                if (row.entityId) {
                    return <IdLinkDropdown data={{ ...row, [TABLE.cols.f('id')]: val }} />
                } else {
                    return <span className="text-muted">{row.uuid}</span>
                }
            }
        },
        {
            title: 'Dataset Type',
            dataIndex: 'datasetType',
            key: 'datasetType',
            width: '33%',
            sorter: (a, b) => a.datasetType?.localeCompare(b?.datasetType),
        },
        {
            title: 'Bytes Downloaded',
            dataIndex: 'bytes',
            key: 'bytes',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.bytes - b.bytes,
            render: (v, r) => {
                return <Popover content={<span>{formatNum(r.files)} files downloaded</span>} placement={'right'}>{formatBytes(v)}</Popover>
            }
            //bar chart by month of total downloaded bytes
        }
    ]

    useEffect(() => {
        setTableData([])
        afterKey.current = null
        fetchData(false)
    }, [fromDate, toDate])

    const rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
    };

    const items = [
        {
            key: 'logsType',
            type: 'group',
            label: 'View Logs by',
            children: [
                {
                    key: 'byDatasetID',
                    className: getMenuItemClassName(selectedMenuItem, 'byDatasetID'), 
                    label: 'Dataset ID',
                },
                {
                    key: 'byDatasetType',
                    className: getMenuItemClassName(selectedMenuItem, 'byDatasetType'),
                    label: 'Dataset Type',
                },
            ],
        }
    ];

     useEffect(() => {
        setMenuItems(items)
    }, [])

    return (<>

        <Table
            rowSelection={{ type: 'checkbox', ...rowSelection }}
            pagination={false}
            loading={isBusy}
            rowKey={'uuid'}
            scroll={{ y: 'calc(100vh - 200px)' }}
            dataSource={tableData} columns={cols} />
        {hasMoreData && <Button onClick={fetchData} type="primary" block>
            Load More
        </Button>}

    </>)
}

export default LogsFilesTable;

