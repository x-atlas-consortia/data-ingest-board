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
    dataToArrayofObjects,
    formatPerc
} from '@/lib/helpers/general'
import BasicCard from './BasicCard'
import TableCard from './TableCard'
import dayjs from 'dayjs';
import InbarCell from './InbarCell'

const onBuildToolTip = (id, e, d, { subGroupLabels, row, formatter, title }) => {
    const colors = e.colors

    if (!e.stacked) {
        return `<div class="c-visualizations__tooltipWrap">
            <span class="text-muted">${title}</span>
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
                                        title: !e.stacked ? formatAxisDate(d.data.group, true) : new Date(d.group).toDateString()
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
                                        title: !e.stacked ? formatAxisDate(d.data.group, true) : formatAxisDate(dateString, true)
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
        },
        {
            component: (
                <DetailSuspence
                    key='when-requests-happen'
                    suspenseBlockStyle={true}
                    query={SQL.apiRequests.requestsByTimeOfDay({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)
                        const formatting = {
                            yAxis: {
                                formatter: (v, i) =>
                                    dayjs().day(v).format('ddd')
                            },
                            xAxis: {
                                formatter: (v, i) =>
                                    v.toString().padStart(2, '0') + ':00'
                            }
                        }
                        const config = [
                            {
                                label: 'Distinct client IPs',
                                value: 'clients',
                                optionsMenu: {
                                    logScale: {
                                        checked: true
                                    }
                                },
                                providerProps: {
                                    onBuildToolTip: (id, e, d) => {
                                        return `<span class="text-muted">${formatAxisDate(
                                            d.label,
                                            true
                                        )}</span><br><strong>${formatBytes(d.value)}</strong>`
                                    }
                                },
                                config: {
                                    data: data.map((d) => ({
                                        id: d.dow,
                                        group: d.hour.toString(),
                                        yGroup: d.dow.toString(),
                                        value: d.clients,
                                        data: d
                                    })),
                                    ...formatting
                                }
                            },
                            {
                                label: 'Requests',
                                value: 'requests',
                                optionsMenu: {
                                    logScale: {
                                        checked: true
                                    }
                                },
                              
                                config: {
                                    data: data.map((d) => ({
                                        id: d.dow,
                                        group: d.hour.toString(),
                                        yGroup: d.dow.toString(),
                                        value: d.requests,
                                        data: d
                                    })),
                                    ...formatting
                                }
                            },
                            
                          ]

                        return (
                            <TabChartCard
                                key='when-requests-happen'
                                chartType='Heatmap'
                                title='When requests happen'
                                subTitle={`Day of week by hour of day, UTC, ${from} – ${to}.`}
                                data={config}
                                footer={
                                    <small>
                                        <strong>Why this view:</strong> people cluster in working hours; scripted load runs around the clock. Useful for picking maintenance windows.
                                    </small>
                                }
                            />
                        )
                    }}
                />
            )
        },
    ]
}

const endpointsCharts = (from, to) => {
    return [
              {
            component: (
                <DetailSuspence
                    key="endpoint-traffic"
                    suspenseBlockStyle={true}
                    query={SQL.apiRequests.endpoints({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)
                        const columns = [
                            {
                                title: 'API',
                                dataIndex: 'host',
                                key: 'host'
                            },
                            {
                                title: 'Method',
                                dataIndex: 'http_method',
                                key: 'http_method'
                            },
                            {
                                title: 'Endpoint',
                                dataIndex: 'endpoint',
                                key: 'endpoint',
                                minWidth: '200px',
                                render: (text) => <code>{text}</code>
                            },
                            {
                                title: 'Requests',
                                dataIndex: 'requests',
                                key: 'requests',
                                minWidth: '120px',
                                render: (text) => <InbarCell text={formatNum(text)} value={text} />
                            },
                            
                            {
                                title: 'Share',
                                dataIndex: 'share',
                                key: 'share',
                                render: (v) => <span>{(v * 100).toFixed(2)}%</span>
                            },
                            {
                                title: 'Client IPs',
                                dataIndex: 'clients',
                                key: 'clients',
                                render: (v) => <span>{formatNum(v)}</span>
                            },
                            {
                                title: 'Entities',
                                dataIndex: 'entities',
                                key: 'entities',
                                render: (v) => <span>{formatNum(v)}</span>
                            },
                            {
                                title: '4xx',
                                dataIndex: 'rate_4xx',
                                key: 'rate_4xx',
                                render: (v) => <span>{formatPerc(v)}</span>
                            },
                            {
                                title: '5xx',
                                dataIndex: 'rate_5xx',
                                key: 'rate_5xx',
                                render: (v) => <span>{formatPerc(v)}</span>
                            },
                            {
                                title: 'Last Call',
                                dataIndex: 'last_call',
                                key: 'last_call'
                            }
                        ]
                        return (
                            <TableCard
                                data={data}
                                columns={columns}
                                title='Endpoints'
                                subTitle={`Top 80 host, method and endpoint pattern combinations by requests, all time. Path variables are shown as patterns such as {id}; (unmatched) means no pattern was recorded. From ${from} to ${to}`}
                            />
                        )
                    }}
                />
            )
        },
        {
          component: (
            <DetailSuspence
                            key='http-methods'
                            suspenseBlockStyle={true}
                            query={SQL.apiRequests.httpMethods({ from, to })}
                            buildCallback={(rawData) => {
                                const data = dataToArrayofObjects(rawData)
                                
                                const formattedData = {}
                                for (const d of data) {
                                    formattedData[d.http_method] = {
                                        ...(formattedData[d.http_method] || {}),
                                        group: d.http_method,
                                        value: d.requests,
                                        ...d
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
                                                formatter: formatNum,
                                                title: !e.stacked ? d.data.group : d
                                            })
                                        }
                                    },
                                    optionsMenu: {
                                        logScale: {
                                            checked: false
                                        }
                                    },
                                    data: Object.values(formattedData),
                                    
                                    xAxis: {
                                        scaleLog: true,
                                        formatter: (v, i) => formatNum(v)
                                    },
                                    style: {
                                        margin: {top: 0, left: 40},
                                        valueFormatter: ({ d, v }) => {
                                            return formatNum(v)
                                        }
                                    },
                                    legendLayout: 'flex',
                                    subGroupLabels
                                }

                                return (
                                    <BasicCard
                                        key='http-methods'
                                        title='HTTP methods'
                                        subTitle={`Tracking user engagement and retention. From ${from} to ${to}`}
                                        data={config}
                                        chartType='StackedBar'
                                        footer={
                                            <small>
                                                <strong>Why this view:</strong>{' '}
                                                shows user activity patterns and
                                                identifies trends in user
                                                engagement over time.
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
                <DetailSuspence
                    key="most-requested-entities"
                    suspenseBlockStyle={true}
                    query={SQL.apiRequests.mostRequestedEntities({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)
                        const columns = [
                            {
                                title: 'ID',
                                dataIndex: 'application_id',
                                key: 'application_id'
                            },
                            {
                                title: 'Type',
                                dataIndex: 'dataset_type',
                                key: 'dataset_type'
                            },
                            {
                                title: 'Client IPs',
                                dataIndex: 'clients',
                                key: 'clients',
                                minWidth: '120px',
                                render: (text) => <InbarCell text={formatNum(text)} value={text} />
                            },
                            
                            {
                                title: 'Requests',
                                dataIndex: 'requests',
                                key: 'requests',
                                render: (v) => <span>{formatNum(v)}</span>
                            },
                            
                            {
                                title: 'Endpoints',
                                dataIndex: 'endpoints',
                                key: 'endpoints',
                                render: (v) => <span>{formatNum(v)}</span>
                            },
                          
                        ]
                        return (
                            <TableCard
                                data={data}
                                columns={columns}
                                title='Most requested datasets'
                                footer={<small><strong>Why this view:</strong> shows which datasets people look up through the API, which can be compared with what they download.</small>}
                                subTitle={`Top 50 datasets by distinct client IPs, all time. Publications, their ancillary datasets, uploads and other entity types are left out. ID and type come from the file download table. From ${from} to ${to}`}
                            />
                        )
                    }}
                />
            )
        },
    ]
}

const clientsAndUsersCharts = (from, to) => {
    return [
       {
            component: (
                <DetailSuspence
                    key="client-types"
                    suspenseBlockStyle={true}
                    query={SQL.apiRequests.clientTypes({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)
                        const columns = [
                            {
                                title: 'Client type',
                                dataIndex: 'client_type',
                                key: 'client_type',
                                sorter: (a, b) => a.client_type.localeCompare(b.client_type)
                            },
                            {
                                title: 'Requests',
                                dataIndex: 'requests',
                                key: 'requests',
                                minWidth: '120px',
                                sorter: (a, b) => a.requests - b.requests,
                                render: (text) => <InbarCell text={formatNum(text)} value={text} category='requests' />
                            },
                            {
                                title: 'Client IPs',
                                dataIndex: 'clients',
                                key: 'clients',
                                minWidth: '120px',
                                sorter: (a, b) => a.clients - b.clients,
                                render: (text) => <InbarCell text={formatNum(text)} value={text} category='clients' style={{backgroundColor: 'green'}} />
                            },
                            {
                                title: 'User agents',
                                dataIndex: 'agents',
                                key: 'agents'
                            },
                            {
                                title: 'Search API',
                                dataIndex: 'search_api',
                                key: 'search_api',
                                sorter: (a, b) => a.search_api - b.search_api,
                                render: (v) => <span>{formatNum(v)}</span>
                            },
                            
                            {
                                title: 'Entity API',
                                dataIndex: 'entity_api',
                                key: 'entity_api',
                                sorter: (a, b) => a.entity_api - b.entity_api,
                                render: (v) => <span>{formatNum(v)}</span>
                            },
                            
                            {
                                title: 'UUID API',
                                dataIndex: 'uuid_api',
                                key: 'uuid_api',
                                sorter: (a, b) => a.uuid_api - b.uuid_api,
                                render: (v) => <span>{formatNum(v)}</span>
                            },
                            {
                                title: 'Error rate',
                                dataIndex: 'error_rate',
                                key: 'error_rate',
                                sorter: (a, b) => a.error_rate - b.error_rate,
                                render: (v) => <span>{formatPerc(v)}</span>
                            },
                          
                        ]
                        return (
                            <TableCard
                                data={data}
                                columns={columns}
                                title='Client types'
                                footer={<small><strong>Why this view:</strong> programmatic use is the API's purpose, so scripted traffic is the core audience. Browsers have far more distinct clients but few calls each; bots are load without users..</small>}
                                subTitle={`Grouped from the user agent string: Python scripts (requests, urllib), other tools (R httr2, curl), web browsers, crawlers and bots, and uptime monitoring. From ${from} to ${to}`}
                            />
                        )
                    }}
                />
            )
        },
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
