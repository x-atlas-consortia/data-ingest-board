import {useContext, useEffect, useRef, useState} from 'react'
import { useRouter } from 'next/router'
import AppContext from '@/context/AppContext'
import AppLogin from '@/components/AppLogin'
import {getHierarchy} from "@/lib/helpers/hierarchy";
import URLS from "@/lib/helpers/urls";
import Spinner from "@/components/Spinner";

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

    const handleLoading = (ctx) => {
        setLoading(ctx.isLoading)
    }

    const setSankeyOptions = ()=> {
        if (xacSankey.current && xacSankey.current.setOptions) {
            xacSankey.current.setOptions({
                loading: {
                    callback: handleLoading
                },
                dataCallback: (row) => {
                    return {...row, organ_type: getHierarchy(row.organ_type)}
                }
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
                    styleSheetPath: '/css/xac-sankey.css',
                    filters,
                    api:
                        {
                            url: URLS.entity.sankey(),
                            token: globusToken
                        }
                }))
                }>
                    {loading && <Spinner />}
                </react-consortia-sankey>
            </div>}
        </div>
    )
}

export default SankeyPage
