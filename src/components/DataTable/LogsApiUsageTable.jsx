import { useEffect, useState, useContext, useRef } from "react";
import { Button, Table } from 'antd';
import ESQ from "@/lib/helpers/esq";
import { callService, formatNum, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import TABLE from '@/lib/helpers/table';
import LogsContext from "@/context/LogsContext";
import StackedBarWithLegend from "@/components/Visualizations/StackedBarWithLegend";
import LineWithLegend from "@/components/Visualizations/LineWithLegend";
import SearchFilterTable from "./SearchFilterTable";

const LogsApiUsageTable = ({ data }) => {
    const { globusToken } = useContext(AppContext)
    const {
        tableData, setTableData,
        isBusy, setIsBusy,
        hasMoreData, setHasMoreData,
        numOfRows,
        vizData, setVizData,
        updateTableData,
        fromDate, toDate,
        getFromDate, getToDate,
        indexKey,
        selectedRows, setSelectedRows,
        selectedRowObjects, setSelectedRowObjects,
        getUrl,
        determineCalendarInterval,
        getAxisTick,
        getDatePart,
        histogramDetails, setHistogramDetails

    } = useContext(LogsContext)

    const apis = useRef([])
    const xAxis = useRef({})


    const fetchData = (includePrevData = true) => {
        setIsBusy(true)

        if (data.length) {
            buildStackedBarChart(includePrevData)
            
            if (data.length < numOfRows) {
                setHasMoreData(false)
            }
        } else {
            setHasMoreData(false)
        }
        setIsBusy(false)
    }

    const cols = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Endpoints',
            dataIndex: 'endpoints',
            key: 'endpoints',
        },
        Table.EXPAND_COLUMN,
        {
            title: 'Requests',
            dataIndex: 'requests',
            key: 'requests',
            sorter: (a, b) => a.requests - b.requests,
            render: (v, r) => {
                return <span data-field="requests">{formatNum(v)}</span>
            }
        }
    ]

    useEffect(() => {
        setTableData([])
        setVizData({})
        fetchData(false)
        xAxis.current = {}
        apis.current = []
        setSelectedRows([])
        setSelectedRowObjects([])
    }, [fromDate, toDate])


    const _configureDate = (timestamp, histogramOps, asDate= true) => {
        const d = new Date(timestamp)
        const str = `${d.getFullYear()}-${(d.getMonth()+1)}${getDatePart(histogramOps)}`
        return asDate ? new Date(str) : str
    }


    const buildStackedBarChart = async (includePrevData) => {
        let url = getUrl()
        if (!url) return

        let histogramOps = determineCalendarInterval()

        // TODO not use timestamp on update of api_usage, also in ESQ
        let _to = getToDate()
        _to = _to == 'now' ? new Date().getTime() : _to
        let q = ESQ.indexQueries({ from: getFromDate(), to: _to, list: data.map((r) => r.name) })[`${indexKey}Histogram`](histogramOps)
        let headers = getHeadersWith(globusToken).headers

        let res = await callService(url, headers, q, 'POST')
        let _vizData = []
        if (res.status == 200) {
            let _data = res.data?.aggregations?.calendarHistogram?.buckets
            let histogramBuckets = {}

            let apiListIndexes = {}
            for (let i = 0; i < data.length; i++) {
                data[i].histogram = {}
                apiListIndexes[data[i].name] = i
            }
            let _tableData = Array.from(data)

            let _apis = new Set()
            let apiName, bKey
            for (let d of _data) {
                bKey = _configureDate(d.key, histogramOps)
                bKey = getAxisTick(bKey, histogramOps, 0)
                histogramBuckets[bKey] = histogramBuckets[bKey] || { group: bKey }
                for (let t of d['host.keyword'].buckets) {
                    apiName = `${t.key}`
                    _apis.add(apiName)
                    histogramBuckets[bKey][apiName] = t.doc_count
                    _tableData[apiListIndexes[apiName]].histogram[bKey] = t.doc_count
                }
            }

            _vizData = Object.values(histogramBuckets)

            apis.current = Array.from(_apis)
            Addon.log(`${indexKey}.buildStackedBarChart`, { data: _vizData })

            setVizData({ ...vizData, line: _vizData })
            updateTableData(includePrevData, _tableData)
            setHistogramDetails(histogramOps)
        }
    }


    const rowSelection = {
        selectedRowKeys: selectedRows,
        onChange: (rowKeys, rows) => {
            setSelectedRowObjects(rows)
            setSelectedRows(rowKeys)
        },
    };

    const yAxis = { label: "Requests", formatter: formatNum }

   
    return (<>

        {vizData.line?.length > 0 && <StackedBarWithLegend xAxis={{...xAxis.current, label: `Requests per ${histogramDetails?.interval}`}} groups={apis.current} yAxis={yAxis} data={vizData.line} chartId={'usageHistogram'} />}

        <SearchFilterTable data={tableData} columns={cols}
            formatters={{ bytes: formatNum }}
            tableProps={{
                ...TABLE.expandableHistogram('name', formatNum),
                rowKey: 'name',
                rowSelection: { type: 'checkbox', ...rowSelection },
                pagination: false,
                loading: isBusy,
                scroll: { y: 'calc(100vh - 200px)' }
            }} />
        {hasMoreData && <Button onClick={fetchData} type="primary" block>
            Load More
        </Button>}

    </>)
}

export default LogsApiUsageTable;

