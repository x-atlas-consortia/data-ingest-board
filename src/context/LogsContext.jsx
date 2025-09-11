import React from 'react'
import { createContext, useEffect, useState, useRef } from 'react'
import { SettingOutlined } from "@ant-design/icons";
import { Dropdown, Space } from 'antd';
import { eq } from "@/lib/helpers/general";

const LogsContext = createContext({})

export const LogsProvider = ({ children, defaultMenuItem, indexKey, fromDate, toDate, setExtraActions, extraActions }) => {

  const [tableData, setTableData] = useState([])
  const [isBusy, setIsBusy] = useState(true)
  const [hasMoreData, setHasMoreData] = useState(true)
  const afterKey = useRef(null)
  const [selectedMenuItem, setSelectedMenuItem] = useState(defaultMenuItem)
  const [numOfRows, setNumOfRows] = useState(20)
  const [vizData, setVizData] = useState([])
  const [menuItems, setMenuItems] = useState([])

  const menuProps = () => {
    return {
      items: [...menuItems, {
            key: 'numOfRows',
            label: 'Rows Per Load More',
            children: getRowsPerLoadMore(),
        }],
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
  }, [numOfRows, selectedMenuItem, menuItems])

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
      setSelectedMenuItem(e.key)
    }
  }

  return <LogsContext.Provider value={{
    tableData, setTableData,
    isBusy, setIsBusy,
    hasMoreData, setHasMoreData,
    afterKey,
    selectedMenuItem, setSelectedMenuItem,
    numOfRows, setNumOfRows,
    vizData, setVizData,
    menuItems, setMenuItems,
    extraActions, setExtraActions,
    updateTableData,
    getMenuItemClassName,
    getRowsPerLoadMore,
    handleMenuClick,
    fromDate, toDate,
    indexKey

  }}>{children}</LogsContext.Provider>
}

export default LogsContext