import { useEffect, useState, useContext, useRef, useMemo } from "react";
import TABLE from '@/lib/helpers/table';
import { Table, Button, Popover } from 'antd';
import ESQ, {indexFixtures} from "@/lib/helpers/esq";
import ENVS from "@/lib/helpers/envs";
import { callService, formatNum, formatBytes, eq, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import LogsContext from "@/context/LogsContext";
import IdLinkDropdown from "../IdLinkDropdown";
import BarWithLegendFlex from "@/components/Visualizations/BarWithLegendFlex";
import SearchFilterTable from "./SearchFilterTable";
import Bar from "@/components/Visualizations/Charts/Bar";
import { ChartProvider } from '@/context/ChartContext';
import {modalDefault} from "@/lib/constants";
import AppModal from "@/components/AppModal";
import {
    BarChartOutlined,
    DownloadOutlined,
} from "@ant-design/icons";
import WithChart from "../Visualizations/WithChart";

const LogsFilesTable = ({ }) => {

    const { globusToken } = useContext(AppContext)
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
        numOfRows,
        setMenuItems,
        updateTableData,
        fromDate, toDate,
        getFromDate, getToDate,
        vizData, setVizData,
        determineCalendarInterval,
        selectedRows, setSelectedRows,
        setSelectedRowObjects,
        getUrl,
        tableScroll,
        histogramDetails, setHistogramDetails,
        sectionHandleMenuItemClick,
        isLogScale,
        getScaleSwitchMenuItem,
        aggregatedData

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
    const [statusError, setStatusError] = useState(false)

    const checkForTimeout = (res) => {
        if (res?.raw?.code == 'ERR_NETWORK' || res.status == 504) {
            setStatusError(true) // Request timed out, set error state
        } else {
            setStatusError(false) // Reset error state if request is successful
        }
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
        let _data = res.data?.aggregations?.buckets || {}
        checkForTimeout(res)
        let ids = []
        if (res.status === 200 && _data?.buckets.length) {

            afterKey.current = _data.after_key

            for (let d of _data.buckets) {
                ids.push(d.key['dataset_uuid.keyword'])
            }

            // Find out info about these ids
            q = ESQ.indexQueries({ list: ids, size: dataSize }).filter
            q._source = ['uuid', 'intended_dataset_type', 'entity_type', 'dataset_type', TABLE.cols.f('id')] 
            let entitiesSearch = await callService(ENVS.urlFormat.search('entities'),
                headers,
                q,
                'POST')

            if (entitiesSearch.status == 200) {
                for (let d of entitiesSearch.data.hits.hits) {
                    entities.current[d._source.uuid] = {
                        [TABLE.cols.f('id')]: d._source[TABLE.cols.f('id')],
                        entityId: d._source[TABLE.cols.f('id')], 
                        datasetType: d._source.dataset_type || d._source.intended_dataset_type || '',
                        entityType: d._source.entity_type
                    }
                }
            }
            checkForTimeout(entitiesSearch)

            let histogramOps = determineCalendarInterval()
            let uuid
            let histogramBuckets
           
            q = ESQ.indexQueries({ from: getFromDate(), to: getToDate(), list: ids })[`${indexKey}DatasetsHistogram`](histogramOps)
            res = await callService(url, headers, q, 'POST')
            checkForTimeout(res)
            let entity
            if (res.status == 200) {
                for (let d of res.data.aggregations.buckets.buckets) {
                    uuid = d.key
                    histogramBuckets = {}
                    for (let h of d.calendarHistogram.buckets) {
                        histogramBuckets[h.key_as_string] = h.totalBytes.value
                    }
                    entity = entities.current[uuid]
                    entities.current[uuid] = {...(entity || {uuid}), entityType: entity?.entityType || '', datasetType: entity?.datasetType || '', interval: histogramOps.interval,  histogram: histogramBuckets}
                }
            }

            let _tableData = []
            for (let d of _data?.buckets) {
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
            title: 'Entity Type',
            dataIndex: 'entityType',
            key: 'entityType',
            sorter: (a, b) => a.entityType?.localeCompare(b?.entityType),
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

    const resetView = () => {
        setTableData([])
        setVizData({})
        afterKey.current = null
        datasetGroups.current = []
        entities.current = {}
        byDatasetTypes.current = []
        setSelectedRows([])
        setSelectedRowObjects([])
        setStatusError(false)
        fetchData(false)
        buildBarChart()
    }

    useEffect(() => {
        resetView()
    }, [fromDate, toDate])

     useEffect(() => {
        if (!histogramDetails || histogramDetails.isMenuAction) {
            resetView()
        }
    }, [histogramDetails])


    const buildBarChart = async () => {
      
        let url = getUrl()
        if (!url) return

        let histogramOps = determineCalendarInterval()
        if (!histogramDetails) {
            setHistogramDetails(histogramOps)
        }

        let baseIndexName = indexFixtures.fileDownloads.aggName
        const logs = aggregatedData.current[`${baseIndexName}${histogramOps.interval}`]
        let _data = ESQ.filterByDate((logs?.aggregations?.calendarHistogram?.buckets || []), getFromDate(), getToDate())
        
        const _setVizData = () => {
            let _vizData = []
            for (let d of _data) {
                _vizData.push({
                    id: d.key_as_string,
                    label: d.key_as_string,
                    value: d.totalBytes.value
                })
            }
            setVizData({ ...vizData, bar: _vizData })
        }
        
        if (!_data.length) {
            let q = ESQ.indexQueries({ from: getFromDate(), to: getToDate() })[`${indexKey}Histogram`](histogramOps)
            let headers = getHeadersWith(globusToken).headers

            let res = await callService(url, headers, q, 'POST')
            
            if (res.status == 200) {
                _data = res.data?.aggregations?.calendarHistogram?.buckets
                _setVizData()
            }
        } else {
            _setVizData()
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
        },
        getScaleSwitchMenuItem()
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
            byTypeCols.push(cols[2])
            byTypeCols.push(cols[4])
            const body = <>
            <h4>Downloaded Datasets by Dataset Type</h4>
            <p>Currently loaded table items are aggregated by dataset type and visualized in the bar chart below for time period {fromDate} to {toDate}.</p>
            <BarWithLegendFlex style={{valueFormatter: ({v}) => formatBytes(v)}} yAxis={{...yAxis, labelPadding: -20}} data={byDatasetTypes.current} chartId={'filesByTypes'} />
            <SearchFilterTable data={byDatasetTypes.current} columns={byTypeCols}
                formatters={{bytes: formatBytes}}
                tableProps={{
                    rowKey: 'datasetType',
                    rowSelection: { type: 'checkbox', ...rowSelectionForByType },
                    loading: false
                }} />
            </>
            const footer = [
                <Button key='exportSelection' className="js-gtm--btn-cta-downloadCSVData" data-gtm-info={indexKey} icon={<DownloadOutlined />} onClick={()=>exportByTypeSelection(byTypeCols.map((c) => c.dataIndex))}> Download CSV Data</Button>,
                <Button key='close' color="primary" variant="solid" onClick={()=>setModal({...modal, open:false})}> Close</Button>
            ]
            setModal({...modal, footer, body, open: true, width: '90%'})
        }
    }

    useEffect(() => {
        sectionHandleMenuItemClick.current = _handleMenuItemClick
        setMenuItems(items)
    }, [isLogScale])

    const yAxis = useMemo(() => {
        return { formatter: formatBytes, label: 'Bytes downloaded', labelPadding: 1, scaleLog: isLogScale, }
    }, [isLogScale])

    const xAxis = useMemo(() => {
        return {noSortLabels: true, label: `Bytes downloaded per ${histogramDetails?.interval}`}
    }, [histogramDetails])

    const svgStyle = useMemo(() => {
        return {valueFormatter: ({v}) => formatBytes(v), monoColor: '#4288b5', margin: {left: 95}}
    }, [])

    const formatAnalytics = (v, details) => {
        return formatBytes(v, 3)
    }

    return (<>
        {vizData.bar?.length > 0 && <WithChart data={vizData.bar} ><div className="mx-5 mb-5"><ChartProvider><Bar style={svgStyle} xAxis={xAxis} yAxis={yAxis} data={vizData.bar} chartId={'files'} reload={false} /></ChartProvider></div></WithChart>}
        <>
            <SearchFilterTable data={tableData} columns={cols}
                formatters={{bytes: formatBytes}}
                tableProps={{
                    ...TABLE.expandableHistogram('uuid', formatAnalytics),
                    rowKey: 'uuid',
                    rowSelection: { type: 'checkbox', ...rowSelection },
                    pagination: false,
                    loading: isBusy,
                    locale: { emptyText: statusError ? "Request timed out. Either narrow down the date range or try again later." : "No data available." },
                    ...tableScroll
                }} />

            {hasMoreData && <Button onClick={fetchData} type="primary" block>
                Load More
            </Button>}
        </>

        <AppModal modal={modal} setModal={setModal} />

    </>)
}

export default LogsFilesTable;

