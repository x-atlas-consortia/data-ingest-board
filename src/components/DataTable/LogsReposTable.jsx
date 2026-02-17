import { useEffect, useContext, useRef } from "react";
import { Button, Table } from 'antd';
import ESQ from "@/lib/helpers/esq";
import { callService, eq, formatNum, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import TABLE from '@/lib/helpers/table';
import LogsContext from "@/context/LogsContext";
import StackedBarWithLegend from "@/components/Visualizations/StackedBarWithLegend";
import LineWithLegend from "@/components/Visualizations/LineWithLegend";
import SearchFilterTable from "./SearchFilterTable";
import GroupedBarWithLegend from "../Visualizations/GroupedBarWithLegend";

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
        selectedRows, setSelectedRows, setMenuItems,
        stackedGroupedBarMenuItems, setSelectedRowObjects,
        getUrl,
        determineCalendarInterval,
        getAxisTick,
        getDatePart,
        histogramDetails, setHistogramDetails,
        selectedMenuItem, setSelectedMenuItem,
        tableScroll

    } = useContext(LogsContext)

    const subgroupLabels = useRef({})
    const repos = useRef([])
    const xAxis = useRef({})
    const histogramBuckets = useRef({})


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
        let _data = res.data?.aggregations?.buckets || {}

        if (res.status === 200 && _data?.buckets?.length) {

            afterKey.current = _data.after_key

            let repo, types
            let repos = {}
            let list = _data?.buckets
            let _tableData = includePrevData ? Array.from(tableData) : []
            let _histogramBuckets = {}
            let histogramOps = determineCalendarInterval()
            let _ownerBuckets = {}

            const valuesObj = (t) => {
                return { [`unique${t.key.upCaseFirst()}s`]: t.unique?.value, [`${t.key}s`]: t.count?.value }
            }

            if (list.length) {
             
                for (let d of list) {
                    types = d['type.keyword'].buckets
                    repo = d.key['repository.keyword']
                    repos[repo] = {}
                    for (let t of types) {
                        repos[repo] = { ...repos[repo], ...valuesObj(t) }
                    }

                    _tableData.push({
                        group: repo,
                        interval: histogramOps.interval,
                        histogram: {},
                        ...repos[repo]
                    })
                    repos[repo] = { ...repos[repo], i: _tableData.length - 1 }
                  
                }

                Addon.log(`${indexKey}.Table`, { data: _tableData })

                // Get per repo histogram for table
                q = ESQ.indexQueries({ from: getFromDate(), to: getToDate(), list: Object.keys(repos) })[`${indexKey}RepoHistogram`](histogramOps)
                res = await callService(url, headers, q, 'POST')
                if (res.status == 200) {

                    let _data = res.data?.aggregations?.calendarHistogram?.buckets
                    Addon.log(`${indexKey}.RepoHistogram`, { data: _data })

                    for (let d of _data) {
                        _histogramBuckets = {}

                        if (!d['type.keyword'].buckets.length) {
                            // account for empty buckets so the respective d.key_as_string is plotted as 0 on the graph (line)
                            for (let e of _tableData) {
                                e.histogram[d.key_as_string] = {uniqueViews: 0, views: 0, uniqueClones: 0, clones: 0}
                            }
                        }

                        for (let t of d['type.keyword'].buckets) {
                            for (let r of t['repository.keyword'].buckets) {
                                repo = r.key
                                _ownerBuckets[repo] = {owner: r.owner?.buckets[0]?.key}
                                _histogramBuckets[repo] = { ...(_histogramBuckets[repo] || {}), ...valuesObj({ ...r, key: t.key }) }
                            }
                        }
                        
                        for (let r in _histogramBuckets) {
                            _tableData[repos[r].i].owner = _ownerBuckets[r].owner
                            _tableData[repos[r].i].histogram[d.key_as_string] = _histogramBuckets[r]
                        }
                    }
                }

                // Get data for bar charts
                q = ESQ.indexQueries({ from: getFromDate(), to: getToDate(), list: Object.keys(repos) })[`${indexKey}Histogram`](histogramOps)
                res = await callService(url, headers, q, 'POST')

                if (res.status == 200) {
                    _histogramBuckets = includePrevData ? histogramBuckets.current : {}
                    let dKey
                    for (let d of res.data?.aggregations?.calendarHistogram?.buckets) {
                        dKey = d.key_as_string
                        _histogramBuckets[dKey] = { group: dKey }
                        for (let t of d['type.keyword'].buckets) {
                            _histogramBuckets[dKey] = { ..._histogramBuckets[dKey], ...valuesObj(t) }
                        }
                    }
                    histogramBuckets.current = _histogramBuckets
                    setVizData({ ...vizData, bar: Object.values(_histogramBuckets) })
                }
                // end get data for bar charts
            }

            if (!histogramDetails) {
                setHistogramDetails(histogramOps)
            }
            updateTableData(false, _tableData)
        } else {
            setHasMoreData(false)
        }
        setIsBusy(false)
    }

    const sorter = (a, b, k) => {
        const _a = a[k] || 0
        const _b = b[k] || 0
        return _a - _b
    }

    const cols = [
        {
            title: 'Name',
            dataIndex: 'group',
            key: 'group',
            sorter: (a, b) => a.group.localeCompare(b.group),
            render: (v, r) => {
                return <span data-field="group">{v}</span>
            }
        },
         {
            title: 'Owner',
            dataIndex: 'owner',
            key: 'owner',
            sorter: (a, b) => a.owner.localeCompare(b.owner),
            render: (v, r) => {
                return <span data-field="owner">{v}</span>
            }
        },
        {
            title: 'Total Views',
            dataIndex: 'views',
            key: 'views',
            sorter: (a, b) => sorter(a, b, 'views'),
            render: (v, r) => {
                return <span data-field="views">{formatNum(v)}</span>
            }
        },
        {
            title: 'Unique Views',
            dataIndex: 'uniqueViews',
            key: 'uniqueViews',
            sorter: (a, b) => sorter(a, b, 'uniqueViews'),
            render: (v, r) => {
                return <span data-field="uniqueViews">{formatNum(v)}</span>
            }
        },
        {
            title: 'Total Clones',
            dataIndex: 'clones',
            key: 'clones',
            sorter: (a, b) => sorter(a, b, 'clones'),
            render: (v, r) => {
                return <span data-field="clones">{v > 0 ? formatNum(v) : '-'}</span>
            }
        },
        {
            title: 'Unique Clones',
            dataIndex: 'uniqueClones',
            key: 'uniqueClones',
            sorter: (a, b) => sorter(a, b, 'uniqueClones'),
            render: (v, r) => {
                return <span data-field="uniqueClones">{v > 0 ? formatNum(v) : '-'}</span>
            }
        }
    ]

    useEffect(() => {
        setMenuItems(stackedGroupedBarMenuItems)
    }, [selectedMenuItem])


    useEffect(() => {
        setSelectedMenuItem('groupedBar')
    }, [])

    const resetView = () => {
        setTableData([])
        setVizData({})
        afterKey.current = null
        fetchData(false)
        histogramBuckets.current = {}
        xAxis.current = {}
        repos.current = []
        setSelectedRows([])
        setSelectedRowObjects([])
    }

    useEffect(() => {
        resetView()
    }, [fromDate, toDate])

     useEffect(() => {
        if (!histogramDetails || histogramDetails.isMenuAction) {
            resetView()
        }
    }, [histogramDetails])


    useEffect(() => {
        for (let c of cols) {
            if (!eq(c.key, 'group') && !eq(c.key, 'owner')) {
               subgroupLabels.current[c.dataIndex] = c.title 
            }
        }
    }, [])

    const buildLineChart = (_data = []) => {

        let histogramOps = determineCalendarInterval()
        let _vizData = []
        let buckets = {}

        let _repos = new Set()
        let cKey
        let i = 0
        for (let d in _data.histogram) {
            buckets[d] = buckets[d] || { xValue: d }
            for (let t in _data.histogram[d]) {
                cKey = `${_data.group}:${t}`
                _repos.add(cKey)
                buckets[d][cKey] = _data.histogram[d][t]
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
        return  {...xAxis.current, formatter: formatNum, label: `Views/Clones per ${histogramDetails?.interval}`}
    }

    const formatAnalytics = (v, details) => {
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
        return <>
            {_vizData.length > 0 && fromDate && <LineWithLegend xAxis={_xAxis()} groups={repos.current} yAxis={yAxis} data={_vizData} chartId={`reposHistogram-${row.group}`} />}
        </>
    }

    return (<>
        {vizData.bar?.length > 0 && eq(selectedMenuItem, 'groupedBar') && <GroupedBarWithLegend yAxis={yAxis} xAxis={_xAxis()} data={vizData.bar} subGroupLabels={subgroupLabels.current} chartId={'repos'} />}
        {vizData.bar?.length > 0 && eq(selectedMenuItem, 'stackedBar') && <StackedBarWithLegend yAxis={yAxis} xAxis={_xAxis()} data={vizData.bar} subGroupLabels={subgroupLabels.current} chartId={'repos'} />}

        <SearchFilterTable data={tableData} columns={cols}
            formatters={{}}
            tableProps={{
                ...TABLE.expandableHistogram('group', formatAnalytics, repoLineChart),
                rowKey: 'group',
                rowSelection: { type: 'checkbox', ...rowSelection },
                pagination: false,
                loading: isBusy,
                ...tableScroll
            }} />
        {hasMoreData && <Button onClick={fetchData} type="primary" block>
            Load More
        </Button>}

    </>)
}

export default LogsReposTable;

