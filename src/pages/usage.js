import React, { useRef, useEffect, useState, useContext } from 'react';
import { Card, Col, DatePicker, Layout, Row, theme, Tabs, Carousel, Button, Tooltip, Spin  } from 'antd';
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
    CalendarOutlined,
    ExclamationCircleFilled, 
    MinusOutlined,
    PlusOutlined
} from "@ant-design/icons";
import LogsApiUsageTable from '@/components/DataTable/LogsApiUsageTable';
import dayjs from 'dayjs';
import AppModal from '@/components/AppModal';
import { modalDefault } from '@/lib/constants';
import Unauthorized from '@/components/Unauthorized';

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;
const Logs = () => {

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const { globusToken, isLoading, isAuthenticated, handleLogout } = useContext(AppContext)

    const formatDate = (date, month, day) => {
        let m = month || (date.getMonth() + 1)
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
    const isSearchApiUnauthorized = useRef(false)
    const [showUnauthorized, setShowUnauthorized] = useState(false)
    const dateFormat = 'YYYY-MM-DD';

    const [modal, setModal] = useState(modalDefault)
    const [_refresh, setRefresh] = useState(null)
    const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(false)

    const refresh = () => setRefresh(new Date().getTime())

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

        let totalHits = 0
        let totalBytes, datasetGroups, totalFiles = 0
        let agg
        let repoData = []

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
            let owner,total
            let stats = []
            for (let o of agg.repos.buckets) {
                owner = o.key
                total = o.total.buckets.length
                stats = []
                for (let b of o.buckets.buckets) {
                    stats.push({
                        type: b.key,
                        count: b.count.value,
                        unique: b.unique.value
                    })
                }
                repoData.push({
                    fromDate,
                    toDate,
                    owner,
                    total,
                    stats
                })
            }

        }

        const exportKey = key + 'Overview'
        if (isRepos(key)) {
            exportData.current[exportKey] = repoData
            let cardInfo = []
            for (let d of repoData) {
                let colInfo = []
                for (let c of d.stats) {
                    colInfo.push(<Row key={c.type} className='mt-3'>
                        <Col span={12}>{formatNum(c.count)}<br /><strong>{c.type.upCaseFirst()}s</strong></Col>
                        <Col span={12}>{formatNum(c.unique)}<br /><strong>Unique {c.type}s</strong></Col>
                    </Row>)
                }
                cardInfo.push(
                    <div key={d.owner}>
                        <div><h3> {d.total} <small>{d.owner}</small></h3></div>
                        {colInfo}
                    </div>
                )
            }
            return (<div className='c-logCard__slickWrap'><Carousel>{cardInfo}</Carousel></div>)
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
                    <Row className='mt-3 w-50' key={d.key}>
                        <Col> <span>{formatNum(d.doc_count)}</span><br /><strong>{d.key}</strong></Col>
                    </Row>
                )
            }
            return (<>
                <div><h3>{formatNum(totalHits)} <small>total requests</small></h3></div>
                <div className='c-logCard__flexWrap'>{ms}</div>
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
                <div><h3> {formatBytes(totalBytes)} <small>downloaded</small></h3></div>
                <Row className='mt-3'>
                    <Col>{formatNum(datasetGroups)}<br /><strong>Datasets/Data Uploads</strong></Col>
                </Row>
                <Row className='mt-3'>
                    <Col span={12}>{formatNum(totalFiles)}<br /><strong>Globus files</strong> </Col>
                    <Col span={12}>{formatNum(totalHits)}<br /><strong>Hits</strong></Col>
                </Row>
            </>)
        }
    }

    const getTabId = (key) => `tab-${key}`

    const toggleHighlightClasses = (sel) => {
        const className = 'is-highlighted'
        $('.c-logCard').removeClass(className)
        $(sel).addClass(className)
    }

    const configureTabURL = (key) => window.history.pushState(null, null, `?tab=${_cards[key]?.title?.replaceAll(' ', '+')}`)

    const highlightSection = (e, key) => {
        configureTabURL(key)
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

    const tabTitles = Object.values(_cards).map((c) => c.title.toLowerCase())

    const getTabByTitle = (t) => {
        for (const [key, value] of Object.entries(_cards)) {
            if (eq(value.title, t)) return key
        }
       return t 
    }

    const getCards = (data) => {
        let tabName = Object.keys(indicesSections.current)[0] 
        const query = new URLSearchParams(window.location.search)
        const tab = query.get('tab')
        
        if (tab && (Object.keys(indicesSections.current).comprises(tab) || tabTitles.comprises(tab.toLowerCase())) ) {
            tabName = getTabByTitle(tab)
        }

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
            _cards[s].dates = { from, to }
            title = <>{_cards[s].icon}<span className='mx-3'><span className='c-logCard__title'>{_cards[s].title}</span><br />{from && <small className='c-logCard__date'><CalendarOutlined /> {from} - {to}</small>}</span> </>
            comps.push(<Card className={`c-logCard c-logCard--${s} ${s == tabName ? 'is-highlighted' : ''}`} 
                extra={<><span className='pull-right c-logCard__spinner'><Spin size='small' /></span></>}
            title={title} key={s} 
            variant="borderless" 
            onClick={(e) => highlightSection(e, s)}>
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
            setActiveSection(getTabId(tabName))
        }
        setTabs(_tabs)
        setIsBusy(false)
    }

    const getIndexKeyByActiveTab = (active) => active.replace('tab-', '')

    const onTabChange = (active) => {
        setActiveSection(active)
        configureTabURL(getIndexKeyByActiveTab(active))
        toggleHighlightClasses('.c-logCard--' + getIndexKeyByActiveTab(active))
    }

    const fetchData = async () => {
        setIsBusy(true)
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
            
                if (res.status == 401) {
                    isSearchApiUnauthorized.current = true
                    console.error('User unauthorized', res)
                    break
                }
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
                if (Object.keys(data).length) {
                    getCards(data)
                } else {
                    if (isSearchApiUnauthorized.current && isAuthenticated) {
                        setShowUnauthorized(true)
                    }
                }
                
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
        let hasLengthy = false
        const charLimit = 32767

        const _checkCharLength = (i, d, c) => {
            if (d[c]) {
                let histogramStr = JSON.stringify(d[c]).replace(/"/g, '""')
                if ((histogramStr.length > charLimit) || (eq(c, 'histogram') && d.endpointsHits)) { // or just auto remove the inner hits info
                    hasLengthy = hasLengthy || []
                    let newCell = ''
                    if (d.endpointsHits) {
                        let buckets = {}
                        for (let h in d.histogram) {
                            buckets[h] = d.histogram[h].requests
                        }
                        newCell = buckets
                    }
                    hasLengthy.push({c, i, newCell})
                }
            }
        } 

        if (_data.length) {
            let i = 0
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

                _checkCharLength(i, d, 'histogram')
                _checkCharLength(i, d, 'endpointsHits')
                i++
            }

            cols = Object.keys(_data[0])
            if (_data[0].repository) {
                // move repository column to front
                let c = cols.pop()
                cols.unshift(c)
            }

            let timespan = exportData.current[_indexKey + 'Date']
            let fileNameDate = `${timespan.fromDate}-${timespan.toDate}`

            const _csvDownload = (removeLengthy = false) => {
                if (removeLengthy) {
                    for (let x of hasLengthy) {
                        _data[x.i][x.c] = x.newCell
                    }
                }
                _data = TABLE.flattenDataForCSV(_data)
                TABLE.generateCSVFile(_data, `${_indexKey}-${fileNameDate}.csv`, cols)
            }

            const _csvDownloadAndCloseModal = (removeLengthy = false) => {
                setModal({...modal, open:false})
                _csvDownload(removeLengthy)
            }

            if (hasLengthy) {
                // Show modal warning of csv lengthy
                let title = <h4><ExclamationCircleFilled  style={{color:'var(--bs-warning)'}} /> CSV Cell Character Limit</h4>
                let body = <span>Please note the CSV requested for export contains one or more cells which surpass character size limits for programs like Excel.</span>
               
                const footer = [
                    <Button icon={<DownloadOutlined />} onClick={()=>{_csvDownloadAndCloseModal(true)}}> Download with truncation of lengthy cell(s)</Button>,
                    <Button color="primary" variant="solid" onClick={()=>{_csvDownloadAndCloseModal()}}> Ok</Button>
                ]
                setModal({...modal, title, body, open: true, footer})       
            } else {
                _csvDownload()
            }
            
            // Download overview
            if (!indexKey) {
                let overview = exportData.current[_indexKey + 'Overview']
                overview = Array.isArray(overview) ? overview : [overview]
                for (let o of overview) {
                    o.fromDate = timespan.fromDate
                    o.toDate = timespan.toDate
                }
                TABLE.generateCSVFile(TABLE.flattenDataForCSV(overview), `${_indexKey}Overview-${fileNameDate}.csv`)
            }
        }
    }

    const toggleOverview = () => {
        setIsOverviewCollapsed(!isOverviewCollapsed)
    }


    if (!isAuthenticated) {
        return <Spinner tip='' size='small' />
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppSideNavBar exportHandler={showUnauthorized ? undefined : exportHandler} />
            {showUnauthorized && <div className='container mt-5'><Unauthorized withLayout={true} /></div>}
            {!showUnauthorized && <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }} className='c-barHead'>
                    <Row>
                        <Col className='c-barHead__col c-barHead__col--title' >
                            <div style={{ padding: '10px 24px' }}>
                                <h2 className='text-truncate'>Usage Dashboard</h2>
                            </div>

                        </Col>
                        <Col className='c-barHead__col c-barHead__col--date d-md c-pickerRange'>
                            <RangePicker
                                defaultValue={[dayjs(fromDate, dateFormat), dayjs(toDate, dateFormat)]}
                                onChange={handleDateRange} />
                            <button onClick={refresh} className='btn btn-primary rounded-0 c-pickerRange__filterBtn'>Filter</button>
                        </Col>

                    </Row>
                </Header>
                <Content
                    className='ant-content--logs'
                    style={{
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <span style={{float: 'right'}}>
                        {!isOverviewCollapsed && <Tooltip title='Hide overview section' placement='left'><MinusOutlined className='txt-lnk' onClick={toggleOverview} /></Tooltip>}
                        {isOverviewCollapsed && <Tooltip title='Show overview section' placement='left'><PlusOutlined className='txt-lnk' onClick={toggleOverview}  /></Tooltip>}
                    </span>
                    <Col md={{ span: 6 }} className='d-sm mx-2 mb-2 c-pickerRange'>
                        <RangePicker
                            defaultValue={[dayjs(fromDate, dateFormat), dayjs(toDate, dateFormat)]}
                            onChange={handleDateRange} />
                        <button onClick={refresh} className='btn btn-primary rounded-0 c-pickerRange__filterBtn'>Filter</button>
                    </Col>
                    {!isOverviewCollapsed && <Row className={`c-logCards ${isBusy ? 'isBusy' : ''}`}>{cards}</Row>}
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
                    <AppModal modal={modal} setModal={setModal} id='modal--logs' />
                </Content>
            </Layout>}
        </Layout>
    );
};
export default Logs;