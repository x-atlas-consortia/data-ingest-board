import { createContext, useEffect, useState, useRef} from 'react'
import {ingest_api_users_groups} from "../service/ingest_api";
import {ENVS, URLS} from "../service/helper";
import useSession from "../hooks/useSession";

const AppContext = createContext()

export const AppProvider = ({ children }) => {

    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [globusInfo, setGlobusInfo] = useState(null);
    const [globusToken, setGlobusToken] = useState(null);
    const [unauthorized, setUnauthorized] = useState(false);
    const pageLoaded = useRef(false)

    const session = useSession()
    // Could also do but naming used above
    // const {isAuthenticated, globusInfo} = useSession()

    const handleLogin = () => {
        window.location.href = URLS.ingest.auth.login()
    };

    const handleLogout = () => {
        window.location.href = URLS.ingest.auth.logout()
        setGlobusToken(null);
        setGlobusInfo(null);
        setUnauthorized(false);
        localStorage.removeItem("info");
        localStorage.removeItem("isAuthenticated");
        setIsAuthenticated(false);
    }


    useEffect(() => {
        checkLocals(session.isAuthenticated, session.globusInfo)
        if (pageLoaded.current === false) {
            ENVS.theme()
            pageLoaded.current = true
        }
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

    const checkToken = (tokenInfo) => {
        let hubmapUser = false;
        let invalidToken = false;

        return new Promise((resolve, reject) => {
            try {
                ingest_api_users_groups(tokenInfo).then((results) => {
                    if (results && results.status === 200) {
                        // TODO: refactor to be a bool check from AuthHelper.has_write_privs
                        hubmapUser = results.results.some(obj => obj.displayname === ENVS.privsGroupReadName());
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

    return <AppContext.Provider value={{
        globusInfo, setGlobusInfo,
        globusToken, setGlobusToken,
        isLoading,
        isAuthenticated,
        unauthorized,
        checkLocals,
        handleLogin, handleLogout
    }}>{children}</AppContext.Provider>
}

export default AppContext
