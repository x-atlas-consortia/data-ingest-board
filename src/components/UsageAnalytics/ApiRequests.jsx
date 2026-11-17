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
        {
            component: (
                <DetailSuspence
                    key='requests-per-day-by-api'
                    suspenseBlockStyle={true}
                    query={SQL.apiRequests.requestsPerDay({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)

                        const formattedData = {}
                        const subGroupLabels = {
                          uuid_api: 'UUID API',
                          search_api: 'Search API',
                          entity_api: 'Entity API'
                        }
                        const chartData = []
                        for (const d of data) {
                            formattedData[d.time_bucket] = {
                                ...(formattedData[d.time_bucket] || {}),
                                ...d,
                                group: new Date(d.time_bucket)
                            } 
                            for (const group of Object.keys(subGroupLabels)) {
                                if (d[group] !== undefined) {
                                    chartData.push({
                                        ...d,
                                        group: d.time_bucket,
                                        subGroup: group,
                                        value: d[group]
                                    })
                                }
                            }
                        }
                        const config = {
                            providerProps: {
                                onBuildToolTip: (id, e, d) => {
                                    return onBuildToolTip(id, e, d, {
                                        row:
                                            formattedData[d] ||
                                            formattedData[d.data.group],
                                        subGroupLabels,
                                        formatter: formatBytes
                                    })
                                }
                            },
                            // optionsMenu: {
                            //     logScale: {
                            //         checked: true
                            //     }
                            // },
                            data: chartData,
                            yAxis: {
                                //scaleLog: true,
                                formatter: (v, i) => formatNum(v)
                            },
                            xAxis: {
                                formatter: (v, i) => formatAxisDate(v)
                            },
                            style: {
                                valueFormatter: ({ d, v }) => {
                                    return formatNum(v)
                                }
                            },
                            legendLayout: 'flex',
                            subGroupLabels
                        }
                        
                        return (
                            <BasicCard
                                key='requests-per-day-by-api'
                                chartType='Line'
                                title='Requests per day by API'
                                subTitle={`Every request logged, ${from} – ${to}, UTC days. Hover for the day's numbers.`}
                                data={config}
                                footer={
                                    <small>
                                        <strong>Why this view:</strong> daily resolution shows load spikes and outages that monthly totals hide, and separates the three services, which scale and fail independently.
                                    </small>
                                }
                            />
                        )
                    }}
                />
            )
        }
    ]
}

const endpointsCharts = (from, to) => {
    return []
}

const clientsAndUsersCharts = (from, to) => {
    return []
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
                    {clientsAndUsersCharts(from, to).map(
                        (chart) => chart.component
                    )}
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
