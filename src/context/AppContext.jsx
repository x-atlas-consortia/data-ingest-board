import { createContext, useEffect, useState, useRef} from 'react'
import {INGEST_API} from "../service/apis";
import {ENVS, THEME, URLS} from "../service/helper";

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
        let info = url.searchParams.get(KEY_INFO)
        let authorized = false
        let globusInfo

        if (localStorage.getItem(KEY_AUTH)) {
            authorized = localStorage.getItem(KEY_AUTH) === 'true'
        }
        if (localStorage.getItem(KEY_INFO)) {
            globusInfo = JSON.parse(localStorage.getItem(KEY_INFO))
        }

        if (info && !globusInfo) {
            window.history.pushState(null, null, `/`);
            globusInfo = JSON.parse(info)
            authorized = true
        }

        localStorage.setItem(KEY_INFO, info);
        localStorage.setItem(KEY_AUTH, authorized.toString())
        setIsAuthenticated(authorized)
        checkLocals(authorized, globusInfo)
    }

    useEffect(() => {
        setIsLoading(true)
        resolveLocals()
        if (pageLoaded.current === false) {
            THEME.cssProps()
            pageLoaded.current = true
        }
    }, [globusToken, globusInfo, isAuthenticated, isLoading])

    const checkToken = (tokenInfo) => {
        let user = false;
        let invalidToken = false;

        return new Promise((resolve, reject) => {
            try {
                INGEST_API.privs.userGroups(tokenInfo).then((results) => {
                    if (results && results.status === 200) {
                        // TODO: refactor to be a bool check from AuthHelper.has_read_privs
                        //user = results.results.read_privs
                        user = results.results.some(obj => obj.displayname === ENVS.privsGroupReadName());
                    }
                    if (results && results.status === 401) {
                        invalidToken = true;
                    }
                    resolve({user, invalidToken});
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

    const checkLocals = (authenticated, initialInfo) => {
        if (initialInfo) {
            setGlobusInfo(initialInfo);
            setGlobusToken(initialInfo.groups_token)
            checkToken(initialInfo.groups_token).then(validate => {
                setIsAuthenticated(authenticated && validate.user);
                if (validate.user === false && validate.invalidToken === false) {
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

    return <AppContext.Provider value={{
        globusInfo, setGlobusInfo,
        globusToken, setGlobusToken,
        isLoading,
        isLogout,
        isAuthenticated,
        unauthorized,
        checkLocals,
        handleLogin, handleLogout,
        t
    }}>{children}</AppContext.Provider>
}

export default AppContext
