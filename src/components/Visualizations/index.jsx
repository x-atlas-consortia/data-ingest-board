import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import { UserOutlined, AreaChartOutlined, PieChartOutlined, BarChartOutlined, LineChartOutlined } from '@ant-design/icons';
import {Col, Collapse, Row, Dropdown} from "antd";

function Visualizations({children}) {
    useEffect(() => {
    }, [])

    // Demo menu
    const handleMenuClick = (e) => {
        message.info('Click on menu item.');
        console.log('click', e);
    }

    const items = [
        {
            label: '1st menu item',
            key: '1',
            icon: <AreaChartOutlined />,
        },
        {
            label: '2nd menu item',
            key: '2',
            icon: <PieChartOutlined />,
        },
        {
            label: '3rd menu item',
            key: '3',
            icon: <BarChartOutlined />,
            danger: true,
        },
        {
            label: '4rd menu item',
            key: '4',
            icon: <LineChartOutlined />,
            danger: true,
            disabled: true,
        },
    ];

    const menuProps = {
        items,
        onClick: handleMenuClick,
    }

    return (
        <div className={'c-visualizations my-3'}>
            <Collapse
                size="large"
                items={[
                    {
                        key: '1',
                        label: 'Visualizations',
                        children: <Row>
                            <Col span={18} push={6}>
                                col-18 col-push-6
                            </Col>
                            <Col span={6} pull={18}>
                                <Row>
                                    <Dropdown.Button menu={menuProps} placement="bottom" icon={<AreaChartOutlined />}>
                                        Select a visualization
                                    </Dropdown.Button>
                                </Row>
                            </Col>
                        </Row>,
                    },
                ]}
            />
        </div>

    )
}


Visualizations.propTypes = {
    children: PropTypes.node
}

export default Visualizations