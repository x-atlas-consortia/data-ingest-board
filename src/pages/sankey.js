import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AppContext from '@/context/AppContext'
import Sankey from '@/components/Visualizations/Charts/Sankey'
import AppLogin from '@/components/AppLogin'

function SankeyPage() {
    const {
        handleLogin,
        handleLogout,
        isLoading,
        isAuthenticated,
        unauthorized,
        isLogout
    } = useContext(AppContext)

    const router = useRouter()
    const [filters, setFilters] = useState(null)

    useEffect(() => {
        if (!router.isReady) return
        setFilters(router.query)
    }, [router.isReady, router.query])

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

            {isAuthenticated && !unauthorized && filters && <Sankey filters={filters} />}
        </div>
    )
}

export default SankeyPage
