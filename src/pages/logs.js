import React, { useRef, useEffect, useState, useContext, act } from 'react';
import { Card, Col, DatePicker, Layout, Row, theme, Tabs, Table } from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
import { callService, eq, getHeadersWith, formatNum } from "@/lib/helpers/general";
import ENVS from "@/lib/helpers/envs";
import AppContext from "@/context/AppContext";
import ESQ from "@/lib/helpers/esq";
import Spinner from '@/components/Spinner';
import LogsFilesTable from '@/components/DataTable/LogsFilesTable';
const { Header, Sider, Content } = Layout;
const { RangePicker } = DatePicker;
const Logs = () => {

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const { globusToken, hasDataAdminPrivs } = useContext(AppContext)

    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [data, setData] = useState(null)
    const [cards, setCards] = useState(null)
    const [tabs, setTabs] = useState(null)
    const [activeSection, setActiveSection] = useState(null)
    const indicesSections = useRef({})
    const indicesData = useRef({})
    const [isLoading, setIsLoading] = useState(true)
    const [pageSize, setPageSize] = useState(10)

    const handleDateRange = (dates, dateStrings) => {
        console.log(dates, dateStrings)
        setFromDate(dateStrings[0] + 'T00:00:00')
        setToDate(dateStrings[1] + 'T00:00:00')
        // dates: [dayjs, dayjs], dateStrings: [string, string]
    }

    const isMicro = (key) => eq(key, 'microservices')

    const isRepos = (key) => eq(key, 'openSourceRepos')

    const isFiles = (key) => eq(key, 'fileDownloads')

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes'

        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    const getCardDetail = (key, data) => {
        const indices = indicesSections.current[key]
        let clones, totalClones = 0
        let views, totalViews = 0
        let totalHits, services = 0
        let totalBytes, datasetGroups, totalFiles = 0
        let indexData, agg 
        
        for (let i of indices) {
            clones = 0
            views = 0
            indexData = data[i].data
            agg = indexData.aggregations

            if (isMicro(key)) {
                totalHits = indexData.hits.total?.value
                services = agg.services.buckets.length
            } else if (isFiles(key)) {
                totalHits = indexData.hits.total?.value
                totalFiles = agg.totalFiles.value
                datasetGroups = agg.totalDatasets.value
                totalBytes = agg.totalBytes.value
            } else {
                // TODO to be restructured
                for (let d of indexData.hits.hits) {
                    clones += (d._source.clones?.count || 0)
                    views += (d._source.views?.count || 0)
                }
                indicesData.current[i] = {
                    clones, views
                }
                totalClones += clones
                totalViews += views
            }
        }

        if (isRepos(key)) {
            return (<>
                <div><h3>4</h3></div>
                <Row>
                    <Col span={12}>{totalViews}<br />views</Col>
                    <Col span={12}>{totalClones}<br />clones</Col>
                </Row>
            </>)
        }

        if (isMicro(key)) {
            return (<>
                <div><h3>{services}</h3></div>
                <Row className='mt-2'>
                    <Col span={12}>0<br />endpoints</Col>
                </Row>
                <Row className='mt-2'>
                    <Col span={12}>{formatNum(totalHits)}<br />hits</Col>
                </Row>
            </>)
        }

        if (isFiles(key)) {
            return (<>
                <div><h3>{formatNum(totalFiles)}</h3>globus files</div>
                <Row className='mt-2'>
                    <Col span={12}>{formatNum(datasetGroups)}<br />datasets</Col>
                    <Col span={12}>{formatBytes(totalBytes)}<br />downloaded</Col>
                </Row>
                <Row className='mt-2'>
                    <Col span={12}>{formatNum(totalHits)}<br />hits</Col>
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
            openSourceRepos: [
                {
                    title: 'Views',
                    dataIndex: 'views',
                    key: 'views',
                },
                {
                    title: 'Clones',
                    dataIndex: 'clones',
                    key: 'clones',
                }
            ],
            microservices: [
                {
                    title: 'Endpoints',
                    dataIndex: 'endpoints',
                    key: 'endpoints',
                },
                {
                    title: 'Hits',
                    dataIndex: 'hits',
                    key: 'hits',
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
            return <>TODO</>
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

            return <>
                <Table
                    rowSelection={{ type: 'checkbox', ...rowSelection }}
                    dataSource={tableData} columns={cols} />
            </>
        }

        if (isFiles(key)) {
            
            return <>
                <LogsFilesTable fromDate={fromDate} toDate={toDate} />
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
        setIsLoading(false)
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
                    q = ESQ.indexQueries({from: fromDate, to: toDate})[i]
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
                        defaultActiveKey={activeSection}
                        type="card"
                        size={'middle'}
                        style={{ marginBottom: 32, width: '100%' }}
                        items={tabs}
                    /></Row>}
                    {isLoading && <Spinner />}
                </Content>
            </Layout>
        </Layout>
    );
};
export default Logs;