import { useEffect, useState, useContext, useRef } from "react";
import TABLE from '@/lib/helpers/table';
import { Table, Button, Popover } from 'antd';
import ESQ from "@/lib/helpers/esq";
import ENVS from "@/lib/helpers/envs";
import { callService, formatNum, formatBytes, eq, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import LogsContext from "@/context/LogsContext";
import IdLinkDropdown from "../IdLinkDropdown";
import BarWithLegend from "../Visualizations/BarWithLegend";

const LogsFilesTable = ({ }) => {

    const { globusToken } = useContext(AppContext)
    const [selectedRows, setSelectedRows] = useState([])

    const {
        indexKey,
        tableData, setTableData,
        isBusy, setIsBusy,
        hasMoreData, setHasMoreData,
        afterKey,
        selectedMenuItem, 
        numOfRows,
        vizData, setVizData,
        setMenuItems,
        updateTableData,
        getMenuItemClassName,
        fromDate, toDate,

    } = useContext(LogsContext)

    let config = ENVS.logsIndicies()

    const getUrl = () => {
        let i = config[indexKey]
        if (!i) return null

        let url = ENVS.urlFormat.search(`/${i}/search`)
        return url
    }

    const fetchData = async (includePrevData = true) => {
        setIsBusy(true)
        let dataSize = numOfRows
        
        let url = getUrl()
        if (!url) return
        let q = ESQ.indexQueries({ from: fromDate, to: toDate, collapse: true, size: dataSize })[`${indexKey}Table`]
        let headers = getHeadersWith(globusToken).headers

        if (afterKey.current !== null) {
            q.aggs.buckets.composite.after = afterKey.current
        }

        // Get page for grouped Ids
        let res = await callService(url, headers, q, 'POST')
        let _data = res.data?.aggregations?.buckets

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
                        bytes: d.totalBytes.value,
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
        updateVizData()
    }, [fromDate, toDate])


    const updateVizData = async () => {
        if (!fromDate && !toDate) return
        let url = getUrl()
        if (!url) return

        let q = ESQ.indexQueries({ from: fromDate, to: toDate })[`${indexKey}Histogram`]
        let headers = getHeadersWith(globusToken).headers

        // Get page for grouped Ids
        let res = await callService(url, headers, q, 'POST')
        let _vizData = []
        if (res.status == 200) {
            let _data = res.data?.aggregations?.monthly?.buckets
            console.log(_data)
            for (let d of _data) {
                _vizData.push({
                    label: d.key_as_string,
                    value: d.totalBytes.value
                })
            }
            setVizData(_vizData)
        }
        

    }

    const rowSelection = {
        onChange: (rowKeys, rows) => {
            console.log(`selectedRowKeys: ${rowKeys}`, 'selectedRows: ', rows);
            setSelectedRows(rows)
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
        {vizData.length > 0 && <BarWithLegend yAxisTickFormatter={formatBytes} data={vizData} chartId={'files'} />}

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

