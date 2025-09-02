import React, {useContext, useEffect, useState} from 'react';
import {Card, Col, DatePicker, Layout, Row, theme} from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
import ENS from "@/lib/helpers/envs";
import {callService, eq, getHeadersWith} from "@/lib/helpers/general";
import ENVS from "@/lib/helpers/envs";
import AppContext from "@/context/AppContext";
const { Header, Sider, Content } = Layout;
const { RangePicker } = DatePicker;
const Logs = () => {

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const {globusToken, hasDataAdminPrivs} = useContext(AppContext)

    const [fromDate, setFromDate] = useState()
    const [toDate, setToDate] = useState()
    const [data, setData] = useState(null)
    const [cards, setCards] = useState(null)

    const handleDateRange = (dates, dateStrings) => {
        console.log(dates, dateStrings)
        // dates: [dayjs, dayjs], dateStrings: [string, string]
    }

    const getCardDetail = (key, data) => {
        if (eq(key, 'openSourceRepos')) {
            return <></>
        }
    }

    const getCards = (data)=> {
        let _cards = {
            openSourceRepos: {
                title: 'Open Source Repositories'
            }
        }
        const sections = ENVS.logsIndicies() || {}
        let comps = []
        for (let s in sections) {
            comps.push(<Card title={_cards[s].title} key={s} variant="borderless" style={{ width: 300 }}>
               Content
            </Card>)
        }
        setCards(comps)
    }

    const fetchData = async () => {
        const sections = ENVS.logsIndicies() || {}
        let _data = {}

        for (let s in sections) {
            let indicies = sections[s]
            for (let i of indicies) {
                if (!_data[i]) {
                    _data[i] = await callService(ENVS.urlFormat.search(`/${i}/search`), getHeadersWith(globusToken).headers, {}, 'POST')
                }

            }
        }
        return data
    }

    useEffect(() => {
        if (globusToken) {
            fetchData().then((data)=>{
                getCards(data)
            })
        }
    }, [globusToken]);

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