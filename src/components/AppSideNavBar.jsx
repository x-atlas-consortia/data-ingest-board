import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Layout, Menu } from "antd";
import {
    DownloadOutlined,
    LeftOutlined, QuestionOutlined,
    RightOutlined,
    UserOutlined,
} from "@ant-design/icons";
import AppContext from "@/context/AppContext";
import { Navbar } from "react-bootstrap";
import { eq } from '@/lib/helpers/general';
import ENVS from '@/lib/helpers/envs';
const { Sider } = Layout;
function AppSideNavBar({ exportHandler }) {
    const { handleLogout, isAuthenticated, t, getUserEmail } = useContext(AppContext)
    const [collapsed, setCollapsed] = useState(false)
    const [items, setItems] = useState(null)

    useEffect(() => {
        if (isAuthenticated) {
            setItems([
                {
                    key: '1',
                    icon: <UserOutlined />,
                    label: getUserEmail(),
                },
                {
                    key: 'export',
                    icon: <DownloadOutlined />,
                    label: 'Export',
                },
                {
                    key: 'help',
                    icon: <QuestionOutlined />,
                    label: 'Help',
                },
            ])
        }
    }, [isAuthenticated])


    const handleMenuClick = (e) => {
        if (eq(e.key, 'export')) {
            exportHandler()
        } else if (eq(e.key, 'help')) {
            window.open(`https://docs.${ENVS.appContext().toLowerCase()}consortium.org/`, '_blank')
        }
    }

    return (
        <Sider className={'c-nav c-nav--sider'} trigger={null} collapsible collapsed={collapsed}>
            <div className='c-nav__siderWrap'>

                <div className='c-nav__brand'>
                    <Navbar.Brand className={'w-75'}>
                        <span className={'c-nav__imgWrap'}>
                            <img
                                className="c-logo"
                                src={`images/${collapsed ? t('hubmap-logo.png') : t('hubmap-type-white250.png')}`}
                                alt={t('HuBMAP Logo')}
                            />
                        </span>
                        {!collapsed && <h1 className="c-nav__title text-white">
                            <span className='d-inline-block'>Logs Dashboard</span>
                        </h1>}
                    </Navbar.Brand>
                </div>
                {items && <Menu
                    onClick={handleMenuClick}
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={['1']}
                    items={items}
                />}

                <div className='c-nav__siderTrigger'>
                    <Button
                        type="text"
                        icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                            color: 'white'
                        }}
                    />
                </div>

            </div>


        </Sider>
    )
}

AppSideNavBar.propTypes = {
    children: PropTypes.node
}

export default AppSideNavBar