// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
import DataTable from "../components/DataTable";
import Login from "../components/Login";
import { useState, useContext } from "react";
import AppContext from "../context/AppContext";
import Favicon from "react-favicon";


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

    return (
        <div className="App bg--galGrey">
            <Favicon url={`favicons/${t('hubmap-favicon.ico')}`}/>
            <div className="c-nav">
                <div className="container">
                    <div className="row">
                        <img
                            className="c-logo col-md-2 col-4 img-fluid p-3"
                            src={`images/${t('hubmap-type-white250.png')}`}
                            alt={t('HuBMAP Logo')}
                        />
                        <h1 className="c-nav__title col-4 col-md-4 col-lg-4 col-xl-4 offset-md-2 offset-lg-2 offset-xl-2 d-flex justify-content-center align-items-center text-center">
                            Data Ingest Board
                        </h1>
                        {isAuthenticated && (
                            <span className="col-4 c-logout">
                            <button className="c-logout__btn" onClick={handleLogout}>
                                LOG OUT
                            </button>
                        </span>
                        )}
                    </div>
                </div>
            </div>
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