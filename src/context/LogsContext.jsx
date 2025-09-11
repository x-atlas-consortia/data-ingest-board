import React from 'react'
import { createContext, useEffect, useState, useRef} from 'react'

const LogsContext = createContext({})

export const LogsProvider = ({ children }) => {

    const [legend, setLegend] = useState([])

  return <LogsContext.Provider value={{
        legend,
        setLegend
    }}>{children}</LogsContext.Provider>
}

export default LogsContext