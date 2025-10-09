import React, { useRef, useEffect, useState, useContext } from 'react';
import { Card, Col, DatePicker, Layout, Row, theme, Tabs } from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
import { callService, eq, getHeadersWith, formatNum, formatBytes } from "@/lib/helpers/general";
import ENVS from "@/lib/helpers/envs";
import AppContext from "@/context/AppContext";
import ESQ, { indexFixtures } from "@/lib/helpers/esq";
import Spinner from '@/components/Spinner';
import LogsFilesTable from '@/components/DataTable/LogsFilesTable';
import LogsReposTable from '@/components/DataTable/LogsReposTable';
import { LogsProvider } from '@/context/LogsContext';
import TABLE from '@/lib/helpers/table';
import {
    DownloadOutlined,
    ApiOutlined,
    CodeOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import LogsApiUsageTable from '@/components/DataTable/LogsApiUsageTable';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;
const Logs = () => {

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const { globusToken, isLoading, isAuthenticated } = useContext(AppContext)

    const formatDate = (date, month, day) => {
        let m = month || (date.getMonth()+1)
        let d = day || date.getDate()
        const pad = (num) => String(num).padStart(2, '0')
        return `${date.getFullYear()}-${pad(m)}-${pad(d)}`
    }

    const currentDate = new Date()
    const [fromDate, setFromDate] = useState(formatDate(currentDate, 1, 1))
    const [toDate, setToDate] = useState(formatDate(currentDate))
    const [cards, setCards] = useState(null)
    const [tabs, setTabs] = useState(null)
    const [activeSection, setActiveSection] = useState(null)
    const indicesSections = useRef({})
    const [isBusy, setIsBusy] = useState(true)
    const [extraActions, setExtraActions] = useState({})
    const tabExtraActions = useRef({})
    const exportData = useRef({})

    let _cards = {
            openSourceRepos: {
                title: 'Open Source Repositories',
                icon: <CodeOutlined />
            },
            apiUsage: {
                title: 'API Usage',
                icon: <ApiOutlined />,
                dateField: indexFixtures.apiUsage.date
            },
            fileDownloads: {
                title: 'Data Transfers',
                icon: <DownloadOutlined />,
                dateField: indexFixtures.fileDownloads.date
            }
        }

    const handleDateRange = (dates, dateStrings) => {
        setFromDate(dateStrings[0])
        setToDate(dateStrings[1])
        // dates: [dayjs, dayjs], dateStrings: [string, string]
    }

    const isApi = (key) => eq(key, 'apiUsage')

    const isRepos = (key) => eq(key, 'openSourceRepos')

    const isFiles = (key) => eq(key, 'fileDownloads')

    const getCardDetail = (key, data) => {

        let repos, totalClones, totalViews = 0
        let totalHits = 0
        let totalBytes, datasetGroups, totalFiles = 0
        let agg

        let indexData = data[key]
        agg = indexData.aggregations

        if (isApi(key)) {
            totalHits = indexData.hits?.total?.value
        } else if (isFiles(key)) {
            totalHits = indexData.hits.total?.value
            totalFiles = agg.totalFiles.value
            datasetGroups = agg.totalDatasets.value
            totalBytes = agg.totalBytes.value
        } else {
            for (let b of agg.buckets.buckets) {
                if (eq(b.key['type.keyword'], 'clone')) {
                    totalClones = b.count.value;
                } else {
                    totalViews = b.count.value;
                }
            }
            repos = agg.repos.buckets.length
        }

        const exportKey = key + 'Overview'
        if (isRepos(key)) {
            exportData.current[exportKey] = {
                fromDate,
                toDate,
                totalRepositories: repos,
                totalViews,
                totalClones
            }
            return (<>
                <div><h3>{repos}</h3></div>
                <Row>
                    <Col span={12}>{formatNum(totalViews)}<br />views</Col>
                    <Col span={12}>{formatNum(totalClones)}<br />clones</Col>
                </Row>
            </>)
        }

        if (isApi(key)) {
            let ms = []
            for (let d of indexData.aggregations.services.buckets) {
                exportData.current[exportKey] = {
                    fromDate,
                    toDate,
                    apiName: d.key,
                    requests: d.doc_count
                }
                ms.push(
                    <Row className='mb-2' key={d.key}>
                        <Col span={12}><strong>{d.key}</strong>:</Col>
                        <Col span={12}><span>{formatNum(d.doc_count)}</span></Col>
                    </Row>
                )
            }
            return (<>
                <div style={{overflowY: 'auto', maxHeight: '100px'}}>{ms}</div>
                {totalHits > 0 && <span>-----------------------------</span>}
                <Row className='mt-2'>
                    <Col span={12}><strong>{formatNum(totalHits)}</strong><br />Total requests</Col>
                </Row>
            </>)
        }

        if (isFiles(key)) {
            exportData.current[exportKey] = {
                    fromDate,
                    toDate,
                    totalBytes,
                    totalDatasets: datasetGroups,
                    totalFiles,
                    totalHits
            }
            return (<>
                <div><h3> {formatBytes(totalBytes)} <small style={{ fontSize: '.5em' }}>downloaded</small></h3></div>
                <Row className='mt-3'>
                    <Col span={12}>{formatNum(datasetGroups)}<br /><strong>Datasets</strong></Col>
                    <Col span={12}>{formatNum(totalFiles)}<br /><strong>Globus files</strong> </Col>
                </Row>
                <Row className='mt-2'>
                    <Col span={12}>{formatNum(totalHits)}<br /><strong>Hits</strong></Col>
                </Row>
            </>)
        }
    }
    const rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
    };

    const getTabId = (key) => `tab-${key}`

    const toggleHighlightClasses = (sel) => {
        const className = 'is-highlighted'
        $('.c-logCard').removeClass(className)
        $(sel).addClass(className)
    }

    const highlightSection = (e, key) => {
        setActiveSection(getTabId(key))
        toggleHighlightClasses(e.currentTarget)
    }

    const getTabContent = (key, data) => {

        let tableData = []

        if (isRepos(key)) {
            return <>
                <LogsProvider defaultMenuItem={'numOfRows'}
                    indexKey={key}
                    exportData={exportData}
                    exportHandler={exportHandler}
                    defaultDates={_cards[key].dates}
                    fromDate={fromDate} toDate={toDate}
                    tabExtraActions={tabExtraActions}
                    setExtraActions={setExtraActions}
                    extraActions={extraActions} >
                    <LogsReposTable />
                </LogsProvider>
            </>
        }
        if (isApi(key)) {

            for (let d of data[key].aggregations.services.buckets) {
                tableData.push(
                    {
                        name: d.key,
                        requests: d.doc_count,
                        endpoints: d.totalEndpoints.value,
                        endpointsHits: d.endpoints 
                    }
                )
            }

            return <>
                <LogsProvider defaultMenuItem={'numOfRows'}
                    indexKey={key}
                    exportData={exportData}
                    exportHandler={exportHandler}
                    defaultDates={_cards[key].dates}
                    fromDate={fromDate} toDate={toDate}
                    tabExtraActions={tabExtraActions}
                    setExtraActions={setExtraActions}
                    extraActions={extraActions} >
                    <LogsApiUsageTable data={tableData} />
                </LogsProvider>
            </>
        }

        if (isFiles(key)) {

            return <>
                <LogsProvider defaultMenuItem={'byDatasetID'}
                    indexKey={key}
                    exportData={exportData}
                    exportHandler={exportHandler}
                    defaultDates={_cards[key].dates}
                    fromDate={fromDate} toDate={toDate}
                    tabExtraActions={tabExtraActions}
                    setExtraActions={setExtraActions}
                    extraActions={extraActions} >
                    <LogsFilesTable />
                </LogsProvider>

            </>
        }
    }

    const getCards = (data) => {
        

        let comps = []
        let _tabs = []
        let title, date
        for (let s in indicesSections.current) {
            let from = fromDate || (data[`${s}MinDate`] ? data[`${s}MinDate`].hits.hits[0].sort[0] : null)
            if (eq(typeof from, 'number')) {
                date = new Date(from)
                from = formatDate(date)
            }
            let to = toDate || 'now'
            _cards[s].dates = {from, to}
            title = <>{_cards[s].icon}<span className='mx-3'>{_cards[s].title}<br />{from && <small style={{fontSize: '12px', color: 'grey'}}><CalendarOutlined /> {from} - {to}</small>}</span></>
            comps.push(<Card className={`c-logCard c-logCard--${s} ${isFiles(s) ? 'is-highlighted' : ''}`} title={title} key={s} variant="borderless" style={{ width: 300 }} onClick={(e) => highlightSection(e, s)}>
                {getCardDetail(s, data)}
            </Card>)
            _tabs.push({
                label: `${_cards[s].title}`,
                key: getTabId(s),
                children: getTabContent(s, data),
                icon: _cards[s].icon
            })
        }
        setCards(comps)
        if (activeSection == null) {
            setActiveSection(getTabId(Object.keys(indicesSections.current)[0]))
        }
        setTabs(_tabs)
        setIsBusy(false)
    }

    const getIndexKeyByActiveTab = (active) => active.replace('tab-', '')

    const onTabChange = (active) => {
        setActiveSection(active)
        toggleHighlightClasses('.c-logCard--'+getIndexKeyByActiveTab(active))
    }

    const fetchData = async () => {
        indicesSections.current = ENVS.logsIndicies() || {}
        let _data = {}
        let q, url, headers, res
        for (let s in indicesSections.current) {
            let index = indicesSections.current[s]
            if (!_data[s]) {
                url = ENVS.urlFormat.search(index)
                q = ESQ.indexQueries({ from: fromDate, to: toDate })[s]
                headers = getHeadersWith(globusToken).headers
                res = await callService(url,
                    headers,
                    q,
                    'POST')
                _data[s] = res.data
                
                q = ESQ.indexQueries({}).minDate(_cards[s].dateField || 'timestamp')
                res = await callService(url,
                    headers,
                    q,
                    'POST')
                _data[`${s}MinDate`] = res.data

            }
        }
        return _data
    }

    useEffect(() => {
        if (globusToken) {
            fetchData().then((data) => {
                getCards(data)
            })
        }
    }, [globusToken, fromDate, toDate]);

    useEffect(() => {
        exportData.current = {}
    }, [fromDate, toDate])

    if (!isLoading && !isAuthenticated) {
        window.location = '/'
    }

    const exportHandler = (indexKey) => {
        let _indexKey = indexKey || getIndexKeyByActiveTab(activeSection) || Object.keys(indicesSections.current)[0]
        let _data = JSON.parse(JSON.stringify(exportData.current[_indexKey])) || []
        let cols = []

        if (_data.length) {
            for (let d of _data) {
                // rename group (used in stackedBar viz) to repository
                if (d.group) {
                    d.repository = d.group
                    delete d.group
                }

                // We don't want undefined values in csv, just blank
                if (d.uuid) {
                    if (!d[TABLE.cols.f('id')]) {
                        d[TABLE.cols.f('id')] = ''
                    }
                    if (!d.datasetType) {
                        d.datasetType = ''
                    }
                    delete d.entityId
                }   
            }
            cols = Object.keys(_data[0])
            if (_data[0].repository) {
                // move repository column to front
                let c = cols.pop()
                cols.unshift(c)
            }
            _data = TABLE.flattenDataForCSV(_data)
            let timespan = exportData.current[_indexKey + 'Date']
            let fileNameDate = `${timespan.fromDate}-${timespan.toDate}`
            TABLE.generateCSVFile(_data, `${_indexKey}-${fileNameDate}.csv`, cols)
            if (!indexKey) {
                let overview = exportData.current[_indexKey + 'Overview']
                overview.fromDate = timespan.fromDate
                overview.toDate = timespan.toDate
                TABLE.generateCSVFile(TABLE.flattenDataForCSV([overview]), `${_indexKey}Overview-${fileNameDate}.csv`)
            }
        }
    }

    const dateFormat = 'YYYY-MM-DD';
    if (!isAuthenticated) {
        return <Spinner tip='' size='small' />
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppSideNavBar exportHandler={exportHandler} />
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }}>
                    <Row>
                        <Col md={{ span: 8 }} lg={{ span: 5 }} xlg={{ span: 4 }}>
                            <div style={{ padding: '10px 24px' }}>
                                <h2>Dashboard</h2>
                            </div>

                        </Col>
                        <Col md={{ span: 8 }} className='d-md'>
                            <RangePicker 
                            defaultValue={[dayjs(fromDate, dateFormat), dayjs(toDate, dateFormat)]}
                            onChange={handleDateRange} />
                        </Col>

                    </Row>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <Col md={{ span: 6 }} className='d-sm mx-2 mb-2'>
                        <RangePicker 
                        defaultValue={[dayjs(fromDate, dateFormat), dayjs(toDate, dateFormat)]}
                        onChange={handleDateRange} />
                    </Col>
                    <Row>{cards}</Row>
                    {tabs && <Row className='mt-5'><Tabs
                        onChange={onTabChange}
                        tabBarExtraContent={extraActions[activeSection]}
                        activeKey={activeSection}
                        type="card"
                        size={'middle'}
                        style={{ marginBottom: 32, width: '100%' }}
                        items={tabs}
                    /></Row>}
                    {isBusy && <Spinner />}
                </Content>
            </Layout>
        </Layout>
    );
};
export default Logs;