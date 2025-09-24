import { useEffect, useState, useContext, useRef } from "react";
import { Button, Table } from 'antd';
import ESQ from "@/lib/helpers/esq";
import { callService, formatNum, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import TABLE from '@/lib/helpers/table';
import LogsContext from "@/context/LogsContext";
import BarWithLegend from "@/components/Visualizations/BarWithLegend";
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
            buildLineChart(includePrevData)
            
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


    const _configureDate = (timestamp, histogramOps) => {
        const d = new Date(timestamp)
        return new Date(`${d.getFullYear()}-${d.getMonth()+1}${getDatePart(histogramOps)}`)
    }


    const buildLineChart = async (includePrevData) => {
        let url = getUrl()
        if (!url) return

        let histogramOps = determineCalendarInterval()

        let q = ESQ.indexQueries({ from: getFromDate(), to: getToDate(), list: data.map((r) => r.name) })[`${indexKey}Histogram`](histogramOps)
        let headers = getHeadersWith(globusToken).headers

        let res = await callService(url, headers, q, 'POST')
        let _vizData = []
        if (res.status == 200) {
            let _data = res.data?.aggregations?.calendarHistogram?.buckets
            let buckets = {}

            if (_data?.length) {
                //const prevDate = new Date(_data[0].key_as_string + getDatePart(histogramOps))
                const prevDate = _configureDate(_data[0].key, histogramOps)
                xAxis.current.prefix = getAxisTick(prevDate, histogramOps)
            }

            let apiListIndexes = {}
            for (let i = 0; i < data.length; i++) {
                data[i]._countByInterval = {}
                apiListIndexes[data[i].name] = i
            }
            let _tableData = Array.from(data)

            let _apis = new Set()
            let apiName
            for (let d of _data) {
                buckets[d.key_as_string] = buckets[d.key_as_string] || { xValue: d.key_as_string }
                for (let t of d['host.keyword'].buckets) {
                    apiName = `${t.key}`
                    _apis.add(apiName)
                    buckets[d.key_as_string][apiName] = t.doc_count
                    _tableData[apiListIndexes[apiName]]._countByInterval[d.key_as_string] = t.doc_count
                }
            }

            _vizData = Object.values(buckets)

            if (_vizData.length) {
                // const nextDate = new Date(_vizData[_vizData.length - 1].xValue + getDatePart(histogramOps))
                // xAxis.current.suffix = getAxisTick(nextDate, histogramOps, 1)
            }


            apis.current = Array.from(_apis)
            Addon.log(`${indexKey}.buildStackedBarChart`, { data: _vizData })

            setVizData({ ...vizData, line: _vizData })
            updateTableData(includePrevData, _tableData)
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

        {vizData.line?.length > 0 && <LineWithLegend xAxis={xAxis.current} groups={apis.current} yAxis={yAxis} data={vizData.line} chartId={'usageHistogram'} />}

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

