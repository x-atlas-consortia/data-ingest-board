import React from 'react'
import { createContext, useEffect, useState, useRef } from 'react'
import { SettingOutlined } from "@ant-design/icons";
import { Dropdown, Space } from 'antd';
import { eq } from "@/lib/helpers/general";

const LogsContext = createContext({})

export const LogsProvider = ({ children, selectedMenuItem, indexKey, fromDate, toDate, setExtraActions, extraActions }) => {

  const [tableData, setTableData] = useState([])
  const [isBusy, setIsBusy] = useState(true)
  const [hasMoreData, setHasMoreData] = useState(true)
  const afterKey = useRef(null)
  const [tableType, setTableType] = useState(selectedMenuItem)
  const [numOfRows, setNumOfRows] = useState(20)
  const [vizData, setVizData] = useState([])
  const [menuItems, setMenuItems] = useState([])

  const menuProps = () => {
    return {
      items: menuItems,
      onClick: handleMenuClick,
    }
  }

  useEffect(() => {
    setExtraActions({
      ...extraActions, [`tab-${indexKey}`]: <div>
        <Dropdown menu={menuProps()}>
          <a onClick={e => e.preventDefault()}>
            <Space>
              Table Options
              <SettingOutlined />
            </Space>
          </a>
        </Dropdown>
      </div>
    })
  }, [numOfRows, tableType, menuItems])

  const updateTableData = (includePrevData, _tableData) => {
    if (includePrevData) {
      setTableData([...tableData, ..._tableData])
    } else {
      setTableData(_tableData)
    }
  }

  const getMenuItemClassName = (s1, s2) => {
    return eq(s1, s2) ? 'is-active' : undefined
  }


  const getRowsPerLoadMore = () => {
    const ops = [10, 20, 50, 100, 200, 300]
    let r = []
    for (let o of ops) {
      r.push({
        key: o,
        label: o,
        className: getMenuItemClassName(numOfRows.toString(), o.toString())
      })
    }
    return r
  }

  const handleMenuClick = (e) => {

    if (e.keyPath.length > 1 && eq(e.keyPath[1], 'numOfRows')) {
      setNumOfRows(Number(e.key))
    } else {
      setTableType(e.key)
    }
  }


  return <LogsContext.Provider value={{
    tableData, setTableData,
    isBusy, setIsBusy,
    hasMoreData, setHasMoreData,
    afterKey,
    tableType, setTableType,
    numOfRows, setNumOfRows,
    vizData, setVizData,
    menuItems, setMenuItems,
    extraActions, setExtraActions,
    updateTableData,
    getMenuItemClassName,
    getRowsPerLoadMore,
    handleMenuClick,
    fromDate, toDate,

  }}>{children}</LogsContext.Provider>
}

export default LogsContext