import React, { useState, useEffect } from 'react'

function useSession() {
    let isAuthenticated = false
    let globusInfo = null

    useEffect(() => {
        if (localStorage.getItem('isAuthenticated')) {
            isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
        }
        if (localStorage.getItem('info')) {
            globusInfo = localStorage.getItem('info')
        }
        // checkLocals(isAuthenticated, globusInfo)
    }, [])
    return { isAuthenticated, globusInfo }
}

export default useSession
