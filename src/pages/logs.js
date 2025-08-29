import React, {useContext, useState} from 'react';
import {Col, DatePicker, Layout, Row, theme} from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
const { Header, Sider, Content } = Layout;
const { RangePicker } = DatePicker;
const Logs = () => {

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const {fromDate, setFromDate} = useState()
    const {toDate, setToDate} = useState()

    const handleDateRange = (dates, dateStrings) => {
        console.log(dates, dateStrings)
        // dates: [dayjs, dayjs], dateStrings: [string, string]
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
                    Content
                </Content>
            </Layout>
        </Layout>
    );
};
export default Logs;