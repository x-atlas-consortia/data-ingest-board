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
        vizData, setVizData,
        determineCalendarInterval,
        getAxisTick,
        selectedRows, setSelectedRows,
        selectedRowObjects, setSelectedRowObjects,
        getUrl,
        getDatePart

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
            q = ESQ.indexQueries({ list: ids }).filter
            q._source = ['uuid', 'dataset_type', TABLE.cols.f('id')]
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

            parseByDatasetType(_data.buckets)

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
        byDatasetTypes.current = []
        setSelectedRows([])
        xAxis.current = {}
        fetchData(false)
        buildBarChart()
    }, [fromDate, toDate])

    useEffect(() => {
        if (selectedRows.length < 10) {
            if (!fromDate) {
                let _data = selectedRowObjects.map((d)=> {
                    return {id: d.uuid, label: d.entityId || d.uuid, value: d.bytes}
                })
            
                setVizData({ ...vizData, barById: _data })
            } else {
                buildLineChart()
            }
        } else {
            setVizData({ ...vizData, line: [] })
        }
    }, [selectedRows])


    const buildBarChart = async () => {
        if (!fromDate && !toDate) return
        let url = getUrl()
        if (!url) return

        let histogramOps = determineCalendarInterval()

        let q = ESQ.indexQueries({ from: fromDate, to: toDate })[`${indexKey}Histogram`](histogramOps)
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
            //console.log(`selectedRowKeys: ${rowKeys}`, 'selectedRows: ', rows);
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
        setMenuItems(items)
        setVizData({ ...vizData, barByTypes: byDatasetTypes.current })
    }, [selectedMenuItem])

    const yAxis = { formatter: formatBytes, label: '↑ Bytes Downloaded' }

    const logByDatasetID = eq(selectedMenuItem, 'byDatasetID')
    const logByType = eq(selectedMenuItem, 'byDatasetType')
    const byTypeCols = Array.from(cols)
    byTypeCols.shift()

    return (<>
        {vizData.bar?.length > 0 && selectedRows.length == 0 && logByDatasetID && <BarWithLegend yAxis={yAxis} data={vizData.bar} chartId={'files'} />}
        {vizData.barByTypes?.length > 0 && logByType && <BarWithLegend yAxis={yAxis} data={vizData.barByTypes} chartId={'filesByTypes'} />}
        {vizData.barById?.length > 0 && !logByType && <BarWithLegend yAxis={yAxis} data={vizData.barById} chartId={'filesById'} />}
        {vizData.line?.length > 0 && selectedRows.length > 0 && <LineWithLegend xAxis={xAxis.current} groups={datasetGroups.current} yAxis={yAxis} data={vizData.line} chartId={'filesDataset'} />}


        {logByDatasetID && <>
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
        </>}

        {logByType && <>
            <Table
                rowSelection={{ type: 'checkbox', ...rowSelection }}
                loading={isBusy}
                rowKey={'id'}
                dataSource={vizData.barByTypes} columns={byTypeCols} />
        </>}

    </>)
}

export default LogsFilesTable;

