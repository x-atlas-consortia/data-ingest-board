import {useContext, useEffect, useRef, useState} from 'react'
import { useRouter } from 'next/router'
import AppContext from '@/context/AppContext'
import AppLogin from '@/components/AppLogin'
import URLS from "@/lib/helpers/urls";
import Spinner from "@/components/Spinner";
import ENVS from "@/lib/helpers/envs";

function SankeyPage() {
    const {
        handleLogin,
        handleLogout,
        isLoading,
        isAuthenticated,
        unauthorized,
        isLogout,
        globusToken
    } = useContext(AppContext)

    const router = useRouter()
    const [filters, setFilters] = useState(null)
    const xacSankey = useRef(null)
    const [loading, setLoading] = useState(true)
    const [loadingMsg, setLoadingMsg] = useState('')
    const [options, setOptions] = useState(null)

    const handleLoading = (ctx, msg) => {
        setLoading(msg ? true : ctx.isLoading)
        setLoadingMsg(msg)
    }

    const isHM = () => ENVS.isHM()

    const setSankeyOptions = (xac)=> {
        if (xacSankey.current && xacSankey.current.setOptions) {
            const el = xacSankey.current
            const adapter = isHM() ? new HuBMAPAdapter(el) : new SenNetAdapter(el)
            if (isHM()) {
                // clear color settings & leave HM to be its current randomized color until otherwise requested
                el.theme.byScheme = undefined
            }
            el.setOptions({
                ...options,
                loading: {
                    callback: handleLoading
                },
                onDataBuildCallback: () => adapter.onDataBuildCallback(),
                onLinkBuildCssCallback: (d) => {
                    if (!isHM()) {
                        return adapter.onLinkBuildCssCallback(d)
                    }
                    return ''
                },
                onNodeBuildCssCallback: (d) => {
                    if (!isHM()) {
                        return adapter.onNodeBuildCssCallback(d)
                    }
                    return ''
                },
                onLinkClickCallback: (e, d) => {
                    e.preventDefault()
                    adapter.goToFromLink(d)
                },
                onNodeClickCallback: (e, d) => {
                    e.preventDefault()
                    adapter.goToFromNode(d)
                },
                onLabelClickCallback: (e, d) => {
                    e.preventDefault()
                    adapter.goToFromNode(d)
                }
            })
        }
    }

    useEffect(() => {
        if (!router.isReady) return
        setFilters(router.query)
    }, [router.isReady, router.query])

    useEffect(() => {
        if (globusToken && filters) {
            setOptions({
                useShadow: true,
                disableUbkgColorPalettes: isHM(),
                styleSheetPath: '/css/xac-sankey.css',
                filters,
                groupByOrganCategoryKey: isHM() ? 'term' : undefined,
                api:
                    {
                        context: ENVS.appContext().toLowerCase(),
                        sankey: URLS.entity.sankey(),
                        token: globusToken
                    },
                displayableFilterMap: isHM() ? undefined : {
                    status: null
                },
                validFilterMap: isHM() ? undefined : {
                    dataset_type: 'dataset_type_hierarchy',
                    source_type: 'dataset_source_type'
                }
            })
        }
    }, [globusToken, filters])


    useEffect(()=>{
        // web components needs global window
        import('xac-sankey').then((xac)=> {
            // the only way to pass objects is via a functional call to the exposed shadow dom
            // must observe that this web component el is ready in DOM before calling the method
            const targetNode = document.getElementById("__next")
            const config = {  attributes: true, childList: true, subtree: true }

            const callback = (mutationList, observer) => {
                if (xacSankey.current && xacSankey.current.setOptions) {
                    // it's ready
                    setSankeyOptions(xac)
                    observer.disconnect()
                }
            }

            const observer = new MutationObserver(callback)
            observer.observe(targetNode, config)
        })
    }, [])


    return (
        <div className='App bg--galGrey'>
            { isHM() && <script type='text/javascript' src='https://unpkg.com/lz-string@1.5.0/libs/lz-string.js'></script>}
            {isLoading || (isLogout && <></>)}
            {!isLoading && (!isAuthenticated || unauthorized) && !isLogout && (
                <AppLogin
                    onLogin={handleLogin}
                    unauthorized={unauthorized}
                    onLogout={handleLogout}
                />
            )}

            {isAuthenticated && !unauthorized && filters &&
                <div className={'c-sankey'}>
                    {options && <react-consortia-sankey ref={xacSankey} options={btoa(JSON.stringify(options))} />}
                    {loading && <Spinner tip={loadingMsg} />}
                </div>}
        </div>
    )
}

export default SankeyPage
