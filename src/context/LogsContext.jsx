import React from 'react'
import { createContext, useEffect, useState, useRef } from 'react'
import Icon, { BarChartOutlined, CalendarOutlined, DownloadOutlined, SettingOutlined, TableOutlined } from "@ant-design/icons";
import { Dropdown, Space, Switch } from 'antd';
import { eq } from "@/lib/helpers/general";
import ENVS from "@/lib/helpers/envs";
import { GroupedBarChartIcon } from '@/lib/helpers/icons';
import { useContext } from 'react';
import AppContext from './AppContext';

const LogsContext = createContext({})

export const LogsProvider = ({ children, defaultMenuItem, indexKey, fromDate, toDate, setExtraActions, extraActions, tabExtraActions, exportData, exportHandler, defaultDates, defaultIsLogScale }) => {

  const [tableData, setTableData] = useState([])
  const [isBusy, setIsBusy] = useState(true)
  const [hasMoreData, setHasMoreData] = useState(true)
  const afterKey = useRef(null)
  const [selectedMenuItem, setSelectedMenuItem] = useState(defaultMenuItem)
  const [numOfRows, setNumOfRows] = useState(20)
  const [vizData, setVizData] = useState({})
  const [menuItems, setMenuItems] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [selectedRowObjects, setSelectedRowObjects] = useState([])
  const [histogramDetails, setHistogramDetails] = useState({})
  const sectionHandleMenuItemClick = useRef(null)
  const {globusInfo} = useContext(AppContext)
  const [isLogScale, setIsLogScale] = useState(defaultIsLogScale ? defaultIsLogScale.current[indexKey] : false)

  const scaleTypeChange = (checked, e) => {
    defaultIsLogScale.current[indexKey] = checked
    setIsLogScale(checked)
  }

  const getScaleSwitchMenuItem = () => {
    if (defaultIsLogScale !== undefined) {
      return {
            key: 'scaleType'+indexKey,
            className: 'ant-menu-item--scaleType',
            disabled: true, //disable clicks on label
            label: <>Y-Axis Scale <Switch checkedChildren="Log" onChange={scaleTypeChange} unCheckedChildren="Linear" size="small" defaultChecked={isLogScale} /></>,
      }
    }
    return {}  
  }
  
  const menuProps = () => {
    const intervalMenu = []
    if (histogramDetails?.children) {
      intervalMenu.push({
        key: 'histogramInterval',
        label: 'Histogram Interval',
        icon: <CalendarOutlined />,
        children: getHistogramIntervalMenu(),
      })
    }
    return {
      items: [...menuItems, ...intervalMenu, {
        key: 'numOfRows',
        label: 'Rows Per Load More',
        icon: <TableOutlined />,
        children: getRowsPerLoadMore(),
      },
      {
        key: 'export',
        label: <span data-gtm-info={indexKey} data-gtm-action='export'>Export</span>,
        icon: <DownloadOutlined />
      }
    ],
      onClick: handleMenuClick,
    }
  }

  useEffect(() => {
    if (selectedRowObjects.length > 0) {
      exportData.current[indexKey] = selectedRowObjects
    } else {
      exportData.current[indexKey] = tableData
    }
    exportData.current[indexKey + 'Date'] = {fromDate: getFromDate(), toDate: getToDate()}
    
  }, [tableData, selectedRowObjects])

  const getFromDate = () => {
    if (fromDate) return fromDate
    if (defaultDates?.from) return defaultDates?.from
    let t = new Date()
    t.setDate(t.getDate() - 1)
    return `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`
  }

  const getToDate = () => {
    if (toDate) return toDate
    return defaultDates?.to || 'now'
  }

  useEffect(() => {
    tabExtraActions.current = {
      ...tabExtraActions.current, [`tab-${indexKey}`]: (<div>
        <Dropdown menu={menuProps()}>
          <a onClick={e => e.preventDefault()}>
            <Space>
              Table/Chart Options
              <SettingOutlined />
            </Space>
          </a>
        </Dropdown>
      </div>)
    }
    setExtraActions(tabExtraActions.current)
  }, [numOfRows, selectedMenuItem, menuItems, isLogScale, histogramDetails])

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

  const calendarIntervals = {
    year: { interval: 'year', format: 'yyyy' },
    month: { interval: 'month', format: 'yyyy-MM' },
    week:  { interval: 'week', format: 'yyyy-MM-dd' },
    day: { interval: 'day', format: 'yyyy-MM-dd' }
  }

  const calendarIntervalsSubmenu = {
    year: ['year', 'month'],
    month: ['month', 'week']
  }

  const determineCalendarInterval = () => {
    if (histogramDetails?.isMenuAction) return histogramDetails
    let to = getToDate()
    to = to === 'now' ? new Date() : new Date(to)
    let diff = getDateDifference(new Date(getFromDate()), to);
    if (diff.years > 0) return {...calendarIntervals.month, children: calendarIntervalsSubmenu.year}
    if (diff.months >= 1) return {...calendarIntervals.month, children: calendarIntervalsSubmenu.month}
    if (diff.weeks > 1) return calendarIntervals.week
    if (diff.weeks <= 1) return calendarIntervals.day
  }

  const pad = (num) => String(num).padStart(2, '0')

  const getAxisTick = (date, calendarInterval, operator = -1) => {
    if (eq(calendarInterval.interval, 'year')) {
      date.setYear(date.getFullYear() + operator)
      return date.getFullYear().toString()
    } else if (eq(calendarInterval.interval, 'month')) {
      date.setMonth(date.getMonth() + operator)
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
    } else if (eq(calendarInterval.interval, 'week')) {
      date.setDate(date.getDate() + (operator * 7))
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    } else {
      date.setDate(date.getDate() + operator)
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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

  const getHistogramIntervalMenu = () => {
    const ops = histogramDetails?.children || []
    let r = []
    for (let o of ops) {
      r.push({
        key: o,
        label: calendarIntervals[o].format,
        className: getMenuItemClassName(histogramDetails?.interval, o.toString())
      })
    }
    return r
  }

  const handleMenuClick = (e) => {
    const gtm = {info: globusInfo, gtm: {event: 'cta', info: indexKey, action: e.key}}
    let pushGTM = true
    if (e.keyPath.length > 1 && eq(e.keyPath[1], 'numOfRows')) {
      gtm.action = `${e.keyPath[1]}:${e.key}}`
      setNumOfRows(Number(e.key))
    } if (e.keyPath.length > 1 && eq(e.keyPath[1], 'histogramInterval')) {
      setHistogramDetails({...calendarIntervals[e.key], children: histogramDetails.children, isMenuAction: true})
    } else {
      setSelectedMenuItem(e.key)
    }
    if (eq(e.key, 'export')) {
      exportHandler(indexKey)
      pushGTM = false
    }
    if (sectionHandleMenuItemClick.current) {
      pushGTM = false
      sectionHandleMenuItemClick.current(e)
    }

    if (pushGTM) {
      GoogleTagManager.gtm(gtm)
    }
    
  }

  const stackedGroupedBarMenuItems = [
        {
            key: 'chartType',
            type: 'group',
            label: 'Chart Type',
            children: [
                {
                    key: 'groupedBar',
                    className: getMenuItemClassName(selectedMenuItem, 'groupedBar'),
                    label: 'Grouped Bar',
                    icon:   <GroupedBarChartIcon />
                },
                {
                    key: 'overlappedBar',
                    className: getMenuItemClassName(selectedMenuItem, 'overlappedBar'),
                    label: 'Overlapped Bar',
                    icon: <BarChartOutlined  />
                },
                
            ],
        }
    ]

  const getUrl = () => {
    let config = ENVS.logsIndicies()
    let i = config[indexKey]
    if (!i) return null

    let url = ENVS.urlFormat.search(i)
    return url
  }

  const getDatePart = (histogramOps) => ['month', 'year'].comprises(histogramOps.interval) ? '-2' : ''

  const tableScroll = {scroll: {x: 900, y: 'calc(100vh - 200px)' }}

  useEffect(() =>{
   setHistogramDetails(null)
  }, [fromDate, toDate])

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
    selectedRowObjects, setSelectedRowObjects,
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
    getDatePart,
    histogramDetails, setHistogramDetails,
    sectionHandleMenuItemClick,
    stackedGroupedBarMenuItems,
    tableScroll,
    isLogScale, setIsLogScale,
    defaultIsLogScale, getScaleSwitchMenuItem

  }}>{children}</LogsContext.Provider>
}

export default LogsContext