import { createContext, useEffect, useState, useRef} from 'react'
import {callService, deleteFromLocalStorage, eq, getHeadersWith, parseJSON, storageKey} from "../lib/helpers/general";
import {useIdleTimer} from 'react-idle-timer'
import {deleteCookie, getCookie, setCookie} from 'cookies-next'
import axios from "axios";
import URLS from "../lib/helpers/urls";
import ENVS from "../lib/helpers/envs";
import THEME from "../lib/helpers/theme";
import AddonsIndex from "../lib/addons/AddonsIndex";
import UI_BLOCKS from "../lib/helpers/uiBlocks";

const AppContext = createContext()

export const AppProvider = ({ children, messages, banners }) => {
    const KEY_AUTH = 'isAuthenticated'
    const KEY_INFO = 'info'

    const [isLogout, setIsLogout] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [globusInfo, setGlobusInfo] = useState(null);
    const [globusToken, setGlobusToken] = useState(null);
    const [unauthorized, setUnauthorized] = useState(false);
    const [hasDataAdminPrivs, setHasDataAdminPrivs] = useState(false)
    const [hasPipelineTestingPrivs, setHasPipelineTestingPrivs] = useState(false)
    const pageLoaded = useRef(false)
    const revisionsData = useRef({})
    const [selectedEntities, setSelectedEntities] = useState([])
    const [dataProviderGroups, setDataProviderGroups] = useState(null)


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
        deleteFromLocalStorage(storageKey())
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

    const checkInAdminGroup = (token) => {
        axios.get(URLS.ingest.privs.admin(), getHeadersWith(token))
            .then( (response) => {
                setHasDataAdminPrivs(response.data.has_data_admin_privs)
            }).catch((error) => {
            setHasDataAdminPrivs(false)
            console.error(error)
        })
    }

    const checkPipelineTestingPrivs = (token) => {
        axios.get(URLS.ingest.privs.pipelineTesting(), getHeadersWith(token))
            .then( (response) => {
                setHasPipelineTestingPrivs(response.data.has_pipeline_test_privs)
            }).catch((error) => {
                setHasPipelineTestingPrivs(false)
                console.error(error)
        })
    }

    const fetchDataProviderGroups = (token) => {
        if (!URLS.ingest.privs.dataProviderGroups()) return
        axios.get(URLS.ingest.privs.dataProviderGroups(), getHeadersWith(token))
            .then( (response) => {
                setDataProviderGroups(response.data.groups)
            }).catch((error) => {
            console.error(error)
        })
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
                checkInAdminGroup(token)
                fetchDataProviderGroups(token)
                if (ENVS.submissionTestingEnabled()) {
                    checkPipelineTestingPrivs(token)
                }

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

    const confirmBulkEdit = ({url, setModal, bulkEditValues, entityName = 'Dataset'}) => {
        const headers = getHeadersWith(globusToken)

        callService(url, headers.headers, selectedEntities.map(item => {
            return {...bulkEditValues, uuid: item.uuid}
        })).then((res) => {
            let mainTitle = `${entityName}(s) Submitted For Bulk Editing`
            const {className} = UI_BLOCKS.modalResponse.styling(res)
            const otherDetails = (
                <p>
                    Please note the submitted changes to the {entityName}s are being handled by a different service and may not update successfully.
                    These changes will also not appear on the Data Ingest Board until its hourly refresh has completed. To verify that these changes are complete please visit the Portal/Ingest UI.
                </p>
            )
            const {modalBody} = UI_BLOCKS.modalResponse.body(res, mainTitle, otherDetails)
            setModal({body: modalBody, width: 1000, className, open: true, cancelCSS: 'none', okCallback: null})
        })
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
    }, [selectedEntities])

    useEffect(() => {
        if (globusInfo) {
            AddonsIndex('init', globusInfo)
        }
    }, [globusInfo])

    const dispatchGTM = ({action, info, event = 'cta'}) => {
        const gtm = {info: globusInfo, gtm: {event, info, action}}
        GoogleTagManager.gtm(gtm)
    }

    return <AppContext.Provider value={{
        globusInfo, setGlobusInfo,
        globusToken, setGlobusToken,
        isLoading,
        isLogout,
        isAuthenticated,
        unauthorized,
        banners,
        hasDataAdminPrivs,
        hasPipelineTestingPrivs,
        handleLogin, handleLogout, getUserEmail,
        t,
        confirmBulkEdit,
        dataProviderGroups,
        revisionsData,
        selectedEntities, setSelectedEntities,
        dispatchGTM
    }}>{children}</AppContext.Provider>
}

export default AppContext
