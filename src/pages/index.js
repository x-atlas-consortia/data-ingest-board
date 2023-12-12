// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
import DataTable from "../components/DataTable";
import AppLogin from "../components/AppLogin";
import { useState, useContext } from "react";
import AppContext from "../context/AppContext";
import Favicon from "react-favicon";
import AppNavBar from "../components/AppNavBar";


function App({ entity_type, upload_id, page, page_size, sort_field, sort_order, filters }) {
    const {globusToken, handleLogin, handleLogout, isLoading, isAuthenticated, unauthorized, isLogout, t, getUserEmail} = useContext(AppContext)
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
            <AppNavBar />
            {isLoading || isLogout && <></>}

            {!isLoading && (!isAuthenticated || unauthorized) && !isLogout &&
            <AppLogin onLogin={handleLogin} unauthorized={unauthorized} onLogout={handleLogout}/> }

            { isAuthenticated && !unauthorized &&
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