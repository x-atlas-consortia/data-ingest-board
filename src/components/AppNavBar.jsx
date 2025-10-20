import {useContext} from 'react'
import AppContext from "../context/AppContext"
import {Container, Nav, Navbar} from 'react-bootstrap'
import {
    DownOutlined, LogoutOutlined,
    UserOutlined, DatabaseOutlined
} from "@ant-design/icons";
import {Dropdown, Tooltip} from 'antd'
import { eq } from '@/lib/helpers/general';
import AppTooltip from './AppTooltip';

function AppNavBar() {
    const {handleLogout, isAuthenticated, t, getUserEmail, globusToken} = useContext(AppContext)

    const items =  [{
            key: 'copyGlobus',
            label:  <AppTooltip title="Copied!"><span>Copy Globus Token</span></AppTooltip>,
            icon:  <UserOutlined />
        },{
            key: 'logOut',
            label: 'Log out',
            icon:  <LogoutOutlined />
        },
    ]
    
    const handleMenuClick = (e) => {
        if (eq(e.key, 'logOut')) {
            handleLogout()
        } else if (eq(e.key, 'copyGlobus')) {
            navigator.clipboard.writeText(globusToken)
        }
    }

    return (
        <Navbar expand="lg" className="c-nav" variant='dark'>
            <Container className="container">
                <Navbar.Brand className={'w-60'}>
                            <span className={'c-nav__imgWrap'}>
                                    <img
                                        className="c-logo"
                                        src={`images/${t('hubmap-type-white250.png')}`}
                                        alt={t('HuBMAP Logo')}
                                    />
                            </span>
                    <h1 className="c-nav__title text-white">
                        <span className='d-inline-block'>Data Ingest Board</span>
                    </h1>
                </Navbar.Brand>
                {isAuthenticated && <Navbar.Toggle aria-controls="basic-navbar-nav"/>}
                {isAuthenticated && <Navbar.Collapse className={'w-40 c-nav__auth'}>
                    <Nav className={'me-auto'}>
                  
                        <a className='p-2 txt-muted-on-dark text-decoration-none' href='/logs'>Usage Logs <DatabaseOutlined /></a>
                        <Dropdown menu={{ items, onClick: handleMenuClick} } className='c-nav__user w-40' >
                            <span className='p-2 txt-muted-on-dark' onClick={e => e.preventDefault()}>
                                {getUserEmail()}
                                <DownOutlined />
                            </span>
                        </Dropdown>
                    </Nav>
                </Navbar.Collapse>}
            </Container>
        </Navbar>
    )
}

export default AppNavBar