import React, { useRef, useEffect, useState, useContext } from 'react'
import {
    Card,
    Col,
    DatePicker,
    Layout,
    Row,
    theme,
    Tabs,
    Carousel,
    Button,
    Tooltip,
    Spin
} from 'antd'
import AppSideNavBar from '@/components/AppSideNavBar'
import {
    callService,
    eq,
    getHeadersWith,
    formatNum,
    formatBytes,
    roundToTheNearest
} from '@/lib/helpers/general'
import ENVS from '@/lib/helpers/envs'
import AppContext from '@/context/AppContext'
import SQL, { indexFixtures } from '@/lib/helpers/sql'
import Spinner from '@/components/Spinner'
import { UsageProvider } from '@/context/UsageContext'
import TABLE from '@/lib/helpers/table'
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
} from '@ant-design/icons'
import dayjs from 'dayjs'
import AppModal from '@/components/AppModal'
import { modalDefault } from '@/lib/constants'
import Unauthorized from '@/components/Unauthorized'
import SummaryCard from '@/components/UsageAnalytics/SummaryCard'
import TabContent from '@/components/UsageAnalytics/TabContent'

const { Header, Content } = Layout
const { RangePicker } = DatePicker
const Usage = () => {
    const {
        token: { colorBgContainer, borderRadiusLG }
    } = theme.useToken()

    const { globusToken, isLoading, isAuthenticated, dispatchGTM } =
        useContext(AppContext)

    const formatDate = (date, month, day) => {
        let m = month || date.getMonth() + 1
        let d = day || date.getDate()
        const pad = (num) => String(num).padStart(2, '0')
        return `${date.getFullYear()}-${pad(m)}-${pad(d)}`
    }

    const currentDate = new Date()
    const [fromDate, setFromDate] = useState(formatDate(currentDate, 1, 1))
    const [toDate, setToDate] = useState(formatDate(currentDate))
    const currentdateStrings = useRef([
        formatDate(currentDate, 1, 1),
        formatDate(currentDate)
    ])
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
    const dateFormat = 'YYYY-MM-DD'

    const [modal, setModal] = useState(modalDefault)
    const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(false)
    const defaultIsLogScale = useRef({ apiUsage: true, fileDownloads: true })
    const repoCarouselRef = useRef(null)

    const _dispatchGTM = (action, event = 'cta') => {
        dispatchGTM({ action, event, info: getCurrentTab() })
    }

    let _cards = {
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

    const onCalendarChange = (_, dateStrings) => {
        currentdateStrings.current = dateStrings || [null, null]
    }

    const handleDateRange = (dates, dateStrings) => {
        const [from, to] = dateStrings || [null, null]
        setFromDate(from)
        setToDate(to)
        _dispatchGTM('dateFilter')
    }

    const filterResults = () => {
        handleDateRange(null, currentdateStrings.current)
    }

    const isApi = (key) => eq(key, 'apiUsage')

    const isFiles = (key) => eq(key, 'fileDownloads')

    const getTabId = (key) => `tab-${key}`

    const toggleHighlightClasses = (sel) => {
        const className = 'is-highlighted'
        $('.c-usageCard').removeClass(className)
        $(sel).addClass(className)
        _dispatchGTM('tabChange')
    }

    const configureTabURL = (key) =>
        window.history.pushState(
            null,
            null,
            `?tab=${_cards[key]?.title?.replaceAll(' ', '+')}`
        )

    const highlightSection = (e, key) => {
        configureTabURL(key)
        setActiveSection(getTabId(key))
        toggleHighlightClasses(e.currentTarget)
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

        if (
            tab &&
            (Object.keys(indicesSections.current).comprises(tab) ||
                tabTitles.comprises(tab.toLowerCase()))
        ) {
            tabName = getTabByTitle(tab)
        }
        return tabName
    }

    const getCards = (data) => {
        const tabName = getCurrentTab()

        let summaryCards = []
        let _tabs = []
        let title, date
        for (let s in indicesSections.current) {
            let from =
                fromDate ||
                (data[`${s}MinDate`]
                    ? data[`${s}MinDate`].hits.hits[0].sort[0]
                    : null)
            if (eq(typeof from, 'number')) {
                date = new Date(from)
                from = formatDate(date)
            }
            let to = toDate || 'now'
            _cards[s].dates = { from, to }
            title = (
                <>
                    {_cards[s].icon}
                    <span className='mx-3'>
                        <span className='c-usageCard__title'>
                            {_cards[s].title}
                        </span>
                        <br />
                        {from && (
                            <small className='c-usageCard__date'>
                                <CalendarOutlined /> {from} - {to}
                            </small>
                        )}
                    </span>{' '}
                </>
            )

            summaryCards.push(
                <SummaryCard
                    key={s}
                    from={from}
                    to={to}
                    cardType={{ isFiles, isApi }}
                    title={title}
                    tabName={tabName}
                    cardKey={s}
                    highlightSection={highlightSection}
                />
            )
            _tabs.push({
                label: `${_cards[s].title}`,
                key: getTabId(s),
                children: (
                    <TabContent
                        key={s}
                        tabKey={s}
                        cardType={{ isFiles, isApi }}
                        from={from}
                        to={to}
                    />
                ),
                icon: _cards[s].icon
            })
        }
        setCards(summaryCards)
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
        toggleHighlightClasses('.c-usageCard--' + getIndexKeyByActiveTab(active))
    }

    const fetchData = async () => {
        setIsBusy(true)
        indicesSections.current = ENVS.usageAnalytics() || {}
        let _data = {}
        let q, url, headers
        let promisesMinDate = []
        for (let s in indicesSections.current) {
            let index = indicesSections.current[s]
            url = ENVS.urlFormat.search(index)
            headers = getHeadersWith(globusToken).headers

            if (!fromDate) {
                // get the min date for each index to use as default fromDate if user doesn't select a date range
                q = SQL.minDate({
                    field: _cards[s].dateField || 'timestamp',
                    table: index
                })
                promisesMinDate.push(callService(url, headers, q, 'POST'))
            }
        }

        const resultsMinDate = await Promise.all(promisesMinDate)

        for (let i = 0; i < resultsMinDate.length; i++) {
            if (resultsMinDate[i].status == 200) {
                _data[`${Object.keys(indicesSections.current)[i]}MinDate`] =
                    resultsMinDate[i].data
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
    }, [globusToken, fromDate, toDate])

    useEffect(() => {
        exportData.current = {}
    }, [fromDate, toDate])

    if (!isLoading && !isAuthenticated) {
        window.location = '/'
    }

   const exportHandler = (indexKey) => {
        // TODO
    }

    const toggleOverview = () => {
        setIsOverviewCollapsed(!isOverviewCollapsed)
    }

    if (!isAuthenticated) {
        return <Spinner tip='' size='small' />
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppSideNavBar
                activeTab={getCurrentTab()}
                exportHandler={showUnauthorized ? undefined : exportHandler}
            />
            {showUnauthorized && (
                <div className='container mt-5'>
                    <Unauthorized withLayout={true} />
                </div>
            )}
            {!showUnauthorized && (
                <Layout>
                    <UsageProvider>
                    <Header
                        style={{ padding: 0, background: colorBgContainer }}
                        className='c-barHead'
                    >
                        <Row>
                            <Col className='c-barHead__col c-barHead__col--title'>
                                <div style={{ padding: '10px 24px' }}>
                                    <h2 className='text-truncate'>
                                        Usage Dashboard
                                    </h2>
                                </div>
                            </Col>
                            <Col className='c-barHead__col c-barHead__col--date d-md c-pickerRange'>
                                <RangePicker
                                    defaultValue={[
                                        dayjs(fromDate, dateFormat),
                                        dayjs(toDate, dateFormat)
                                    ]}
                                    onCalendarChange={onCalendarChange}
                                    onChange={handleDateRange}
                                />
                                <button
                                    onClick={filterResults}
                                    className='btn btn-primary rounded-0 c-pickerRange__filterBtn'
                                >
                                    Filter
                                </button>
                            </Col>
                        </Row>
                    </Header>
                    <Content
                        className='ant-content--logs'
                        style={{
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG
                        }}
                    >
                        <span style={{ float: 'right' }}>
                            {!isOverviewCollapsed && (
                                <Tooltip
                                    title='Hide overview section'
                                    placement='left'
                                >
                                    <MinusOutlined
                                        className='txt-lnk'
                                        onClick={toggleOverview}
                                    />
                                </Tooltip>
                            )}
                            {isOverviewCollapsed && (
                                <Tooltip
                                    title='Show overview section'
                                    placement='left'
                                >
                                    <PlusOutlined
                                        className='txt-lnk'
                                        onClick={toggleOverview}
                                    />
                                </Tooltip>
                            )}
                        </span>
                        <Col
                            md={{ span: 6 }}
                            className='d-sm mx-2 mb-2 c-pickerRange'
                        >
                            <RangePicker
                                defaultValue={[
                                    dayjs(fromDate, dateFormat),
                                    dayjs(toDate, dateFormat)
                                ]}
                                onCalendarChange={onCalendarChange}
                                onChange={handleDateRange}
                            />
                            <button
                                onClick={filterResults}
                                className='btn btn-primary rounded-0 c-pickerRange__filterBtn'
                            >
                                Filter
                            </button>
                        </Col>
                        {!isOverviewCollapsed && (
                            <Row
                                className={`c-usageCards ${isBusy ? 'isBusy' : ''}`}
                            >
                                {cards}
                            </Row>
                        )}
                        {tabs && (
                            <Row
                                className={`mt-5 c-tabsWrap ${isBusy ? 'isBusy' : ''}`}
                            >
                                <Tabs
                                    onChange={onTabChange}
                                    tabBarExtraContent={
                                        extraActions[activeSection]
                                    }
                                    activeKey={activeSection}
                                    type='card'
                                    size={'middle'}
                                    style={{ marginBottom: 32, width: '100%' }}
                                    items={tabs}
                                />
                            </Row>
                        )}
                        {isBusy && <Spinner />}
                        <AppModal
                            modal={modal}
                            setModal={setModal}
                            id='modal--logs'
                        />
                    </Content>
                    </UsageProvider>
                </Layout>
            )}
        </Layout>
    )
}
export default Usage
