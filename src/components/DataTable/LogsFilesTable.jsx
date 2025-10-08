import { useEffect, useState, useContext, useRef } from "react";
import TABLE from '@/lib/helpers/table';
import { Table, Button, Popover } from 'antd';
import ESQ from "@/lib/helpers/esq";
import ENVS from "@/lib/helpers/envs";
import { callService, formatNum, formatBytes, eq, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import LogsContext from "@/context/LogsContext";
import IdLinkDropdown from "../IdLinkDropdown";
import BarWithLegend from "@/components/Visualizations/BarWithLegend";
import SearchFilterTable from "./SearchFilterTable";
import Bar from "@/components/Visualizations/Charts/Bar";
import { ChartProvider } from '@/context/ChartContext';
import {modalDefault} from "@/lib/constants";
import AppModal from "@/components/AppModal";
import {
    BarChartOutlined,
    DownloadOutlined,
} from "@ant-design/icons";

const LogsFilesTable = ({ }) => {

    const { globusToken } = useContext(AppContext)
    const xAxis = useRef({})
    const entities = useRef({})
    const datasetGroups = useRef([])
    const byDatasetTypes = useRef([])
    const byDatasetTypesSelected = useRef([])
    const [modal, setModal] = useState(modalDefault)

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
        getFromDate, getToDate,
        vizData, setVizData,
        determineCalendarInterval,
        getAxisTick,
        selectedRows, setSelectedRows,
        selectedRowObjects, setSelectedRowObjects,
        getUrl,
        getDatePart,
        histogramDetails, setHistogramDetails,
        sectionHandleMenuItemClick

    } = useContext(LogsContext)

    const parseByDatasetType = (_data) => {
        let types = {}
        let type, uuid
        for (let d of _data) {
            uuid = d.key['dataset_uuid.keyword']
            type = entities.current[uuid]?.datasetType || 'N/A'
            types[type] = types[type] || { value: 0, label: type, id: type, datasetType: type, bytes: 0 }
            types[type].value += d.totalBytes.value    // viz
            types[type].bytes += d.totalBytes.value   // table
        }
        byDatasetTypes.current = Object.values(types)
    }

    const fetchData = async (includePrevData = true) => {
        setIsBusy(true)
        let dataSize = numOfRows

        let url = getUrl()
        if (!url) return
        let q = ESQ.indexQueries({ from: getFromDate(), to: getToDate(), collapse: true, size: dataSize })[`${indexKey}Table`]
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
            q = ESQ.indexQueries({ list: ids }).filter
            q._source = ['uuid', 'dataset_type', TABLE.cols.f('id')] // TODO change to TABLE.col.f('id')
            let entitiesSearch = await callService(ENVS.urlFormat.search('entities'),
                headers,
                q,
                'POST')

            if (entitiesSearch.status == 200) {
                for (let d of entitiesSearch.data.hits.hits) {
                    entities.current[d._source.uuid] = {
                        [TABLE.cols.f('id')]: d._source[TABLE.cols.f('id')],
                        entityId: d._source[TABLE.cols.f('id')], 
                        datasetType: d._source.dataset_type,
                    }
                }
            }

            let histogramOps = determineCalendarInterval()
            let uuid
            let histogramBuckets
           
            q = ESQ.indexQueries({ from: getFromDate(), to: getToDate(), list: ids })[`${indexKey}DatasetsHistogram`](histogramOps)
            res = await callService(url, headers, q, 'POST')
            
            let entity
            if (res.status == 200) {
                for (let d of res.data.aggregations.buckets.buckets) {
                    uuid = d.key
                    histogramBuckets = {}
                    for (let h of d.calendarHistogram.buckets) {
                        histogramBuckets[h.key_as_string] = h.totalBytes.value
                    }
                    entity = entities.current[uuid]
                    entities.current[uuid] = {...(entity || {uuid}), datasetType: entity?.datasetType || '', interval: histogramOps.interval,  histogram: histogramBuckets}
                }
            }

            let _tableData = []
            for (let d of _data.buckets) {
                uuid = d.key['dataset_uuid.keyword']
                _tableData.push(
                    {
                        uuid,
                        ...(entities.current[uuid] || {}),
                        files: d.doc_count,
                        bytes: d.totalBytes.value,
                    }
                )
            }

            parseByDatasetType(_data.buckets)

            Addon.log('LogsFilesTable.fetchData', {data: _tableData})

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
        Table.EXPAND_COLUMN,
        {
            title: 'Bytes Downloaded',
            dataIndex: 'bytes',
            key: 'bytes',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.bytes - b.bytes,
            render: (v, r) => {
                return <Popover content={<span>{formatNum(r.files)} files downloaded</span>} placement={'right'}>{formatBytes(v)}</Popover>
            }
            
        }
    ]

    useEffect(() => {
        setTableData([])
        setVizData({})
        afterKey.current = null
        datasetGroups.current = []
        entities.current = {}
        byDatasetTypes.current = []
        setSelectedRows([])
        setSelectedRowObjects([])
        xAxis.current = {}
        fetchData(false)
        buildBarChart()
        
    }, [fromDate, toDate])


    const buildBarChart = async () => {
      
        let url = getUrl()
        if (!url) return

        let histogramOps = determineCalendarInterval()
        setHistogramDetails(histogramOps)

        let q = ESQ.indexQueries({ from: getFromDate(), to: getToDate() })[`${indexKey}Histogram`](histogramOps)
        let headers = getHeadersWith(globusToken).headers

        // Get page for grouped Ids
        let res = await callService(url, headers, q, 'POST')
        let _vizData = []
        if (res.status == 200) {
            let _data = res.data?.aggregations?.calendarHistogram?.buckets
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

    const rowSelection = {
        selectedRowKeys: selectedRows,
        onChange: (rowKeys, rows) => {
            setSelectedRows(rowKeys)
            setSelectedRowObjects(rows)
        },
    };

    const items = [
        {
            key: 'byDatasetType',
            icon: <BarChartOutlined />,
            label: <Popover content={'Currently loaded table items are aggregated by dataset type and shown in bar chart.'} placement={'left'}><span>View By Dataset Type</span></Popover>,
        }
    ];

    const rowSelectionForByType = {
        onChange: (rowKeys, rows) => {
            byDatasetTypesSelected.current = rows
        },
    };

    const exportByTypeSelection = (byTypeCols) => {
        const _data = byDatasetTypesSelected.current.length ? byDatasetTypesSelected.current : byDatasetTypes.current
        TABLE.generateCSVFile(TABLE.flattenDataForCSV(_data), 'fileDownloadsByTypes.csv', byTypeCols)
    }

    const _handleMenuItemClick = (e) => {
        if (eq(e.key, 'byDatasetType')) {
            const byTypeCols = []
            byTypeCols.push(cols[1])
            byTypeCols.push(cols[3])
            const body = <>
            <h4>Downloaded Datasets by Dataset Type</h4>
            <p>Currently loaded table items are aggregated by dataset type and visualized in the bar chart below for time period {fromDate} to {toDate}.</p>
            <BarWithLegend yAxis={yAxis} data={byDatasetTypes.current} chartId={'filesByTypes'} />
            <SearchFilterTable data={byDatasetTypes.current} columns={byTypeCols}
                formatters={{bytes: formatBytes}}
                tableProps={{
                    rowKey: 'datasetType',
                    rowSelection: { type: 'checkbox', ...rowSelectionForByType },
                    loading: false
                }} />
            </>
            const footer = [
                <Button icon={<DownloadOutlined />} onClick={()=>exportByTypeSelection(byTypeCols.map((c) => c.dataIndex))}> Download CSV Data</Button>,
                <Button color="primary" variant="solid" onClick={()=>setModal({...modal, open:false})}> Close</Button>
            ]
            setModal({...modal, footer, body, open: true, width: '90%'})
        }
    }

    useEffect(() => {
        sectionHandleMenuItemClick.current = _handleMenuItemClick
        setMenuItems(items)
    }, [])

    const yAxis = { formatter: formatBytes, label: 'Bytes downloaded', labelPadding: 1 }

    const formatAnalytics = (v, details) => {
        return formatBytes(v, 3)
    }

    return (<>
        {vizData.bar?.length > 0 && <div className="mx-5 mb-5"><ChartProvider><Bar xAxis={{monoColor: '#4288b5', noSortLabels: true, label: `Bytes downloaded per ${histogramDetails?.interval}`}} yAxis={yAxis} data={vizData.bar} chartId={'files'} /></ChartProvider></div>}
        <>
            <SearchFilterTable data={tableData} columns={cols}
                formatters={{bytes: formatBytes}}
                tableProps={{
                    ...TABLE.expandableHistogram('uuid', formatAnalytics),
                    rowKey: 'uuid',
                    rowSelection: { type: 'checkbox', ...rowSelection },
                    pagination: false,
                    loading: isBusy,
                    scroll: { y: 'calc(100vh - 200px)' }
                }} />

            {hasMoreData && <Button onClick={fetchData} type="primary" block>
                Load More
            </Button>}
        </>

        <AppModal modal={modal} setModal={setModal} />

    </>)
}

export default LogsFilesTable;

