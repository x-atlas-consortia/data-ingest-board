import { createContext, useEffect, useState, useRef} from 'react'
import {ENVS, parseJSON, THEME, URLS} from "../service/helper";
import {useIdleTimer} from 'react-idle-timer'
import {getCookie, setCookie} from 'cookies-next'
import axios from "axios";

const AppContext = createContext()

export const AppProvider = ({ children, messages }) => {
    const KEY_AUTH = 'isAuthenticated'
    const KEY_INFO = 'info'

    const [isLogout, setIsLogout] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [globusInfo, setGlobusInfo] = useState(null);
    const [globusToken, setGlobusToken] = useState(null);
    const [unauthorized, setUnauthorized] = useState(false);
    const pageLoaded = useRef(false)

    /**
     * Translates and formats a message string.
     * @param key {string} The key in the json file or string literal with interpolation expressions
     * @param args {any} Values respective of interpolation expressions
     * @example t('There are {0} results', 10) => There are 10 results
     * @returns {string} Result string
     */
    const t = (key, args) => {
        let msg = messages[key] || key
        msg = args ? msg.format(...args) : msg
        return msg
    }

    const handleLogin = () => {
        window.location.href = URLS.ingest.auth.login()
    };

    const handleLogout = () => {
        setIsLogout(true)
        setIsAuthenticated(false)
        setUnauthorized(false)
        setGlobusToken(null)
        setGlobusInfo(null)

        setCookie(KEY_AUTH, false)
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })

        axios.get(URLS.ingest.auth.logout())
            .then( (response) => {
                console.log(response)
            })
            .catch( (error) => {
                console.error(error);
            })
            .finally(() => {
                window.location.href = '/'
            })
    }

    const resolveLocals = () =>  {
        let info = getCookie(KEY_INFO)

        let authorized = false
        let globusInfo

        if (getCookie(KEY_AUTH)) {
            authorized = getCookie(KEY_AUTH) === 'true'
        }
        if (info) {
            info = atob(info)
            globusInfo = parseJSON(info)
            authorized = globusInfo?.read_privs
        }

        if (globusInfo) {
            setCookie(KEY_AUTH, authorized)
            setUnauthorized(!authorized)
            setGlobusInfo(globusInfo)
            setGlobusToken(globusInfo?.groups_token)
        }

        setIsAuthenticated(authorized)
        setIsLoading(false)
    }

    const onIdle = () => {
        handleLogout()
        window.location = '/'
    }

    const idleTimer = useIdleTimer({timeout: ENVS.idleTimeout(), onIdle})


    useEffect(() => {
        setIsLoading(true)
        resolveLocals()
        if (pageLoaded.current === false) {
            THEME.cssProps()
            pageLoaded.current = true
        }
    }, [])

    return <AppContext.Provider value={{
        globusInfo, setGlobusInfo,
        globusToken, setGlobusToken,
        isLoading,
        isLogout,
        isAuthenticated,
        unauthorized,
        handleLogin, handleLogout,
        t
    }}>{children}</AppContext.Provider>
}

export default AppContext
