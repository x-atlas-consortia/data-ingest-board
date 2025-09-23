import { useEffect, useState, useContext, useRef } from "react";
import { Button } from 'antd';
import ESQ from "@/lib/helpers/esq";
import { callService, formatNum, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";

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
        afterKey,
        numOfRows,
        vizData, setVizData,
        updateTableData,
        fromDate, toDate,
        indexKey,
        selectedRows, setSelectedRows,
        selectedRowObjects, setSelectedRowObjects,
        getUrl,
        determineCalendarInterval,
        getAxisTick,
        getDatePart

    } = useContext(LogsContext)

    const apis = useRef([])
    const xAxis = useRef({})

    const prepareBarChartData = (_data) => {
        let _viz = []
        for (let d of _data) {
            _viz.push({ label: d.name, value: d.requests })
        }
        setVizData({ bar: _viz })
    }


    const fetchData = (includePrevData = true) => {
        setIsBusy(true)

        if (data.length) {
            updateTableData(includePrevData, data)
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


    const buildLineChart = async () => {
        if (!fromDate && !toDate) return
        let url = getUrl()
        if (!url) return

        let histogramOps = determineCalendarInterval()


        let q = ESQ.indexQueries({ from: fromDate, to: toDate, list: selectedRows })[`${indexKey}Histogram`](histogramOps)
        let headers = getHeadersWith(globusToken).headers


        let res = await callService(url, headers, q, 'POST')
        let _vizData = []
        if (res.status == 200) {
            let _data = res.data?.aggregations?.calendarHistogram?.buckets
            let buckets = {}

            if (_data?.length) {
                const prevDate = new Date(_data[0].key_as_string + getDatePart(histogramOps))
                xAxis.current.prefix = getAxisTick(prevDate, histogramOps)
            }

            let _apis = new Set()
            let cKey
            for (let d of _data) {
                buckets[d.key_as_string] = buckets[d.key_as_string] || { xValue: d.key_as_string }
                for (let t of d['host.keyword'].buckets) {
                    cKey = `${t.key}`
                    _apis.add(cKey)
                    buckets[d.key_as_string][cKey] = t.doc_count

                }
            }
            _vizData = Object.values(buckets)

            if (_vizData.length) {
                const nextDate = new Date(_vizData[_vizData.length - 1].xValue + getDatePart(histogramOps))
                xAxis.current.suffix = getAxisTick(nextDate, histogramOps, 1)
            }


            apis.current = Array.from(_apis)
            Addon.log(`${indexKey}.buildLineChart`, { data: _vizData })

            setVizData({ ...vizData, line: _vizData })
        }
    }

    useEffect(() => {
        if (selectedRows.length > 0 && selectedRows.length < 10) {
            if (!fromDate) {
                prepareBarChartData(selectedRowObjects)
            } else {
                buildLineChart()
            }
        } else {
            prepareBarChartData(data)
        }
    }, [selectedRows, fromDate, toDate])


    const rowSelection = {
        selectedRowKeys: selectedRows,
        onChange: (rowKeys, rows) => {
            setSelectedRowObjects(rows)
            setSelectedRows(rowKeys)
        },
    };

    const yAxis = { label: "Requests", formatter: formatNum }

    return (<>
        {vizData.bar?.length > 0 && (!fromDate || selectedRows.length == 0) && <BarWithLegend yAxis={yAxis} xAxis={{ formatter: formatNum, description: 'Requests per' }} data={vizData.bar} chartId={'apiUsage'} />}
        {vizData.line?.length > 0 && fromDate && <LineWithLegend xAxis={xAxis.current} groups={apis.current} yAxis={yAxis} data={vizData.line} chartId={'usageHistogram'} />}

        <SearchFilterTable data={tableData} columns={cols}
            formatters={{ bytes: formatNum }}
            tableProps={{
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

