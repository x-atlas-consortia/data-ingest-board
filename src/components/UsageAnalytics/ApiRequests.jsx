import React, { memo, useState, Fragment } from 'react'
import { Tabs } from 'antd'
import DetailSuspence from '@/components/DetailSuspence'
import SQL from '@/lib/helpers/sql'
import THEME from '@/lib/helpers/theme'
import TabChartCard from './TabChartCard'
import {
    formatBytes,
    formatNum,
    formatAxisDate,
    dataToArrayofObjects
} from '@/lib/helpers/general'
import BasicCard from './BasicCard'
import TableCard from './TableCard'

const trafficCharts = (from, to) => {
  return [
    // {
    //   component: (
    //     <TabChartCard
    //       title="API Requests"
    //       from={from}
    //       to={to}
    //       sql={SQL.apiRequests(from, to)}
    //       formatData={(data) => {
    //         const formattedData = dataToArrayofObjects(data)
    //         return formattedData.map((item) => ({
    //           x: formatAxisDate(item.date),
    //           y: item.requests
    //         }))
    //       }}
    //       yAxisLabel="Requests"
    //     />
    //   )
    // },
  ]
}

const endpointsCharts = (from, to) => {
  return [
  ]
}

const clientsAndUsersCharts = (from, to) => {
  return [
  ]
}

const ApiRequests = memo(({ from, to }) => {
    const items = [
        {
            key: 'traffic',
            label: 'Traffic',
            children: (
                <div>
                    {trafficCharts(from, to).map((chart, i) => chart.component)}
                </div>
            )
        },
        {
            key: 'endpoints',
            label: 'Endpoints',
            children: (
                <div>
                    {endpointsCharts(from, to).map((chart) => chart.component)}
                </div>
            )
        },
        {
            key: 'clients-and-users',
            label: 'Clients and users',
            children: (
                <div>
                    {clientsAndUsersCharts(from, to).map((chart) => chart.component)}
                </div>
            )
        }
    ]

    const [activeTab, setActiveTab] = useState('traffic')

    return (
        <div>
            <Tabs
                defaultActiveKey={activeTab}
                items={items}
                onChange={setActiveTab}
            />
        </div>
    )
})

export default ApiRequests
