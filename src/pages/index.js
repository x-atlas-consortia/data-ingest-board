// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
import DataTable from "@/components/DataTable";
import Login from "@/components/Login";
import Blank from "@/components/Blank";
import Image from 'next/image';
import { useState, useEffect } from "react";
import {ingest_api_users_groups} from "@/service/ingest_api";
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";


function App({ entity_type, upload_id, page, page_size, sort_field, sort_order, filters }) {
    const [entityType, setEntityType] = useState(entity_type);
    const [selectUploadId, setSelectUploadId] = useState(upload_id);
    const [initialPage, setInitialPage] = useState(page);
    const [pageSize, setPageSize] = useState(page_size);
    const [sortField, setSortField] = useState(sort_field);
    const [sortOrder, setSortOrder] = useState(sort_order);
    const [tableFilters, setTableFilters] = useState(filters);
    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const [globusToken, setGlobusToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    if (initialPage === undefined) {
        setInitialPage(1);
    }

    const checkLocals = (isAuthenticated) => {
        setUserLoggedIn(isAuthenticated);
        setIsLoading(false);
    }

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_BACKEND_URL}/data-ingest-board-login`
    const handleLogin = () => {
        window.location.href = loginUrl
        setUserLoggedIn(true);
    };


    useEffect(() => {
        let url = new URL(window.location.href);
        let info = url.searchParams.get("info");
        if (info !== null) {
            localStorage.setItem("info", info);
            localStorage.setItem("isAuthenticated", "true");
            setGlobusToken(info['globus_token'])
        }

    })

    return (
        <div className="App">
            <div className="Banner">
                <div className="container">
                    <div className="row">
                        <img className="Logo col-md-2 col-4 img-fluid p-3" src="images/hubmap-type-white250.png" alt="HuBMAP Logo" />
                        <h1 className="Title col-4 offset-2 d-flex justify-content-center align-items-center text-center">
                            Data Ingest Board
                        </h1>
                    </div>
                </div>
            </div>
            <Blank checkLocals={checkLocals}/>
            {isLoading ? (
                <div></div>
            ) : userLoggedIn ? (
                    <DataTable className="DataTable"
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
                    />
                ) : (
                    <Login onLogin={handleLogin} />
                )}
        </div>
    );
}

App.getInitialProps = ({ query }) => {
  const { entity_type, upload_id, page, page_size, sort_field, sort_order, ...filters } = query;
  return { entity_type, upload_id, page, page_size, sort_field, sort_order, filters};
};

export default App;