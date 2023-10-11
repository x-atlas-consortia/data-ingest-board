import {useContext, useEffect, useState} from 'react'
import Favicon from "react-favicon";
import AppNavBar from "../components/AppNavBar";
import AppContext from "../context/AppContext";
import AppLogin from "../components/AppLogin";

function Login() {
    const {handleLogin, unauthorized, handleLogout, t, isAuthenticated} = useContext(AppContext)

    useEffect(() => {
        if (isAuthenticated && !unauthorized) {
            window.location = '/'
        } else {
            handleLogout(false)
        }
    })

    return (
        <div className="App bg--galGrey">
            <Favicon url={`favicons/${t('hubmap-favicon.ico')}`}/>
            <AppNavBar />
            {(!isAuthenticated || unauthorized) && <AppLogin onLogin={handleLogin} unauthorized={unauthorized} onLogout={handleLogout}/>}
        </div>
    )
}

export default Login