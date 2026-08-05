import React, { useRef, useEffect, useState, useContext } from 'react';
import { Card, Col, DatePicker, Layout, Row, theme, Tabs, Carousel, Button, Tooltip, Spin  } from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
import { callService, eq, getHeadersWith, formatNum, formatBytes, roundToTheNearest } from "@/lib/helpers/general";
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
    PlusOutlined,
    InfoCircleOutlined,
    InboxOutlined
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

    const { globusToken, isLoading, isAuthenticated, dispatchGTM } = useContext(AppContext)

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
    const defaultIsLogScale = useRef({apiUsage: true, fileDownloads: true})
    const repoCarouselRef = useRef(null);
    const aggregatedData = useRef({})

    const refresh = () => setRefresh(new Date().getTime())

    const _dispatchGTM = (action, event = 'cta') => {
        dispatchGTM({action, event, info: getCurrentTab()})
    }

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
        const [from, to] = dateStrings || [null, null]
        setFromDate(from)
        setToDate(to)
        _dispatchGTM('dateFilter')
        // dates: [dayjs, dayjs], dateStrings: [string, string]
    }

    const isApi = (key) => eq(key, 'apiUsage')

    const isRepos = (key) => eq(key, 'openSourceRepos')

    const isFiles = (key) => eq(key, 'fileDownloads')

    const getCardDetail = (key, data) => {
        let agg
        let indexData = data[key]
        agg = indexData?.aggregations

        let totalHits = 0
        let totalBytes, datasetGroups, totalFiles = 0
        let repoData = []
        const aggregatedSums = getSumByIndex(key)

        const noData = <div className='c-logCard__noData'><p className="text-center" style={{ width: '95%', margin: '0 auto' }}><InboxOutlined style={{ fontSize: '30px' }} /> <br />Could not retrieve data for the selected date range.</p></div>
        if (!agg && !aggregatedSums) {
            return noData
        }

        if (isApi(key)) {
            totalHits = aggregatedSums.totalRequests

            if (!totalHits) {
                return noData
            }
        } else if (isFiles(key)) {
            totalFiles = aggregatedSums.totalFileDownloads 
            totalFiles = totalFiles > 100000 ? roundToTheNearest(totalFiles) : totalFiles
            datasetGroups = aggregatedSums.distinctDatasetsWithFileDownload
            totalBytes = aggregatedSums.totalBytes

            if (!totalBytes) {
                return noData
            }
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
            if (!repoData.length) {
                return noData
            }

        }

        const exportKey = key + 'Overview'
        if (isRepos(key)) {
            repoData.sort((a,b) => (a.owner > b.owner) ? 1 : ((b.owner > a.owner) ? -1 : 0))
            exportData.current[exportKey] = repoData
            let cardInfo = []
            let sliderNav = []
            let i = 0

            const afterRepoSliderChange = (slideIndex) => {
               
                const $dots = $('#js-sliderNav li')
                $dots.removeClass('slideNav-active arrow arrow-next arrow-prev')
                let label 
                $dots.each((i, el) => {
                    label = $(el).attr('aria-label')
                    if (i < slideIndex) {
                        $(el).addClass('arrow arrow-prev').attr('title', `Go to the previous slide: ${label}`)
                    } else {
                        if (i > slideIndex) {
                           $(el).addClass('arrow arrow-next').attr('title', `Go to the next slide: ${label}`) 
                        }
                        if (i === slideIndex) {
                            $(el).addClass('slideNav-active').attr('title', `Current slide: ${label}`) 
                        }
                    }
                })
            }

            const navigateSlider = (e) => {
                const $el = $(e.currentTarget)
                const index = Number($el.attr('data-index'))
                repoCarouselRef.current.goTo(index)
                afterRepoSliderChange(index)
            }

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

                sliderNav.push(<li key={'li'+d.owner} data-index={i} aria-label={d.owner} onClick={navigateSlider}>&nbsp;<span>{i + 1}</span></li>)
                i++
            }

            let _timeout
            
            const styleDots = (slideIndex) => {
                clearTimeout(_timeout)
                setTimeout(() => {
                    afterRepoSliderChange(slideIndex)
                }, 100)
            }
            styleDots(0)
            
            return (<div className='c-logCard__slickWrap'>
                <Carousel dots={false} ref={repoCarouselRef}>{cardInfo}
                </Carousel>
                <div className='position-relative'><ul id='js-sliderNav' className='slider-nav'>{sliderNav}</ul></div>
                </div>)
        }

        if (isApi(key)) {

            let ms = []
            delete aggregatedSums.totalRequests
            for (let d in aggregatedSums) {
                exportData.current[exportKey] = {
                    fromDate,
                    toDate,
                    apiName: d,
                    requests: aggregatedSums[d]
                }
                ms.push(
                    <Row className='mt-3 w-50' key={d}>
                        <Col> <span>{formatNum(aggregatedSums[d])}</span><br /><strong>{d}</strong></Col>
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
            }
            return (<>
                <div><h3> {formatBytes(totalBytes)} <small>downloaded</small></h3></div>
                <Row className='mt-3'>
                    <Col>{formatNum(datasetGroups)}<br /><strong>Datasets/Data Uploads</strong></Col>
                </Row>
                <Row className='mt-3'>
                    <Col span={12}><span>
                        {formatNum(totalFiles)} &nbsp;
                        <Tooltip placement="right" title={`Estimated total number of files downloaded.`}>
                            <InfoCircleOutlined />
                        </Tooltip>
                        </span><br />
                        <strong>Files downloaded</strong> 
                    </Col>
                   
                </Row>
            </>)
        }
    }

    const getTabId = (key) => `tab-${key}`

    const toggleHighlightClasses = (sel) => {
        const className = 'is-highlighted'
        $('.c-logCard').removeClass(className)
        $(sel).addClass(className)
        _dispatchGTM('tabChange')
    }

    const configureTabURL = (key) => window.history.pushState(null, null, `?tab=${_cards[key]?.title?.replaceAll(' ', '+')}`)

    const highlightSection = (e, key) => {
        configureTabURL(key)
        setActiveSection(getTabId(key))
        toggleHighlightClasses(e.currentTarget)
    }

    const getTabContent = (key, data) => {

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
            return <>
                <LogsProvider defaultMenuItem={'numOfRows'}
                    indexKey={key}
                    exportData={exportData}
                    exportHandler={exportHandler}
                    defaultDates={_cards[key].dates}
                    fromDate={fromDate} toDate={toDate}
                    tabExtraActions={tabExtraActions}
                    setExtraActions={setExtraActions}
                    extraActions={extraActions}
                    defaultIsLogScale={defaultIsLogScale} >
                    <LogsApiUsageTable />
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
                    extraActions={extraActions}
                    defaultIsLogScale={defaultIsLogScale}
                    aggregatedData={aggregatedData}
                    >
                    
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

    const getCurrentTab = () => {
        let tabName = Object.keys(indicesSections.current)[0] 
        const query = new URLSearchParams(window.location.search)
        const tab = query.get('tab')
        
        if (tab && (Object.keys(indicesSections.current).comprises(tab) || tabTitles.comprises(tab.toLowerCase())) ) {
            tabName = getTabByTitle(tab)
        }
        return tabName
    }

    const getCards = (data) => {
        const tabName = getCurrentTab()

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

    const getIndexKeyByActiveTab = (active) => active?.replace('tab-', '')

    const onTabChange = (active) => {
        setActiveSection(active)
        configureTabURL(getIndexKeyByActiveTab(active))
        toggleHighlightClasses('.c-logCard--' + getIndexKeyByActiveTab(active))
    }

    const fetchAggregatedData = async () => {
        const url = ENVS.urlFormat.search('logs-aggregated')
        const headers = getHeadersWith(globusToken).headers
        const res = await callService(url, headers, {}, 'POST') 
        for (const h of (res.data?.hits?.hits || [])) {
            aggregatedData.current[h._id] = JSON.parse(h._source.query_result)
        }
    }

    const getSumByIndex = (index) => {
        if (isRepos(index)) return null;
        const aggregatedIndexName = isApi(index) ? `${indexFixtures.apiUsage.aggName}day` : `${indexFixtures.fileDownloads.aggName}day`
        const logs = aggregatedData.current[aggregatedIndexName]?.aggregations?.calendarHistogram?.buckets || []

        const filteredLogs = ESQ.filterByDate(logs, fromDate, toDate)

        const sum = {};
        if (isApi(index)) {
            for (const log of filteredLogs) {
               for (const b of log['host.keyword'].buckets ) {
                    if (!sum[b.key]) {
                       sum[b.key] = 0
                    }
                    sum[b.key] += b.doc_count
               }
            }
            sum.totalRequests =  Object.values(sum).reduce((sum, x) => sum + x, 0)
        }

        if (isFiles(index)) {
            sum.totalBytes = 0
            sum.totalFileDownloads = 0
            sum.distinctDatasetsWithFileDownload = 0
            for (const log of filteredLogs) {
                sum.totalBytes += log.totalBytes.value
                sum.totalFileDownloads += log.totalFileDownloads.value
                sum.distinctDatasetsWithFileDownload += log.distinctDatasetsWithFileDownload.value
            }
            console.log('formatted', formatBytes(sum.totalBytes))
        }

        return sum
    }

    const fetchData = async () => {
        setIsBusy(true)
        indicesSections.current = ENVS.logsIndicies() || {}
        let _data = {}
        let q, url, headers
        let promises = []
        let promisesMinDate = []
        const keys = []
        for (let s in indicesSections.current) {
            let index = indicesSections.current[s]
            q = ESQ.indexQueries({ from: fromDate, to: toDate })[s]
            if (q) {
                keys.push(s)
                url = ENVS.urlFormat.search(index)
                
                headers = getHeadersWith(globusToken).headers
            
                promises.push(callService(url,
                    headers,
                    q,
                    'POST'))
            }
           
            
            if (!fromDate) {
                // get the min date for each index to use as default fromDate if user doesn't select a date range
                q = ESQ.indexQueries({}).minDate(_cards[s].dateField || 'timestamp')
                promisesMinDate.push(callService(url,
                        headers,
                        q,
                        'POST'));
            }
        }
        const results = await Promise.all(promises)
        const resultsMinDate = await Promise.all(promisesMinDate)
   
        for (let i = 0; i < results.length; i++) {
            if (results[i].status == 401) {
                isSearchApiUnauthorized.current = true
                console.error('User unauthorized', results[i])
                break
            }
          
            if (results[i].status == 200) {
                _data[keys[i]] = results[i].data
            }
        }
        for (let i = 0; i < resultsMinDate.length; i++) {
            if (resultsMinDate[i].status == 200) {
                _data[`${keys[i]}MinDate`] = resultsMinDate[i].data
            }
        }
        return _data
    }

    useEffect(() => {
        if (globusToken) {
            fetchAggregatedData().then(() => {
                fetchData().then((data) => {
                    if (Object.keys(data).length) {
                        getCards(data)
                    } else {
                        if (isSearchApiUnauthorized.current && isAuthenticated) {
                            setShowUnauthorized(true)
                        }
                    }
                })
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
                const _action = removeLengthy ? 'truncateExport' : 'allExport'
                _dispatchGTM(_action)
            }

            if (hasLengthy) {
                // Show modal warning of csv lengthy
                let title = <h4><ExclamationCircleFilled  style={{color:'var(--bs-warning)'}} /> CSV Cell Character Limit</h4>
                let body = <span>Please note the CSV requested for export contains one or more cells which surpass character size limits for programs like Excel.</span>
               
                const footer = [
                    <Button key='dwn-trunc' icon={<DownloadOutlined />}  onClick={()=>{_csvDownloadAndCloseModal(true)}}> Download with truncation of lengthy cell(s)</Button>,
                    <Button key='dwn-all' color="primary" variant="solid" onClick={()=>{_csvDownloadAndCloseModal()}}> Ok</Button>
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
            <AppSideNavBar activeTab={getCurrentTab()} exportHandler={showUnauthorized ? undefined : exportHandler} />
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
                    {tabs && <Row className={`mt-5 c-tabsWrap ${isBusy ? 'isBusy' : ''}`}><Tabs
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