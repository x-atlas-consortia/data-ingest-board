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
import LineWithLegend from "@/components/Visualizations/LineWithLegend";

const LogsFilesTable = ({ }) => {

    const { globusToken } = useContext(AppContext)
    const [selectedRows, setSelectedRows] = useState([])
    const xAxis = useRef({})
    const [vizData, setVizData] = useState({})
    const entities = useRef({})
    const datasetGroups = useRef([])

    const {
        indexKey,
        tableData, setTableData,
        isBusy, setIsBusy,
        hasMoreData, setHasMoreData,
        afterKey,
        selectedMenuItem,
        numOfRows,
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


            if (entitiesSearch.status == 200) {
                for (let d of entitiesSearch.data.hits.hits) {
                    entities.current[d._source.uuid] = {
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
                        ...(entities.current[uuid] || {})
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
        setVizData({})
        afterKey.current = null
        datasetGroups.current = []
        entities.current = {}
        setSelectedRows([])
        xAxis.current = {}
        fetchData(false)
        buildBarChart()
    }, [fromDate, toDate])

    useEffect(() => {
        if (selectedRows.length) {
            buildLineChart()
        } else {
            setVizData({ ...vizData, line: [] })
        }
    }, [selectedRows])


    const buildBarChart = async () => {
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
            for (let d of _data) {
                _vizData.push({
                    id: d.key_as_string,
                    label: d.key_as_string,
                    value: d.totalBytes.value
                })
            }
            setVizData({ ...vizData, bar: _vizData })
        }
    }

    const buildLineChart = async () => {
        if (!fromDate && !toDate) return
        let url = getUrl()
        if (!url) return

        let q = ESQ.indexQueries({ from: fromDate, to: toDate, list: selectedRows })[`${indexKey}DatasetsHistogram`]
        let headers = getHeadersWith(globusToken).headers

        // Get page for grouped Ids
        let res = await callService(url, headers, q, 'POST')
        let _vizData = []
        if (res.status == 200) {
            let _data = res.data?.aggregations?.buckets?.buckets
            let buckets = {}

            if (_data.length) {
                const prevMonth = new Date(_data[0].monthly.buckets[0].key_as_string + '-2')
                prevMonth.setMonth(prevMonth.getMonth() - 1)
                xAxis.current.prefix = `${prevMonth.getFullYear()}-${prevMonth.getMonth() + 1}`
            }

            for (let d of _data) {
                for (let m of d.monthly.buckets) {
                    buckets[m.key_as_string] = buckets[m.key_as_string] || { xValue: m.key_as_string }
                    buckets[m.key_as_string][entities.current[d.key]?.entityId || d.key] = m.totalBytes.value
                }
            }
            _vizData = Object.values(buckets)
            let datasets = []

            if (_vizData.length) {
                const nextMonth = new Date(_vizData[_vizData.length - 1].xValue + '-2')
                nextMonth.setMonth(nextMonth.getMonth() + 1)
                xAxis.current.suffix = `${nextMonth.getFullYear()}-${nextMonth.getMonth() + 1}`
            }

            for (let id of selectedRows) {
                datasets.push(entities.current[id]?.entityId || id)
            }
            datasetGroups.current = datasets

            setVizData({ ...vizData, line: _vizData })
        }
    }

    const rowSelection = {
        selectedRowKeys: selectedRows,
        onChange: (rowKeys, rows) => {
            console.log(`selectedRowKeys: ${rowKeys}`, 'selectedRows: ', rows);
            setSelectedRows(rowKeys)

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

    const yAxis = { formatter: formatBytes, label: '↑ Bytes Downloaded' }

    return (<>
        {vizData.bar?.length > 0 && selectedRows.length == 0 && <BarWithLegend yAxis={yAxis} data={vizData.bar} chartId={'files'} />}
        {vizData.line?.length > 0 && selectedRows.length > 0 && <LineWithLegend xAxis={xAxis.current} groups={datasetGroups.current} yAxis={yAxis} data={vizData.line} chartId={'filesDataset'} />}

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

