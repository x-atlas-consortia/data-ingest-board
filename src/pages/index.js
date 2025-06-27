// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
import DataTable from "../components/DataTable";
import AppLogin from "../components/AppLogin";
import { useState, useContext } from "react";
import AppContext from "../context/AppContext";
import AppNavBar from "../components/AppNavBar";
import {RouterProvider} from "@/context/RouterContext";

function App(props) {
    const {handleLogin, handleLogout, isLoading, isAuthenticated, unauthorized, isLogout} = useContext(AppContext)
    const [pageProps, _] = useState(props)

    return (
        <div className="App bg--galGrey">
            <AppNavBar />
            {isLoading || isLogout && <></>}

            {!isLoading && (!isAuthenticated || unauthorized) && !isLogout &&
            <AppLogin onLogin={handleLogin} unauthorized={unauthorized} onLogout={handleLogout}/> }

            { isAuthenticated && !unauthorized &&
                <RouterProvider props={pageProps}>
                    <DataTable className="c-table--data" />
                </RouterProvider> }
        </div>
    );
}

App.getInitialProps = ({ query }) => {
  const { entity_type, upload_id, page, page_size, sort_field, sort_order, ...filters } = query;
  return { entity_type, upload_id, page, page_size, sort_field, sort_order, filters};
};

export default App;