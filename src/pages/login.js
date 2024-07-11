import {useContext, useEffect, useState} from 'react'
import AppNavBar from "../components/AppNavBar";
import AppContext from "../context/AppContext";
import AppLogin from "../components/AppLogin";
import AppBanner from "../components/AppBanner";

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
            <AppNavBar />
            {(!isAuthenticated || unauthorized) && <AppLogin onLogin={handleLogin} unauthorized={unauthorized} onLogout={handleLogout}/>}
        </div>
    )
}

export default Login