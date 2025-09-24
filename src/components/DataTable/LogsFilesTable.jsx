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
import LineWithLegend from "@/components/Visualizations/LineWithLegend";
import SearchFilterTable from "./SearchFilterTable";
import Bar from "@/components/Visualizations/Charts/Bar";
import { ChartProvider } from '@/context/ChartContext';

const LogsFilesTable = ({ }) => {

    const { globusToken } = useContext(AppContext)
    const xAxis = useRef({})
    const entities = useRef({})
    const datasetGroups = useRef([])
    const byDatasetTypes = useRef([])

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
        histogramDetails, setHistogramDetails

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
            q._source = ['uuid', 'dataset_type', 'hubmap_id', TABLE.cols.f('id')] // TODO change to TABLE.col.f('id')
            let entitiesSearch = await callService(ENVS.urlFormat.search(`/entities/search`),
                headers,
                q,
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

            let histogramOps = determineCalendarInterval()
            let uuid
            let histogramBucketsExport, histogramBuckets

           
            q = ESQ.indexQueries({ from: getFromDate(), to: getToDate(), list: ids })[`${indexKey}DatasetsHistogram`](histogramOps)
            res = await callService(url, headers, q, 'POST')
            
            if (res.status == 200) {
                for (let d of res.data.aggregations.buckets.buckets) {
                    uuid = d.key
                    histogramBucketsExport = []
                    histogramBuckets = {}
                    for (let h of d.calendarHistogram.buckets) {
                        histogramBucketsExport.push({label: h.key_as_string, value: h.totalBytes.value})
                        histogramBuckets[h.key_as_string] = h.totalBytes.value
                    }
                    entities.current[uuid] = {...(entities.current[uuid] || {uuid}), interval: histogramOps.interval, bytesByInterval: histogramBucketsExport, _countByInterval: histogramBuckets}
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
        
    }, [fromDate, toDate])

    useEffect(() => {
        if (selectedRows.length > 0 && selectedRows.length < 10) {
            if (!fromDate) {
                let _data = selectedRowObjects.map((d) => {
                    return { id: d.uuid, label: d.entityId || d.uuid, value: d.bytes }
                })
                setVizData({ ...vizData, barById: _data })
            } else {
                buildLineChart()
            }
        } else {
            
            if (vizData.line?.length || vizData.barById?.length) {
               setVizData({ ...vizData, line: [], barById: [] }) 
            }
            buildBarChart()
        }
    }, [selectedRows, fromDate, toDate])


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

    const buildLineChart = async () => {
        if (!fromDate && !toDate) return
        let url = getUrl()
        if (!url) return

        let histogramOps = determineCalendarInterval()

        let q = ESQ.indexQueries({ from: fromDate, to: toDate, list: selectedRows })[`${indexKey}DatasetsHistogram`](histogramOps)
        let headers = getHeadersWith(globusToken).headers

        // Get page for grouped Ids
        let res = await callService(url, headers, q, 'POST')
        let _vizData = []
        if (res.status == 200) {
            let _data = res.data?.aggregations?.buckets?.buckets
            let buckets = {}

            if (_data.length) {
                const prevDate = new Date(_data[0].calendarHistogram.buckets[0].key_as_string + getDatePart(histogramOps))
                xAxis.current.prefix = getAxisTick(prevDate, histogramOps)
            }

            for (let d of _data) {
                for (let m of d.calendarHistogram.buckets) {
                    buckets[m.key_as_string] = buckets[m.key_as_string] || { xValue: m.key_as_string }
                    buckets[m.key_as_string][entities.current[d.key]?.entityId || d.key] = m.totalBytes.value
                }
            }
            _vizData = Object.values(buckets)
            let datasets = []

            if (_vizData.length) {
                const nextDate = new Date(_vizData[_vizData.length - 1].xValue + getDatePart(histogramOps))
                xAxis.current.suffix = getAxisTick(nextDate, histogramOps, 1)
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
            setSelectedRows(rowKeys)
            setSelectedRowObjects(rows)
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
        //setMenuItems(items)
        setVizData({ ...vizData, barByTypes: byDatasetTypes.current })
    }, [selectedMenuItem])

    const yAxis = { formatter: formatBytes, label: 'Bytes downloaded', labelPadding: 1 }

    const logByDatasetID = eq(selectedMenuItem, 'byDatasetID')
    const logByType = eq(selectedMenuItem, 'byDatasetType')
    const byTypeCols = Array.from(cols)
    byTypeCols.shift()

    return (<>
        {vizData.bar?.length > 0 && logByDatasetID && <div className="mx-5 mb-5"><ChartProvider><Bar xAxis={{monoColor: '#4288b5', label: `Bytes downloded per ${histogramDetails?.interval}`}} yAxis={yAxis} data={vizData.bar} chartId={'files'} /></ChartProvider></div>}
        {/* {vizData.barByTypes?.length > 0 && logByType && <BarWithLegend yAxis={yAxis} data={vizData.barByTypes} chartId={'filesByTypes'} />}
        {vizData.barById?.length > 0 && !logByType && <BarWithLegend yAxis={yAxis} data={vizData.barById} chartId={'filesById'} />}
        {vizData.line?.length > 0 && selectedRows.length > 0 && <LineWithLegend xAxis={xAxis.current} groups={datasetGroups.current} yAxis={yAxis} data={vizData.line} chartId={'filesDataset'} />} */}


        {logByDatasetID && <>
            <SearchFilterTable data={tableData} columns={cols}
                formatters={{bytes: formatBytes}}
                tableProps={{
                    ...TABLE.expandableHistogram('uuid', formatBytes),
                    rowKey: 'uuid',
                    rowSelection: { type: 'checkbox', ...rowSelection },
                    pagination: false,
                    loading: isBusy,
                    scroll: { y: 'calc(100vh - 200px)' }
                }} />

            {hasMoreData && <Button onClick={fetchData} type="primary" block>
                Load More
            </Button>}
        </>}

        {logByType && <>
            <SearchFilterTable data={vizData.barByTypes} columns={byTypeCols}
                formatters={{bytes: formatBytes}}
                tableProps={{
                    rowKey: 'id',
                    rowSelection: { type: 'checkbox', ...rowSelection },
                    loading: isBusy
                }} />
        </>}

    </>)
}

export default LogsFilesTable;

