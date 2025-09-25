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

    const subgroupLabels = useRef({})
    const repos = useRef([])
    const xAxis = useRef({})


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

        let res = await callService(url, headers, q, 'POST')
        let _data = res.data?.aggregations?.buckets

        if (res.status === 200 && _data?.buckets.length) {

            afterKey.current = _data.after_key

            /// 

            let repo, types
            let repos = {}
            let list = _data?.buckets
            let _tableData = []
            let _histogram = {}
            let histogramOps = determineCalendarInterval()

            const valuesObj = (t) => {
                return { [`unique${t.key.upCaseFirst()}s`]: t.unique?.value, [`${t.key}s`]: t.count?.value }
            }

            if (list.length) {
                let i = 0
                for (let d of list) {
                    types = d['type.keyword'].buckets
                    repo = d.key['repository.keyword']
                    repos[repo] = {}
                    for (let t of types) {
                        repos[repo] = { ...repos[repo], ...valuesObj(t) }
                    }

                    _tableData.push({
                        group: repo,
                        _countByInterval: {},
                        ...repos[repo]
                    })
                    repos[repo] = { ...repos[repo], i }
                    i++
                }

                Addon.log(`${indexKey}.Table`, { data: _tableData })

                // Get per repo histogram for table
                q = ESQ.indexQueries({ from: getFromDate(), to: getToDate(), list: Object.keys(repos) })[`${indexKey}RepoHistogram`](histogramOps)
                res = await callService(url, headers, q, 'POST')
                if (res.status == 200) {

                    let _data = res.data?.aggregations?.calendarHistogram?.buckets
                    Addon.log(`${indexKey}.RepoHistogram`, { data: _data })

                    for (let d of _data) {
                        _histogram = {}
                        for (let t of d['type.keyword'].buckets) {

                            for (let r of t['repository.keyword'].buckets) {
                                repo = r.key
                                _histogram[repo] = { ...(_histogram[repo] || {}), ...valuesObj({ ...r, key: t.key }) }
                            }
                        }
                        for (let r in _histogram) {
                            _tableData[repos[r].i]._countByInterval[d.key_as_string] = _histogram[r]
                        }

                    }
                }

                // Get data for stackedBar
                q = ESQ.indexQueries({ from: getFromDate(), to: getToDate(), list: Object.keys(repos) })[`${indexKey}Histogram`](histogramOps)
                res = await callService(url, headers, q, 'POST')

                if (res.status == 200) {
                    _histogram = {}
                    let dKey
                    for (let d of res.data?.aggregations?.calendarHistogram?.buckets) {
                        dKey = d.key_as_string
                        _histogram[dKey] = { group: dKey }
                        for (let t of d['type.keyword'].buckets) {
                            _histogram[dKey] = { ..._histogram[dKey], ...valuesObj(t) }
                        }
                    }
                    setVizData({ ...vizData, stackedBar: Object.values(_histogram) })
                }
                // end get data for stackedBar
            }

            setHistogramDetails(histogramOps)
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
        setSelectedRowObjects([])
    }, [fromDate, toDate])


    useEffect(() => {
        for (let c of cols) {
            subgroupLabels.current[c.dataIndex] = c.title
        }
    }, [])

    const buildLineChart = (_data = []) => {

        let histogramOps = determineCalendarInterval()
        let _vizData = []
        let buckets = {}

        let _repos = new Set()
        let cKey
        let i = 0
        for (let d in _data._countByInterval) {
            buckets[d] = buckets[d] || { xValue: d }
            for (let t in _data._countByInterval[d]) {
                cKey = `${_data.group}:${t}`
                _repos.add(cKey)
                buckets[d][cKey] = _data._countByInterval[d][t]
            }

            if (i == 0) {
                const prevDate = new Date(d + getDatePart(histogramOps))
                xAxis.current.prefix = getAxisTick(prevDate, histogramOps)
            }
            i++
        }
        _vizData = Object.values(buckets)

        if (_vizData.length) {
            const nextDate = new Date(_vizData[_vizData.length - 1].xValue + getDatePart(histogramOps))
            xAxis.current.suffix = getAxisTick(nextDate, histogramOps, 1)
        }

        repos.current = Array.from(_repos)
        Addon.log(`${indexKey}.buildLineChart`, { data: _vizData })

       return _vizData
    }

    const rowSelection = {
        selectedRowKeys: selectedRows,
        onChange: (rowKeys, rows) => {
            setSelectedRowObjects(rows)
            setSelectedRows(rowKeys)
        },
    };

    const yAxis = { label: "Views/Clones" }
    const _xAxis = () => {
        return  {...xAxis.current, formatter: formatNum, label: `Views/Clones per ${histogramDetails.interval}`}
    }

    const formatAnalytics = (v) => {
        let cols = []
        for (let i of Object.keys(v)) {
            cols.push({
            title: <span className="text-muted">{subgroupLabels.current[i]}</span>,
            dataIndex: i,
            key: i,
            render: (v, r) => {
                return <span>{formatNum(v)}</span>
            }
        },)
        }
        return <Table pagination={false} columns={cols} dataSource={[v]} />
    }

    const repoLineChart = (row) => {
        const _vizData = buildLineChart(row)
        //colorGroups={['views', 'clones', 'uniqueClones', 'uniqueViews']}
        return <>
            {_vizData.length > 0 && fromDate && <LineWithLegend xAxis={_xAxis()} groups={repos.current} yAxis={yAxis} data={_vizData} chartId={`reposHistogram-${row.group}`} />}
        </>
    }

    return (<>
        {vizData.stackedBar?.length > 0 && <StackedBarWithLegend yAxis={yAxis} xAxis={_xAxis()} data={vizData.stackedBar} subGroupLabels={subgroupLabels.current} chartId={'repos'} />}


        <SearchFilterTable data={tableData} columns={cols}
            formatters={{}}
            tableProps={{
                ...TABLE.expandableHistogram('group', formatAnalytics, repoLineChart),
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

