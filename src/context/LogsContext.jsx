import React from 'react'
import { createContext, useEffect, useState, useRef } from 'react'
import { SettingOutlined } from "@ant-design/icons";
import { Dropdown, Space } from 'antd';
import { eq } from "@/lib/helpers/general";
import ENVS from "@/lib/helpers/envs";

const LogsContext = createContext({})

export const LogsProvider = ({ children, defaultMenuItem, indexKey, fromDate, toDate, setExtraActions, extraActions, tabExtraActions, exportData }) => {

  const [tableData, setTableData] = useState([])
  const [isBusy, setIsBusy] = useState(true)
  const [hasMoreData, setHasMoreData] = useState(true)
  const afterKey = useRef(null)
  const [selectedMenuItem, setSelectedMenuItem] = useState(defaultMenuItem)
  const [numOfRows, setNumOfRows] = useState(20)
  const [vizData, setVizData] = useState({})
  const [menuItems, setMenuItems] = useState([])
  const [selectedRows, setSelectedRows] = useState([])

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
    exportData.current[indexKey] = tableData
  }, [tableData])

  const getFromDate = () => {
    if (fromDate) return fromDate
    let t = new Date()
    t.setDate(t.getDate() - 1)
    return `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`
  }
  const getToDate = () => {
    if (toDate) return toDate
    return 'now'
  }

  useEffect(() => {
    tabExtraActions.current = {
      ...tabExtraActions.current, [`tab-${indexKey}`]: (<div>
        <Dropdown menu={menuProps()}>
          <a onClick={e => e.preventDefault()}>
            <Space>
              Table Options
              <SettingOutlined />
            </Space>
          </a>
        </Dropdown>
      </div>)
    }
    setExtraActions(tabExtraActions.current)
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

  const getDateDifference = (date1, date2) => {
    // Ensure date1 is always the earlier date
    if (date1 > date2) {
      [date1, date2] = [date2, date1];
    }

    let years = date2.getFullYear() - date1.getFullYear();
    let months = date2.getMonth() - date1.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    // Adjust for partial months (if days are different)
    if (date2.getDate() < date1.getDate()) {
      months--;
      if (months < 0) {
        months += 12;
        years--;
      }
    }

    const diffMs = Math.abs(date1.getTime() - date2.getTime());

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    return {
      milliseconds: diffMs,
      seconds: diffSeconds,
      minutes: diffMinutes,
      hours: diffHours,
      days: diffDays,
      weeks: diffWeeks,
      months,
      years
    };
  }

  const determineCalendarInterval = () => {
    let diff = getDateDifference(new Date(fromDate), new Date(toDate));
    if (diff.years > 1) return { interval: 'year', format: 'yyyy' }
    if (diff.months >= 1) return { interval: 'month', format: 'yyyy-MM' }
    if (diff.weeks > 1) return { interval: 'week', format: 'yyyy-MM-dd' }
    if (diff.weeks <= 1) return { interval: 'day', format: 'yyyy-MM-dd' }
  }

  const getAxisTick = (date, calendarInterval, operator = -1) => {
    if (eq(calendarInterval.interval, 'year')) {
      date.setYear(date.getFullYear() + operator)
      return date.getFullYear().toString()
    } else if (eq(calendarInterval.interval, 'month')) {
      date.setMonth(date.getMonth() + operator)
      return `${date.getFullYear()}-${(date.getMonth() + 1)}`
    } else if (eq(calendarInterval.interval, 'week')) {
      date.setDate(date.getDate() + (operator * 7))
      return `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`
    } else {
      date.setDate(date.getDate() + operator)
      return `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`
    }
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

  const getUrl = () => {
    let config = ENVS.logsIndicies()
    let i = config[indexKey]
    if (!i) return null

    let url = ENVS.urlFormat.search(`/${i}/search`)
    return url
  }

  const getDatePart = (histogramOps) => ['month', 'year'].comprises(histogramOps.interval) ? '-2' : ''

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
    selectedRows, setSelectedRows,
    updateTableData,
    getMenuItemClassName,
    getRowsPerLoadMore,
    handleMenuClick,
    fromDate, toDate,
    getFromDate, getToDate,
    indexKey,
    determineCalendarInterval,
    getAxisTick,
    getUrl,
    getDatePart

  }}>{children}</LogsContext.Provider>
}

export default LogsContext