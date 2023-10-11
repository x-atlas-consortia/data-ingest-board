// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
import DataTable from "../components/DataTable";
import Login from "../components/Login";
import { useState, useContext } from "react";
import AppContext from "../context/AppContext";
import Favicon from "react-favicon";
import {getCookie} from "cookies-next";
import {parseJSON} from "../service/helper";
import {Container, Nav, Navbar, NavDropdown} from 'react-bootstrap'


function App({ entity_type, upload_id, page, page_size, sort_field, sort_order, filters }) {
    const {globusToken, handleLogin, handleLogout, isLoading, isAuthenticated, unauthorized, isLogout, t} = useContext(AppContext)
    const [entityType, setEntityType] = useState(entity_type);
    const [selectUploadId, setSelectUploadId] = useState(upload_id);
    const [initialPage, setInitialPage] = useState(page);
    const [pageSize, setPageSize] = useState(page_size);
    const [sortField, setSortField] = useState(sort_field);
    const [sortOrder, setSortOrder] = useState(sort_order);
    const [tableFilters, setTableFilters] = useState(filters);

    if (initialPage === undefined) {
        setInitialPage(1);
    }

    const getUserEmail = () => {
        const info = getCookie('info')
        return info ? parseJSON(atob(info))?.email : ''
    }

    return (
        <div className="App bg--galGrey">
            <Favicon url={`favicons/${t('hubmap-favicon.ico')}`}/>
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
                {isLoading || isLogout && <></>}

                {!isLoading && !isAuthenticated && !isLogout &&
                <Login onLogin={handleLogin} unauthorized={unauthorized} onLogout={handleLogout}/> }

                { isAuthenticated &&
                    <DataTable className="c-table--data"
                        entityType={entityType}
                        setEntityType={setEntityType}
                        selectUploadId={selectUploadId}
                        setSelectUploadId={setSelectUploadId}
                        initialPage={parseInt(initialPage)}
                        setInitialPage={parseInt(setInitialPage)}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        sortField={sortField}
                        setSortField={setSortField}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        tableFilters={tableFilters}
                        setTableFilters={setTableFilters}
                        globusToken={globusToken}
                    /> }
        </div>


    );
}

App.getInitialProps = ({ query }) => {
  const { entity_type, upload_id, page, page_size, sort_field, sort_order, ...filters } = query;
  return { entity_type, upload_id, page, page_size, sort_field, sort_order, filters};
};

export default App;