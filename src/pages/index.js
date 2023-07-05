// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
import DataTable from "../components/DataTable";
import Login from "../components/Login";
import Blank from "../components/Blank";
import Image from 'next/image';
import { useState, useEffect } from "react";
import {ingest_api_users_groups} from "../service/ingest_api";
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

    const checkLocals = (authenticated, initialInfo) => {
        if (initialInfo) {
            setGlobusInfo(initialInfo);
            setGlobusToken(JSON.parse(initialInfo).groups_token)
            checkToken(JSON.parse(initialInfo).groups_token).then(validate => {
                setIsAuthenticated(authenticated && validate.hubmapUser);
                if (validate.hubmapUser === false && validate.invalidToken === false) {
                    setUnauthorized(true);
                }
                setIsLoading(false);
            })
            .catch(error => {
                console.log(error);
                setIsLoading(false);
            })

        } else {
            setIsLoading(false);
        }
    }

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_BACKEND_URL}/data-ingest-board-login`
    const logoutUrl = `${process.env.NEXT_PUBLIC_APP_BACKEND_URL}/data-ingest-board-logout`

    const handleLogin = () => {
        window.location.href = loginUrl
    };

    const handleLogout = () => {
        window.location.href = logoutUrl
        setGlobusToken(null);
        setGlobusInfo(null);
        setUnauthorized(false);
        localStorage.removeItem("info");
        localStorage.removeItem("isAuthenticated");
        setIsAuthenticated(false);
    }

    const checkToken = (tokenInfo) => {
        let hubmapUser = false;
        let invalidToken = false;

        return new Promise((resolve, reject) => {
            try {
                ingest_api_users_groups(tokenInfo).then((results) => {
                    if (results && results.status === 200) {
                        hubmapUser = results.results.some(obj => obj.displayname === "HuBMAP Read");
                    }
                    if (results && results.status === 401) {
                        invalidToken = true;
                    }
                    resolve({hubmapUser, invalidToken});
                }).catch(error => {
                    console.log(error);
                    reject(error);
                });
            } catch(error) {
                console.log(error)
                reject(error);
            }
        });
    }

    useEffect(() => {
        let url = new URL(window.location.href);
        let info = url.searchParams.get("info");
        if (info) {
            window.history.pushState(null, null, `/`);
            localStorage.setItem("info", info);
            localStorage.setItem("isAuthenticated", "true");
            setGlobusInfo(info);
            setGlobusToken(JSON.parse(info).groups_token);
            checkToken(JSON.parse(info).groups_token).then(tokenValidation => {
                // if (tokenValidation.hubmapUser) {
                //     localStorage.setItem("isAuthenticated", "true");
                //     setIsAuthenticated(true);
                // } else {
                //     setIsAuthenticated(false);
                //     setUnauthorized(true);
                // }
                if (tokenValidation.hubmapUser) {
                    localStorage.setItem("isAuthenticated", "true");
                    setIsAuthenticated(true);
                } else {
                    if (tokenValidation.invalidToken === false) {
                        setUnauthorized(true);
                    }
                }

            }).catch(error => {
                console.log(error)
            })
            setIsLoading(false);
        }
    }, [globusToken, globusInfo, isAuthenticated, isLoading])

    return (
        <div className="App">
            <div className="Banner">
                <div className="container">
                    <div className="row">
                        <img className="Logo col-md-2 col-4 img-fluid p-3" src="images/hubmap-type-white250.png" alt="HuBMAP Logo" />
                        <h1 className="Title col-4 col-md-4 col-lg-4 col-xl-4 offset-md-2 offset-lg-2 offset-xl-2 d-flex justify-content-center align-items-center text-center">
                            Data Ingest Board
                        </h1>
                        {isAuthenticated && (
                            <span className="col-4 LogoutWrapper">
                            <button className="LogoutButton" onClick={handleLogout}>
                                LOG OUT
                            </button>
                        </span>
                        )}
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
                    <Login onLogin={handleLogin} unauthorized={unauthorized} onLogout={handleLogout}/>
                )}
        </div>


    );
}

App.getInitialProps = ({ query }) => {
  const { entity_type, upload_id, page, page_size, sort_field, sort_order, ...filters } = query;
  return { entity_type, upload_id, page, page_size, sort_field, sort_order, filters};
};

export default App;