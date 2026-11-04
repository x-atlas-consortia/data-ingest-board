import { createContext, useEffect, useState, useRef} from 'react'

const UsageContext = createContext()

export const UsageProvider = ({ children }) => {


    return (
        <UsageContext.Provider value={{ 
          
         }}>
            {children}
        </UsageContext.Provider>
    )
}

export default UsageContext