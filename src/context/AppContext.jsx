import { createContext, useEffect, useState, useRef} from 'react'
import {parseJSON, THEME, URLS} from "../service/helper";

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
        window.location.href = URLS.ingest.auth.logout()
        setGlobusToken(null);
        setGlobusInfo(null);
        setUnauthorized(false);
        localStorage.removeItem(KEY_INFO);
        localStorage.removeItem(KEY_AUTH);
        setIsAuthenticated(false);
    }

    const resolveLocals = () =>  {
        let url = new URL(window.location.href)
        let urlInfo = url.searchParams.get(KEY_INFO)
        let authorized = false
        let globusInfo

        if (localStorage.getItem(KEY_AUTH)) {
            authorized = localStorage.getItem(KEY_AUTH) === 'true'
        }
        if (localStorage.getItem(KEY_INFO)) {
            globusInfo = parseJSON(localStorage.getItem(KEY_INFO))
        }

        if (urlInfo && !globusInfo) {
            window.history.pushState(null, null, `/`)
            globusInfo = parseJSON(urlInfo)
            authorized = globusInfo?.read_privs
        }

        if (globusInfo) {
            localStorage.setItem(KEY_INFO, JSON.stringify(globusInfo))
            localStorage.setItem(KEY_AUTH, authorized.toString())
            setGlobusInfo(globusInfo)
            setGlobusToken(globusInfo?.groups_token)
        }

        setIsAuthenticated(authorized)
        setIsLoading(false)
    }

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
