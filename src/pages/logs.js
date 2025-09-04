import React, { useRef, useEffect, useState, useContext, act } from 'react';
import { Card, Col, DatePicker, Layout, Row, theme, Tabs, Table } from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
import ENS from "@/lib/helpers/envs";
import { callService, eq, getHeadersWith } from "@/lib/helpers/general";
import ENVS from "@/lib/helpers/envs";
import AppContext from "@/context/AppContext";
import ESQ from "@/lib/helpers/esq";
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

    const handleDateRange = (dates, dateStrings) => {
        console.log(dates, dateStrings)
        setFromDate(dateStrings[0] + 'T00:00:00')
        setToDate(dateStrings[1] + 'T00:00:00')
        // dates: [dayjs, dayjs], dateStrings: [string, string]
    }

    const isMicro = (key) => eq(key, 'microservices')

    const isRepos = (key) => eq(key, 'openSourceRepos')

    const getCardDetail = (key, data) => {
        const indices = indicesSections.current[key]
        let clones, totalClones = 0
        let views, totalViews = 0
        let totalHits = 0
        let services = 0


        for (let i of indices) {
            clones = 0
            views = 0
            if (isMicro(key)) {
                totalHits = data[i].data.hits.total?.value
                services = data[i].data.aggregations.services.buckets.length
            } else {
                // TODO to be restructured
                for (let d of data[i].data.hits.hits) {
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
                <Row>
                    <Col span={12}>0<br />endpoints</Col>
                </Row>
                <Row>
                    <Col span={12}>{totalHits}<br />hits</Col>
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
        const _cols = Array.from(columns[key])
        _cols.unshift(col)
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
    }

    const getCards = (data) => {
        let _cards = {
            openSourceRepos: {
                title: 'Open Source Repositories'
            },
            microservices: {
                title: 'Microservices'
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
                    q = ESQ.indexQueries(fromDate, toDate)[i]
                    headers = getHeadersWith(globusToken).headers
                    _data[i] = await callService(url,
                        headers,
                        q,
                        'POST')
                    // q.size = 20
                    // q.from = 0
                    // let res = await callService(url,
                    //     headers,
                    //     q,
                    //     'POST')
                    // _data[i].table = res.data || []

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
                        style={{ marginBottom: 32 }}
                        items={tabs}
                    /></Row>}
                </Content>
            </Layout>
        </Layout>
    );
};
export default Logs;