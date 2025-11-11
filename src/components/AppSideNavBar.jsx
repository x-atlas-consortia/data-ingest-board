import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Layout, Menu } from "antd";
import {
    DownloadOutlined,
    TableOutlined,
    LeftOutlined, LogoutOutlined, QuestionOutlined,
    RightOutlined,
    UserOutlined,
    LineChartOutlined
} from "@ant-design/icons";
import AppContext from "@/context/AppContext";
import { Navbar } from "react-bootstrap";
import { eq } from '@/lib/helpers/general';
import ENVS from '@/lib/helpers/envs';
const { Sider } = Layout;
function AppSideNavBar({ exportHandler, activeTab, isGoogleAnalytics }) {
    const { handleLogout, isAuthenticated, t, getUserEmail } = useContext(AppContext)
    const [collapsed, setCollapsed] = useState(false)
    const [items, setItems] = useState(null)

    const getGoogleLookerStudio = () => {
        const lookerStudio = ENVS.lookerStudio()
        if (!Array.isArray(lookerStudio)) return []
        let _items = []
        for (let l of lookerStudio) {
            _items.push({ key: l.name.toDashedCase(), label: l.name })
        }
        return _items
    }

    useEffect(() => {
        if (isAuthenticated) {
            let _items = [
                {
                    key: 'home',
                    icon: <TableOutlined />,
                    label: 'Data Ingest Board',
                },
                {
                    key: 'ga',
                    icon: <LineChartOutlined />,
                    label: 'Google Analytics',
                    children: getGoogleLookerStudio()
                },
                {
                    key: '1',
                    icon: <UserOutlined />,
                    label: getUserEmail(),
                    children: [
                        { key: 'logOut', label: 'Log out', icon: <LogoutOutlined /> },
                    ]
                },
                {
                    key: 'help',
                    icon: <QuestionOutlined />,
                    label: 'Help',
                },
            ]
            if (!isGoogleAnalytics) {
                _items.splice(3, 0, {
                    key: 'export',
                    className: 'export',
                    icon: <DownloadOutlined />,
                    label: <span data-gtm-info={activeTab} className='js-gtm--btn-cta-export' id='sideMenu--export'>Export</span>,
                    disabled: exportHandler == undefined
                })
            }
            setItems(_items)
        }
    }, [isAuthenticated, activeTab])

    useEffect(()=> {
        if (window.innerWidth < 768) {
            setCollapsed(true)
        }
    }, [])


    const handleMenuClick = (e) => {
        if (eq(e.key, 'export')) {
            exportHandler()
        } else if (eq(e.key, 'help')) {
            window.open(`https://docs.${ENVS.appContext().toLowerCase()}consortium.org/`, '_blank')
        } else if (eq(e.key, 'logOut')) {
            handleLogout()
        } else if (eq(e.key, 'home')) {
            window.location = '/'
        } else {
            window.location = '/usage/ga?v='+e.key
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
                                src={`/images/${collapsed ? t('hubmap-logo.png') : t('hubmap-type-white250.png')}`}
                                alt={t('HuBMAP Logo')}
                            />
                        </span>
                        {!collapsed && <h1 className="c-nav__title text-white">
                            <a href='/usage' className='d-inline-block text-white text-decoration-none'>Usage Dashboard</a>
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