import { createContext, useEffect, useState, useRef} from 'react'

const UsageContext = createContext()

export const UsageProvider = ({ children }) => {

     const onExport = (indexKey) => {
        // TODO
    }


    return (
        <UsageContext.Provider value={{ onExport }}>
            {children}
        </UsageContext.Provider>
    )
}

export default UsageContext