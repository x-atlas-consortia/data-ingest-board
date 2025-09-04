import React, {useRef, useEffect, useState, useContext} from 'react';
import {Card, Col, DatePicker, Layout, Row, theme} from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
import ENS from "@/lib/helpers/envs";
import {callService, eq, getHeadersWith} from "@/lib/helpers/general";
import ENVS from "@/lib/helpers/envs";
import AppContext from "@/context/AppContext";
import ESQ from "@/lib/helpers/esq";
const { Header, Sider, Content } = Layout;
const { RangePicker } = DatePicker;
const Logs = () => {

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const {globusToken, hasDataAdminPrivs} = useContext(AppContext)

    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [data, setData] = useState(null)
    const [cards, setCards] = useState(null)
    const indiciesSections = useRef({})
    const indiciesData = useRef({})

    const handleDateRange = (dates, dateStrings) => {
        console.log(dates, dateStrings)
        setFromDate(dateStrings[0] + 'T00:00:00')
        setToDate(dateStrings[1] + 'T00:00:00')
        // dates: [dayjs, dayjs], dateStrings: [string, string]
    }

    const isMicro = (key) => eq(key, 'microservices')

    const getCardDetail = (key, data) => {
        const indicies = indiciesSections.current[key]
        let clones, totalClones = 0
        let views, totalViews = 0
        let totalHits = 0
        let services = 0


        for (let i of indicies) {
            clones = 0
            views = 0
            if (isMicro(key)) {
                totalHits = data[i].data.hits.total?.value
                services = data[i].data.aggregations.services.buckets.length
            } else {
                for (let d of data[i].data.hits.hits) {
                    clones += (d._source.clones?.count || 0)
                    views += (d._source.views?.count || 0)
                }
                indiciesData.current[i] = {
                    clones, views
                }
                totalClones += clones
                totalViews += views
            }


        }

        if (eq(key, 'openSourceRepos')) {
            return (<>
                <div><h3>4</h3></div>
                <Row>
                    <Col span={12}>{totalViews}<br />views</Col>
                    <Col span={12}>{totalClones}<br/>clones</Col>
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

    const getCards = (data)=> {
        let _cards = {
            openSourceRepos: {
                title: 'Open Source Repositories'
            },
            microservices: {
                title: 'Microservices'
            }
        }

        let comps = []
        for (let s in indiciesSections.current) {
            comps.push(<Card title={_cards[s].title} key={s} variant="borderless" style={{ width: 300 }}>
                {getCardDetail(s, data)}
            </Card>)
        }
        setCards(comps)
    }

    const fetchData = async () => {
        indiciesSections.current = ENVS.logsIndicies() || {}
        let _data = {}
        for (let s in indiciesSections.current) {
            let indicies = indiciesSections.current[s]
            for (let i of indicies) {
                if (!_data[i]) {
                    _data[i] = await callService(ENVS.urlFormat.search(`/${i}/search`),
                        getHeadersWith(globusToken).headers,
                        ESQ.indexQueries(fromDate, toDate)[i],
                        'POST')

                }

            }
        }
        return _data
    }

    useEffect(() => {
        if (globusToken) {
            fetchData().then((data)=>{
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
                            <div style={{padding: '10px 24px'}}>
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
                    {cards}
                </Content>
            </Layout>
        </Layout>
    );
};
export default Logs;