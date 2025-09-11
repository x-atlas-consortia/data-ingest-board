import React from 'react'
import { createContext, useEffect, useState, useRef} from 'react'

const LogsContext = createContext({})

export const LogsProvider = ({ children }) => {

  return <LogsContext.Provider value={{
 
    }}>{children}</LogsContext.Provider>
}

export default LogsContext