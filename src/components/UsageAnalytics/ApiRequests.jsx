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

const onBuildToolTip = (id, e, d, { subGroupLabels, row, formatter, title }) => {
    const colors = e.colors

    if (!e.stacked) {
        return `<div class="c-visualizations__tooltipWrap">
            <span class="text-muted">${formatAxisDate(d.data.group, true)}</span>
            <br> 
            <span>
                <span class="c-visualizations__itemCol" style="background-color: ${colors[d.key].color};"></span>
                <span>${subGroupLabels[d.key] || d.key}</span> <strong>${formatter(d.data[d.key])}</strong>
            </span>
        </div>`
    }

    let total = 0
    if (!row) return null
    return `<div class="c-visualizations__tooltipWrap">
    <span class="text-muted">${title}</span>
    <br>${Object.values(colors)
        .map(({ color, label, key, value }) => {
            total += row[key] || 0
            return `<span><span class="c-visualizations__itemCol" style="background-color: ${color};"></span>
            ${label}: <strong>${formatter(row[key])}</strong></span>`
        })
        .join('<br>')}
        <br>Total: <strong>${formatter(total)}</strong>
    </div>`
}

const subGroupLabels = {
    uuid_api: 'UUID API',
    search_api: 'Search API',
    entity_api: 'Entity API'
}
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

                        const chartData = []
                        for (const d of data) {
                            formattedData[d.time_bucket] = {
                                ...(formattedData[d.time_bucket] || {}),
                                ...d,
                                group: d.time_bucket
                            }
                            for (const group of Object.keys(subGroupLabels)) {
                                if (d[group] !== undefined) {
                                    chartData.push({
                                        ...d,
                                        group: new Date(d.time_bucket),
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
                                        row: formattedData[d.group],
                                        subGroupLabels,
                                        formatter: formatNum,
                                        title: new Date(d.group).toDateString()
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
                                        <strong>Why this view:</strong> daily
                                        resolution shows load spikes and outages
                                        that monthly totals hide, and separates
                                        the three services, which scale and fail
                                        independently.
                                    </small>
                                }
                            />
                        )
                    }}
                />
            )
        },
        {
            component: (
                <div className='row mt-2'>
                    <div className='col-md-6'>
                        <DetailSuspence
                            key='monthly-requests-by-api'
                            suspenseBlockStyle={true}
                            query={SQL.apiRequests.monthly({ from, to })}
                            buildCallback={(rawData) => {
                                const data = dataToArrayofObjects(rawData)

                                const formattedData = {}

                                const chartData = []
                                for (const d of data) {
                                    formattedData[d.time_bucket] = {
                                        ...(formattedData[d.time_bucket] || {}),
                                        ...d,
                                        group: d.time_bucket
                                    }
                                }
                                const _onBuildToolTip = (id, e, d) => {
                                    const dateString = typeof d === "string" ? d : d.data.group
                                    return onBuildToolTip(id, e, d, {
                                        row: formattedData[dateString],
                                        subGroupLabels,
                                        formatter: formatNum,
                                        title: formatAxisDate(dateString, true)
                                    })
                                }
                                const config = [
                                    {
                                        label: 'Requests',
                                        value: 'requests',
                                        chartType: 'StackedColumn',
                                        providerProps: {
                                            onBuildToolTip: _onBuildToolTip
                                        },
                                        config: {
                                            data: Object.values(formattedData),
                                            xAxis: {
                                                formatter: (v, i) =>
                                                    formatAxisDate(v, i == 0)
                                            },
                                            yAxis: {               
                                                formatter: (v, i) => formatNum(v)
                                            },
                                            legendLayout: 'flex',
                                            subGroupLabels
                                        }
                                    },
                                    {
                                        label: 'Client IPs',
                                        value: 'clients',
                                        chartType: 'Column',

                                        config: {
                                            data: data.map((d) => ({
                                                id: d.time_bucket,
                                                label: d.time_bucket,
                                                value: d.clients,
                                                data: d
                                            })),
                                            style: {
                                                monoColor:
                                                    THEME.visualizations
                                                        .defaultFill,
                                                valueFormatter: ({ d, v }) => {
                                                    return formatNum(v)
                                                }
                                            },
                                            yAxis: {
                                                formatter: (v, i) => formatNum(v)
                                            },
                                            xAxis: {
                                                formatter: (v, i) =>
                                                    formatAxisDate(v, i == 0)
                                            }
                                        }
                                    },
                                    {
                                        label: 'Entities',
                                        value: 'entities',
                                        chartType: 'Column',

                                        config: {
                                            data: data.map((d) => ({
                                                id: d.time_bucket,
                                                label: d.time_bucket,
                                                value: d.entities,
                                                data: d
                                            })),
                                            style: {
                                                monoColor:
                                                    THEME.visualizations
                                                        .defaultFill,
                                                valueFormatter: ({ d, v }) => {
                                                    return formatNum(v)
                                                }
                                            },
                                            yAxis: {
                                                formatter: (v, i) => formatNum(v)
                                            },
                                            xAxis: {
                                                formatter: (v, i) =>
                                                    formatAxisDate(v, i == 0)
                                            }
                                        }
                                    }
                                ]

                                return (
                                    <TabChartCard
                                        title='Monthly requests by API'
                                        chartType='StackedColumn'
                                        subTitle={`Monthly requests by API From ${from} to ${to}`}
                                        data={config}
                                        footer={
                                            <small>
                                                <strong>Why this view:</strong>{' '}
                                                the month-level trend for
                                                reporting, with reach (distinct
                                                clients) and breadth (distinct
                                                entities) next to raw volume.
                                            </small>
                                        }
                                    />
                                )
                            }}
                        />
                    </div>
                    <div className='col-md-6'>
                        <DetailSuspence
                            key='requests-per-response-code'
                            suspenseBlockStyle={true}
                            query={SQL.apiRequests.requestsPerResponseCode({ from, to })}
                            buildCallback={(rawData) => {
                                const data = dataToArrayofObjects(rawData)

                                const config = {
                                  
                                    optionsMenu: {
                                        logScale: {
                                            checked: true
                                        }
                                    },
                                    data: data.map(
                                        (d) => ({
                                            id: d.response_code.toString(),
                                            label: d.response_code,
                                            value: d.requests,
                                            data: d
                                        })
                                    ),
                                    xAxis: {
                                        scaleLog: true,
                                        formatter: (v, i) => formatNum(v)
                                    },
                                    
                                    style: {
                                        margin: {left: 0, top: 20, right: 0, bottom: 50},
                                        valueFormatter: ({ d, v }) => {
                                            return formatNum(v)
                                        },
                                        legendKey: (d) => {
                                            return d.label?.toString()[0] + 'xx'
                                        },
                                        legendLabel: (d) => {
                                          return d.label?.toString()[0] + 'xx'
                                        },
                                        legendValue: ({ d, v, data }) => {
                                          const firstDigit = d.label?.toString()[0]
                                          const totalForCode = data.filter((item) => item.label?.toString()[0] === firstDigit).reduce((acc, item) => acc + item.value, 0)
                                          return formatNum(totalForCode)
                                        },
                                        valueFormatter: ({ d, v }) => {
                                          
                                            return formatNum(v)
                                        },
                                        xAxisFormatter: (v, i) => {
                                            return formatNum(v)
                                        },
                                        colorMethods: {
                                          codes: (label) => {
                                            const firstDigit = label.toString()[0]
                                            
                                            switch (firstDigit) {
                                              case '2':
                                                return THEME.visualizations.swatch.success
                                              case '3':
                                                return THEME.visualizations.defaultFill
                                              case '4':
                                                return THEME.visualizations.swatch.warning
                                              case '5':
                                                return THEME.visualizations.swatch.danger
                                              default:
                                                return THEME.visualizations.defaultFill
                                            }
                                           }
                                        },
                                        colorMethodKey: 'codes'
                                    },
                                    legendLayout: 'flex',
                                }

                                return (
                                    <BasicCard
                                        key='requests-per-response-code'
                                        title='Response codes'
                                        subTitle={`Requests by HTTP status code, all time, log scale so rare codes stay visible. From ${from} to ${to}`}
                                        data={config}
                                        chartType='Bar'
                                        footer={
                                            <small>
                                                <strong>Why this view:</strong>{' '}
                                                401 and 403 show authorization friction; 307 and 303 show redirect use; 429 shows rate limiting.
                                            </small>
                                        }
                                    />
                                )
                            }}
                        />
                    </div>
                </div>
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
