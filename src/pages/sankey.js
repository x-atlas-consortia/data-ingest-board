import {useContext, useEffect, useRef, useState} from 'react'
import { useRouter } from 'next/router'
import AppContext from '@/context/AppContext'
import AppLogin from '@/components/AppLogin'
import URLS from "@/lib/helpers/urls";
import Spinner from "@/components/Spinner";
import ENVS from "@/lib/helpers/envs";
import {eq} from "@/lib/helpers/general";

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

    const handleLoading = (ctx, msg) => {
        setLoading(msg ? true : ctx.isLoading)
        setLoadingMsg(msg)
    }

    const isHM = () => eq(ENVS.appContext(), 'hubmap')

    const setSankeyOptions = ()=> {
        if (xacSankey.current && xacSankey.current.setOptions) {
            const el = xacSankey.current
            const adapter = isHM() ? new HuBMAPAdapter(el) : new SenNetAdapter(el)
            el.setOptions({
                loading: {
                    callback: handleLoading
                },
                onDataBuildCallback: () => adapter.onDataBuildCallback(),
                onNodeBuildCssCallback: (d) => {
                    if (!isHM() && eq(d.columnName, el.validFilterMap.dataset_type)) {
                        const assay = adapter.captureByKeysValue({matchKey: d.columnName, matchValue: d.name, keepKey: 'dataset_type_description'}, el.rawData)
                        return assay.length <= 0 ? 'c-sankey__node--default' : ''
                    }
                    return ''
                },
                onNodeClickCallback: (e, d) => adapter.goTo(d),
                onLabelClickCallback: (e, d) => adapter.goTo(d)
            })
        }
    }

    useEffect(() => {
        if (!router.isReady) return
        setFilters(router.query)
    }, [router.isReady, router.query])

    useEffect(()=>{
        // web components needs global window
        import('xac-sankey')

        // the only way to pass objects is via a functional call to the exposed shadow dom
        // must observe that this web component el is ready in DOM before calling the method
        const targetNode = document.getElementById("__next")
        const config = {  attributes: true, childList: true, subtree: true }

        const callback = (mutationList, observer) => {
            if (xacSankey.current && xacSankey.current.setOptions) {
                // it's ready
                setSankeyOptions()
                observer.disconnect()
            }
        }

        const observer = new MutationObserver(callback)
        observer.observe(targetNode, config)

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

            {isAuthenticated && !unauthorized && filters && <div className={'c-sankey'}>
                <react-consortia-sankey ref={xacSankey} options={btoa(JSON.stringify({
                    useShadow: true,
                    styleSheetPath: '/css/xac-sankey.css?v='+(new Date()).getMilliseconds(),
                    filters,
                    api:
                        {
                            context: ENVS.appContext().toLowerCase(),
                            sankey: URLS.entity.sankey(),
                            token: globusToken
                        },
                    validFilterMap: isHM() ? undefined : {
                        dataset_type: 'dataset_type_hierarchy',
                        source_type: 'dataset_source_type'
                    }
                }))
                } />
                {loading && <Spinner tip={loadingMsg} />}

            </div>}
        </div>
    )
}

export default SankeyPage
