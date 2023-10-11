import {useContext, useEffect, useState} from 'react'
import AppContext from "../context/AppContext"
import {Container, Nav, Navbar} from 'react-bootstrap'

function AppNavBar() {
    const {handleLogout, isAuthenticated, t, getUserEmail} = useContext(AppContext)

    return (
        <Navbar expand="lg" className="c-nav" variant='dark'>
            <Container className="container">
                <Navbar.Brand className={'w-75'}>
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
                <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                <Navbar.Collapse className={'w-25 c-nav__auth'}>
                    <Nav className={'me-auto'}>
                        {isAuthenticated && (
                            <span className="c-logout">
                                    <span className={'p-2 txt-muted-on-dark'}>{getUserEmail()}</span>
                                    <button className="c-logout__btn" onClick={handleLogout}>
                                        LOG OUT
                                    </button>
                                </span>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default AppNavBar