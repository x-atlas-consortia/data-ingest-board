import { useEffect, useState, useContext, useRef } from "react";
import { Button } from 'antd';
import ESQ from "@/lib/helpers/esq";
import { callService, formatNum, eq, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";

import LogsContext from "@/context/LogsContext";
import StackedBarWithLegend from "@/components/Visualizations/StackedBarWithLegend";
import LineWithLegend from "@/components/Visualizations/LineWithLegend";
import SearchFilterTable from "./SearchFilterTable";

const LogsReposTable = ({ }) => {
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

    const subgroupLabels = useRef({})
    const repos = useRef([])
    const xAxis = useRef({})


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

        let res = await callService(url, headers, q, 'POST')
        let _data = res.data?.aggregations?.buckets

        let ids = []
        if (res.status === 200 && _data?.buckets.length) {

            afterKey.current = _data.after_key

            /// 

            let repo, types, r
            let repos = {}
            let list = _data?.buckets
            let _tableData = []

            if (list.length) {

                for (let d of list) {
                    types = d['type.keyword'].buckets
                    repo = d.key['repository.keyword']
                    repos[repo] = {}
                    for (let t of types) {
                        repos[repo] = { ...repos[repo], [t.key]: { unique: t.unique.value, count: t.count.value } }
                    }

                    r = repos[repo]

                    _tableData.push(
                        {
                            group: repo,
                            views: r.view?.count || 0,
                            uniqueViews: r.view?.unique || 0,
                            clones: r.clone?.count || 0,
                            uniqueClones: r.clone?.unique || 0

                        })

                }
            }

            /// END

            updateTableData(includePrevData, _tableData)


        } else {
            setHasMoreData(false)
        }
        setIsBusy(false)
    }

    const cols = [
        {
            title: 'Name',
            dataIndex: 'group',
            key: 'group',
        },
        {
            title: 'Total Views',
            dataIndex: 'views',
            key: 'views',
            render: (v, r) => {
                return <span data-field="views">{formatNum(v)}</span>
            }
        },
        {
            title: 'Unique Views',
            dataIndex: 'uniqueViews',
            key: 'uniqueViews',
            render: (v, r) => {
                return <span data-field="uniqueViews">{formatNum(v)}</span>
            }
        },
        {
            title: 'Total Clones',
            dataIndex: 'clones',
            key: 'clones',
            render: (v, r) => {
                return <span data-field="clones">{v > 0 ? formatNum(v) : '-'}</span>
            }
        },
        {
            title: 'Unique Clones',
            dataIndex: 'uniqueClones',
            key: 'uniqueClones',
            render: (v, r) => {
                return <span data-field="uniqueClones">{v > 0 ? formatNum(v) : '-'}</span>
            }
        }
    ]

    useEffect(() => {
        setTableData([])
        setVizData({})
        afterKey.current = null
        fetchData(false)
        xAxis.current = {}
        repos.current = []
        setSelectedRows([])
    }, [fromDate, toDate])


    useEffect(() => {
        for (let c of cols) {
            subgroupLabels.current[c.dataIndex] = c.title
        }
    }, [])

    const buildLineChart = async () => {
        if (!fromDate && !toDate) return
        let url = getUrl()
        if (!url) return

        let histogramOps = determineCalendarInterval()
        

        let q = ESQ.indexQueries({ from: fromDate, to: toDate, list: selectedRows })[`${indexKey}Histogram`](histogramOps)
        let headers = getHeadersWith(globusToken).headers

        // Get page for grouped Ids
        let res = await callService(url, headers, q, 'POST')
        let _vizData = []
        if (res.status == 200) {
            let _data = res.data?.aggregations?.calendarHistogram?.buckets
            let buckets = {}

            if (_data?.length) {
                const prevDate = new Date(_data[0].key_as_string + getDatePart(histogramOps))
                xAxis.current.prefix = getAxisTick(prevDate, histogramOps)
            }

            let _repos = new Set()
            let cKey
            for (let d of _data) {
                buckets[d.key_as_string] = buckets[d.key_as_string] || { xValue: d.key_as_string }
                for (let t of d['type.keyword'].buckets) {
                    for (let r of t['repository.keyword'].buckets) {
                        cKey = `${r.key}:${t.key}`
                        _repos.add(cKey)
                        buckets[d.key_as_string][cKey] = r.count.value
                    }

                }
            }
            _vizData = Object.values(buckets)

            if (_vizData.length) {
                const nextDate = new Date(_vizData[_vizData.length - 1].xValue + getDatePart(histogramOps))
                xAxis.current.suffix = getAxisTick(nextDate, histogramOps, 1)
            }


            repos.current = Array.from(_repos)
            Addon.log(`${indexKey}.buildLineChart`, {data: _vizData})

            setVizData({ ...vizData, line: _vizData })
        }
    }

    useEffect(() => {
        if (selectedRows.length < 10) {
            if (!fromDate) {
                setVizData({ ...vizData, stackedBar: selectedRowObjects })
            } else {
                buildLineChart()
            }
        } else {
            setVizData({ ...vizData, line: [] })
        }
    }, [selectedRows])


    const rowSelection = {
        selectedRowKeys: selectedRows,
        onChange: (rowKeys, rows) => {
            setSelectedRowObjects(rows)
            setSelectedRows(rowKeys)

            //console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
    };

    const yAxis = { label: "↑ Views/Clones" }

    return (<>
        {vizData.stackedBar?.length > 0 && <StackedBarWithLegend yAxis={yAxis} xAxis={{ formatter: formatNum }} data={vizData.stackedBar} subGroupLabels={subgroupLabels.current} chartId={'repos'} />}
        {vizData.line?.length > 0 && fromDate && <LineWithLegend xAxis={xAxis.current} groups={repos.current} yAxis={yAxis} data={vizData.line} chartId={'reposHistogram'} />}

        <SearchFilterTable data={tableData} columns={cols}
                formatters={{bytes: formatNum}}
                tableProps={{
                    rowKey: 'group',
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

export default LogsReposTable;

