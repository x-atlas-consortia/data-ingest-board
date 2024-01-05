import { createContext, useEffect, useState, useRef} from 'react'
import {ENVS, eq, getHeadersWith, parseJSON, THEME, URLS} from "../lib/helper";
import {useIdleTimer} from 'react-idle-timer'
import {deleteCookie, getCookie, setCookie} from 'cookies-next'
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

    const deleteCookies = () => {
        deleteCookie(KEY_AUTH)
        // This cookie was set on login, need to specify the domain to match
        deleteCookie(KEY_INFO, {path: '/', domain: ENVS.cookieDomain()})
    }

    const handleLogout = (redirect = true) => {
        setIsLogout(true)
        setIsAuthenticated(false)
        setUnauthorized(false)
        setGlobusToken(null)
        setGlobusInfo(null)

        deleteCookies()

        window.location = URLS.ingest.auth.logout()
    }

    const verifyInReadGroup = (response) => {
        const groupName = ENVS.groupName()
        let hasRead = response.read_privs || false
        if (groupName) {
            for (let group of response.groups) {
                if (eq(group.displayname, groupName)) {
                    hasRead = true
                    break
                }
            }
        }
        setUnauthorized(!hasRead)
    }

    const checkToken = (token, authorized) => {
        if (!token) {
            setIsAuthenticated(false)
        }
        axios.get(URLS.ingest.privs.groups(), getHeadersWith(token))
            .then( (response) => {
                setGlobusToken(token)
                setIsAuthenticated(authorized)
                verifyInReadGroup(response.data)
                setIsLoading(false)
            }).catch((error) => {
                if (error?.response?.status === 401) {
                    setIsAuthenticated(false)
                }
                setIsLoading(false)
        })
    }

    const resolveLocals = () =>  {
        let info = getCookie(KEY_INFO)

        let authorized = true
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
            setCookie(KEY_AUTH, authorized,  {sameSite: "Lax"})
            setUnauthorized(!authorized)
            setGlobusInfo(globusInfo)
            checkToken(globusInfo?.groups_token, authorized)
        } else {
            setIsAuthenticated(false)
            setIsLoading(false)
            deleteCookies()
        }
    }

    const onIdle = () => {
        handleLogout()
        window.location = '/'
    }

    const getUserEmail = () => {
        const info = getCookie('info')
        return info ? parseJSON(atob(info))?.email : ''
    }

    const idleTimer = useIdleTimer({timeout: ENVS.idleTimeout(), onIdle})


    useEffect(() => {
        setIsLoading(true)
        resolveLocals()
        // Set up Page Title based on Resolved Locals
        document.title = ENVS.appContext() + " Data Ingest Board"
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
        handleLogin, handleLogout, getUserEmail,
        t
    }}>{children}</AppContext.Provider>
}

export default AppContext
