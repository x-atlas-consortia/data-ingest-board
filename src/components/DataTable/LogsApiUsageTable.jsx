import { useEffect, useContext, useRef } from "react";
import { Button, Table, Collapse, Badge, List } from 'antd';
import ESQ from "@/lib/helpers/esq";
import { callService, eq, formatNum, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import TABLE from '@/lib/helpers/table';
import LogsContext from "@/context/LogsContext";
import OverlappedBarWithLegend from "@/components/Visualizations/OverlappedBarWithLegend";
import SearchFilterTable from "./SearchFilterTable";
import ModalOverComponent from "../ModalOverComponent";
import { InfoCircleOutlined } from "@ant-design/icons";
import GroupedBarWithLegend from "@/components/Visualizations/GroupedBarWithLegend";

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
        stackedGroupedBarMenuItems, setSelectedRowObjects,
        getUrl,
        determineCalendarInterval,
        selectedMenuItem,
        setSelectedMenuItem,
        setMenuItems,
        histogramDetails, setHistogramDetails,
        tableScroll, isLogScale,
        getScaleSwitchMenuItem,

    } = useContext(LogsContext)

    const apis = useRef({})

    const fetchData = async (includePrevData = true) => {
        setIsBusy(true)

        if (data.length) {
            let histogramOps = determineCalendarInterval()
            if (!histogramDetails) {
                setHistogramDetails(histogramOps)
            }

            await buildStackedBarChart(includePrevData, histogramOps)

            if (data.length < numOfRows) {
                setHasMoreData(false)
            }
        } else {
            setHasMoreData(false)
        }
        setIsBusy(false)
    }

    const endpointsDetails = (r, details = {}) => {
        let list = []
        const style = { overflowY: 'auto', maxHeight: '500px' }

        for (let e of r.endpointsHits.buckets) {
            list.push({
                key: e.key.replaceAll('/', '_'),
                label: e.key,
                children: <div style={style}><List
                    size="small"
                    bordered
                    dataSource={e.endpoints.buckets}
                    renderItem={(item) => <List.Item actions={[<Badge count={formatNum(item.doc_count)} color="#495057" />]}>{item.key}</List.Item>}
                /></div>,
                extra: <Badge count={formatNum(e.doc_count)} color="#495057" />,
            })

        }
        let apiName = r.name || details.row?.name
        let modalContent = <div style={style}>
            {apis.current[apiName] > 20 && <p className="alert alert-info"><InfoCircleOutlined /><small className="mx-2">Only the top 20 endpoints are displayed.</small></p>}
            <Collapse
                expandIconPosition={'start'}
                items={list}
            /></div>
        return (<ModalOverComponent modalOps={{ width: '60%', title: <><h4>Top requested endpoints for {apiName} {details.field ? `in ${details.field}` : `from ${getFromDate()} to ${getToDate()}`}</h4></> }}
            modalContent={modalContent} childrenAsTrigger={true} popoverText="See top requested endpoints.">
            <span data-field="endpoints" className="txt-lnk">{formatNum(r.endpoints || r.requests)}</span>
        </ModalOverComponent>)
    }

    const cols = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Endpoints',
            dataIndex: 'endpoints',
            key: 'endpoints',
            sorter: (a, b) => a.endpoints - b.endpoints,
            render: (v, r) => {
                return endpointsDetails(r)
            }
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
        setMenuItems([...stackedGroupedBarMenuItems, getScaleSwitchMenuItem()])
    }, [selectedMenuItem, isLogScale])


    useEffect(() => {
        setSelectedMenuItem('groupedBar')
    }, [])

    const resetView = () => {
        setTableData([])
        setVizData({})
        fetchData(false)
        apis.current = {}
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

    const buildStackedBarChart = async (includePrevData, histogramOps) => {
        let url = getUrl()
        if (!url) return

        let q = ESQ.indexQueries({ from: getFromDate(), to: getToDate(), list: data.map((r) => r.name) })[`${indexKey}Histogram`](histogramOps)
        let headers = getHeadersWith(globusToken).headers

        let res = await callService(url, headers, q, 'POST')
        let _vizData = []
        if (res.status == 200) {
            let _data = res.data?.aggregations?.calendarHistogram?.buckets
            let histogramBuckets = {}

            let apiListIndexes = {}
            for (let i = 0; i < data.length; i++) {
                data[i].histogram = {}
                data[i].interval = histogramOps.interval
                apiListIndexes[data[i].name] = i
            }
            let _tableData = Array.from(data)

            let endpointsPerApi = {}
            let apiName, bKey
            for (let d of _data) {
                bKey = d.key_as_string
                histogramBuckets[bKey] = histogramBuckets[bKey] || { group: bKey }
                for (let t of d['host.keyword'].buckets) {
                    apiName = `${t.key}`
                    apis.current[apiName] = apiName
                    endpointsPerApi[apiName] =  _tableData[apiListIndexes[apiName]].endpoints
                    histogramBuckets[bKey][apiName] = t.doc_count
                    _tableData[apiListIndexes[apiName]].histogram[bKey] = {requests: t.doc_count, endpointsHits: t.endpoints}
                }
            }

            _vizData = Object.values(histogramBuckets)
            Addon.log(`${indexKey}.buildStackedBarChart`, { data: _vizData })

            setVizData({ ...vizData, bar: _vizData })
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

    const yAxis = { label: "Requests", formatter: formatNum, scaleLog: isLogScale }
    const xAxis = { formatter: formatNum, label: `Requests per ${histogramDetails?.interval}` }

    const formatAnalytics = (v, details) => {
        return endpointsDetails(v, details)
    }

    return (<>

        {vizData.bar?.length > 0 && eq(selectedMenuItem, 'groupedBar') && <GroupedBarWithLegend xAxis={xAxis} subGroupLabels={apis.current} yAxis={yAxis} data={vizData.bar} chartId={'usageHistogram'} />}
        {vizData.bar?.length > 0 && eq(selectedMenuItem, 'overlappedBar') && <OverlappedBarWithLegend xAxis={xAxis} subGroupLabels={apis.current} yAxis={yAxis} data={vizData.bar} chartId={'usageHistogram'} />}

        <SearchFilterTable data={tableData} columns={cols}
            formatters={{ bytes: formatNum }}
            tableProps={{
                ...TABLE.expandableHistogram('name', formatAnalytics),
                rowKey: 'name',
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

export default LogsApiUsageTable;

