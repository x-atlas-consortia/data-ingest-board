import React, { useRef, useEffect, useState, useContext, act } from 'react';
import { Card, Col, DatePicker, Layout, Row, theme, Tabs, Table } from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
import { callService, eq, getHeadersWith, formatNum, formatBytes } from "@/lib/helpers/general";
import ENVS from "@/lib/helpers/envs";
import AppContext from "@/context/AppContext";
import ESQ from "@/lib/helpers/esq";
import Spinner from '@/components/Spinner';
import LogsFilesTable from '@/components/DataTable/LogsFilesTable';
import LogsReposTable from '@/components/DataTable/LogsReposTable';

const { Header, Sider, Content } = Layout;
const { RangePicker } = DatePicker;
const Logs = () => {

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const { globusToken, isLoading, isAuthenticated } = useContext(AppContext)

    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [data, setData] = useState(null)
    const [cards, setCards] = useState(null)
    const [tabs, setTabs] = useState(null)
    const [activeSection, setActiveSection] = useState(null)
    const indicesSections = useRef({})
    const indicesData = useRef({})
    const [isBusy, setIsBusy] = useState(true)
    const [pageSize, setPageSize] = useState(10)
    const [extraActions, setExtraActions] = useState({})

    const handleDateRange = (dates, dateStrings) => {
        console.log(dates, dateStrings)
        setFromDate(dateStrings[0] + 'T00:00:00')
        setToDate(dateStrings[1] + 'T00:00:00')
        // dates: [dayjs, dayjs], dateStrings: [string, string]
    }

    const isMicro = (key) => eq(key, 'microservices')

    const isRepos = (key) => eq(key, 'openSourceRepos')

    const isFiles = (key) => eq(key, 'fileDownloads')



    const getCardDetail = (key, data) => {
        const indices = indicesSections.current[key]
        let repos, totalClones, totalViews = 0
        let totalHits = 0
        let totalBytes, datasetGroups, totalFiles = 0
        let indexData, agg

        for (let i of indices) {
            indexData = data[i].data
            agg = indexData.aggregations

            if (isMicro(key)) {
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

        if (isMicro(key)) {
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
                -----------------------------
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

    const getColumnsByKey = (key) => {
        const col = {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        }
        const columns = {
            
            microservices: [
                {
                    title: 'Endpoints',
                    dataIndex: 'endpoints',
                    key: 'endpoints',
                },
                {
                    title: 'Requests',
                    dataIndex: 'hits',
                    key: 'hits',
                    render: (v, r) => {
                        return <span data-field="files">{formatNum(v)}</span>
                    }
                }
            ]
        }
        const _cols = Array.from(columns[key] || [])
        if (!isFiles(key)) {
            _cols.unshift(col)
        }

        return _cols
    }

    const getTabContent = (key, data) => {
        const cols = getColumnsByKey(key)
        const indices = indicesSections.current[key]
        let tableData = []

       
        if (isRepos(key)) {
            return <>
                <LogsReposTable fromDate={fromDate} toDate={toDate} setExtraActions={setExtraActions} extraActions={extraActions} />
            </>
        }
        if (isMicro(key)) {
            for (let i of indices) {
                for (let d of data[i].data.aggregations.services.buckets) {
                    tableData.push(
                        {

                            name: d.key,
                            hits: d.doc_count,
                            endpoints: 'TODO' // todo
                        }
                    )
                }
            }
            // TODO Add visualization of microservice against usage counts
            return <>
                <Table
                    rowKey={'name'}
                    pagination={false}
                    rowSelection={{ type: 'checkbox', ...rowSelection }}
                    dataSource={tableData} columns={cols} />
            </>
        }

        if (isFiles(key)) {

            return <>
                <LogsFilesTable fromDate={fromDate} toDate={toDate} setExtraActions={setExtraActions} extraActions={extraActions} />
            </>
        }
    }

    const getCards = (data) => {
        let _cards = {
            openSourceRepos: {
                title: 'Open Source Repositories'
            },
            microservices: {
                title: 'Microservices'
            },
            fileDownloads: {
                title: 'Data Transfers'
            }
        }

        let comps = []
        let _tabs = []
        for (let s in indicesSections.current) {
            comps.push(<Card title={_cards[s].title} key={s} variant="borderless" style={{ width: 300 }}>
                {getCardDetail(s, data)}
            </Card>)
            _tabs.push({
                label: `${_cards[s].title}`,
                key: `tab-${s}`,
                children: getTabContent(s, data),
            })
        }
        setCards(comps)
        setTabs(_tabs)
        setActiveSection(`tab-${Object.keys(indicesSections.current)[0]}`)
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
            let indicies = indicesSections.current[s]
            for (let i of indicies) {
                if (!_data[i]) {
                    url = ENVS.urlFormat.search(`/${i}/search`)
                    q = ESQ.indexQueries({ from: fromDate, to: toDate })[i]
                    headers = getHeadersWith(globusToken).headers
                    _data[i] = await callService(url,
                        headers,
                        q,
                        'POST')

                }

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
    }, [globusToken, fromDate]);

    if (!isLoading && !isAuthenticated) {
        window.location = '/'
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppSideNavBar />
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }}>
                    <Row>
                        <Col span={18} push={6}>
                            <RangePicker onChange={handleDateRange} />
                        </Col>
                        <Col span={6} pull={18}>
                            <div style={{ padding: '10px 24px' }}>
                                <h2>Dashboard</h2>
                            </div>

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
                    <Row>{cards}</Row>
                    {tabs && <Row className='mt-5'><Tabs
                        onChange={onTabChange}
                        tabBarExtraContent={extraActions[activeSection]}
                        defaultActiveKey={activeSection}
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