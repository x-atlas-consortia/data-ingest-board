import React, { useRef, useEffect, useState, useContext } from 'react';
import { Card, Col, DatePicker, Layout, Row, theme, Tabs, Table } from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
import { callService, eq, getHeadersWith, formatNum, formatBytes } from "@/lib/helpers/general";
import ENVS from "@/lib/helpers/envs";
import AppContext from "@/context/AppContext";
import ESQ from "@/lib/helpers/esq";
import Spinner from '@/components/Spinner';
import LogsFilesTable from '@/components/DataTable/LogsFilesTable';
import LogsReposTable from '@/components/DataTable/LogsReposTable';
import { LogsProvider } from '@/context/LogsContext';
import TABLE from '@/lib/helpers/table';
import {
    DownloadOutlined,
    ApiOutlined,
    CodeOutlined,
} from "@ant-design/icons";
import LogsApiUsageTable from '@/components/DataTable/LogsApiUsageTable';

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;
const Logs = () => {

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const { globusToken, isLoading, isAuthenticated } = useContext(AppContext)

    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [cards, setCards] = useState(null)
    const [tabs, setTabs] = useState(null)
    const [activeSection, setActiveSection] = useState(null)
    const indicesSections = useRef({})
    const [isBusy, setIsBusy] = useState(true)
    const [extraActions, setExtraActions] = useState({})
    const tabExtraActions = useRef({})
    const isoSuffix = 'T00:00:00'
    const exportData = useRef({})

    const handleDateRange = (dates, dateStrings) => {
        setFromDate(dateStrings[0] + isoSuffix)
        setToDate(dateStrings[1] + isoSuffix)
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

        let indexData = data[key].data
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

        if (isRepos(key)) {
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
                ms.push(
                    <Row className='mb-2' key={d.key}>
                        <Col span={12}><strong>{d.key}</strong>:</Col>
                        <Col span={12}><span className='txt-lnk'>{formatNum(d.doc_count)}</span></Col>
                    </Row>
                )
            }
            return (<>
                {ms}
                {totalHits > 0 && <span>-----------------------------</span>}
                <Row className='mt-2'>
                    <Col span={12}><strong>{formatNum(totalHits)}</strong><br />Total requests</Col>
                </Row>
            </>)
        }

        if (isFiles(key)) {
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

    const highlightSection = (e, key) => {
        const className = 'is-highlighted'
        $('.c-logCard').removeClass(className)
        setActiveSection(getTabId(key))
        $(e.currentTarget).addClass(className)
    }

    const getTabContent = (key, data) => {

        let tableData = []

        if (isRepos(key)) {
            return <>
                <LogsProvider defaultMenuItem={'numOfRows'}
                    indexKey={key}
                    exportData={exportData}
                    fromDate={fromDate} toDate={toDate}
                    tabExtraActions={tabExtraActions}
                    setExtraActions={setExtraActions}
                    extraActions={extraActions} >
                    <LogsReposTable />
                </LogsProvider>
            </>
        }
        if (isApi(key)) {

            for (let d of data[key].data.aggregations.services.buckets) {
                tableData.push(
                    {
                        name: d.key,
                        requests: d.doc_count,
                        endpoints: 'TODO' // todo
                    }
                )
            }

            return <>
                <LogsProvider defaultMenuItem={'numOfRows'}
                    indexKey={key}
                    exportData={exportData}
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
        let _cards = {
            openSourceRepos: {
                title: 'Open Source Repositories',
                icon: <CodeOutlined />
            },
            apiUsage: {
                title: 'API Usage',
                icon: <ApiOutlined />
            },
            fileDownloads: {
                title: 'Data Transfers',
                icon: <DownloadOutlined />
            }
        }

        let comps = []
        let _tabs = []
        for (let s in indicesSections.current) {
            comps.push(<Card className='c-logCard' title={<>{_cards[s].icon}<span className='mx-3'>{_cards[s].title}</span></>} key={s} variant="borderless" style={{ width: 300 }} onClick={(e) => highlightSection(e, s)}>
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

    const onTabChange = (active) => {
        setActiveSection(active)
    }

    const fetchData = async () => {
        indicesSections.current = ENVS.logsIndicies() || {}
        let _data = {}
        let q, url, headers
        for (let s in indicesSections.current) {
            let index = indicesSections.current[s]
            if (!_data[s]) {
                url = ENVS.urlFormat.search(`/${index}/search`)
                q = ESQ.indexQueries({ from: fromDate, to: toDate })[s]
                headers = getHeadersWith(globusToken).headers
                _data[s] = await callService(url,
                    headers,
                    q,
                    'POST')

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

    const exportHandler = () => {
        // TODO improve for dynamic export
        let indexKey = activeSection.replace('tab-', '')
        let _data = exportData.current[indexKey] || []
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

            TABLE.generateCSVFile(_data, indexKey + '.csv', cols)
        }
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
                            <RangePicker onChange={handleDateRange} />
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
                        <RangePicker onChange={handleDateRange} />
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