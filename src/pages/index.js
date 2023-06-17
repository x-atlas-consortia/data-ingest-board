// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
import DataTable from "@/components/DataTable";
import Login from "@/components/Login";
import Blank from "@/components/Blank";
import Image from 'next/image';1
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
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [globusInfo, setGlobusInfo] = useState(null);
    const [globusToken, setGlobusToken] = useState(null);
    const [unauthorized, setUnauthorized] = useState(false);


    if (initialPage === undefined) {
        setInitialPage(1);
    }

    const checkLocals = (isAuthenticated, initialInfo) => {
        if (initialInfo) {
            setGlobusInfo(initialInfo);
            setGlobusToken(JSON.parse(initialInfo).groups_token)
        }
        const validToken = checkToken(JSON.parse(initialInfo).groups_token)
        setIsAuthenticated(isAuthenticated && validToken.hubmapUser);
        if (validToken.hubmapUser === false && validToken.validToken === true) {
            setUnauthorized(true);
        }
        setIsLoading(false);

    }

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_BACKEND_URL}/data-ingest-board-login`
    const handleLogin = () => {
        window.location.href = loginUrl
    };

    const checkToken = (tokenInfo) => {
        let hubmapUser = false;
        let validToken = false;
        try {
            ingest_api_users_groups(JSON.parse(tokenInfo).groups_token).then((results) => {
                console.debug("results results type", typeof results.results);
                if (results && results.status === 200) {
                    hubmapUser = results.results.some(obj => obj.displayname === "HubMAP Read");
                    validToken = true;
                }
            })
        } catch (error){
            console.log(error);
        }
        return {
            validToken,
            hubmapUser
        };

    }
    useEffect(() => {
        let url = new URL(window.location.href);
        let info = url.searchParams.get("info");
        window.history.pushState(null, null, `/`);
        if (info) {
            localStorage.setItem("info", info);
            localStorage.setItem("isAuthenticated", "true");
            setGlobusInfo(info);
            setGlobusToken(JSON.parse(info).groups_token);
            const tokenValidation = checkToken(info);
            if (tokenValidation.humapUser) {
                localStorage.setItem("isAuthenticated", "true");
                setIsAuthenticated(true);
            }else {
                if (tokenValidation.validToken) {
                    setUnauthorized(true);
                }
            }
        }

    }, [globusToken, globusInfo, unauthorized])

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
            ) : isAuthenticated ? (
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
                    <Login onLogin={handleLogin} unauthorized={unauthorized} />
                )}
        </div>
    );
}

App.getInitialProps = ({ query }) => {
  const { entity_type, upload_id, page, page_size, sort_field, sort_order, ...filters } = query;
  return { entity_type, upload_id, page, page_size, sort_field, sort_order, filters};
};

export default App;