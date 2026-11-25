import React, { memo, useState, useEffect, useContext, useRef } from 'react'
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
    formatPerc,
    getHeadersWith,
    callService
} from '@/lib/helpers/general'
import BasicCard from './BasicCard'
import TableCard from './TableCard'
import dayjs from 'dayjs'
import InbarCell from './InbarCell'
import UsageContext from '@/context/UsageContext'
import URLS from '@/lib/helpers/urls'
import AppContext from '@/context/AppContext'
import UI_BLOCKS from '@/lib/helpers/uiBlocks'

const onBuildToolTip = (id, e, d, { subGroupLabels, row, formatter, title }) => {
    return UI_BLOCKS.visualizations.onBuildToolTip(id, e, d, {subGroupLabels, row, formatter, title})
}

const subGroupLabels = {
    uuid_api: 'UUID API',
    search_api: 'Search API',
    entity_api: 'Entity API'
}

const localhost = 'http://localhost:3001/api/fixtures'
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
                                        title: !e.stacked
                                            ? formatAxisDate(d.data.group, true)
                                            : new Date(d.group).toDateString()
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
                <div className='row mt-2' key='monthly-requests-by-api--requests-per-response-code'>
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
                                    const dateString =
                                        typeof d === 'string' ? d : d.data.group
                                    return onBuildToolTip(id, e, d, {
                                        row: formattedData[dateString],
                                        subGroupLabels,
                                        formatter: formatNum,
                                        title: !e.stacked
                                            ? formatAxisDate(d.data.group, true)
                                            : formatAxisDate(dateString, true)
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
                                                formatter: (v, i) =>
                                                    formatNum(v)
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
                                                formatter: (v, i) =>
                                                    formatNum(v)
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
                                                formatter: (v, i) =>
                                                    formatNum(v)
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
                            query={SQL.apiRequests.requestsPerResponseCode({
                                from,
                                to
                            })}
                            buildCallback={(rawData) => {
                                const data = dataToArrayofObjects(rawData)

                                const config = {
                                    optionsMenu: {
                                        logScale: {
                                            checked: true
                                        }
                                    },
                                    data: data.map((d) => ({
                                        id: d.response_code.toString(),
                                        label: d.response_code,
                                        value: d.requests,
                                        data: d
                                    })),
                                    xAxis: {
                                        scaleLog: true,
                                        formatter: (v, i) => formatNum(v)
                                    },

                                    style: {
                                        margin: {
                                            left: 0,
                                            top: 20,
                                            right: 0,
                                            bottom: 50
                                        },
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
                                            const firstDigit =
                                                d.label?.toString()[0]
                                            const totalForCode = data
                                                .filter(
                                                    (item) =>
                                                        item.label?.toString()[0] ===
                                                        firstDigit
                                                )
                                                .reduce(
                                                    (acc, item) =>
                                                        acc + item.value,
                                                    0
                                                )
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
                                                const firstDigit =
                                                    label.toString()[0]

                                                switch (firstDigit) {
                                                    case '2':
                                                        return THEME
                                                            .visualizations
                                                            .swatch.success
                                                    case '3':
                                                        return THEME
                                                            .visualizations
                                                            .defaultFill
                                                    case '4':
                                                        return THEME
                                                            .visualizations
                                                            .swatch.warning
                                                    case '5':
                                                        return THEME
                                                            .visualizations
                                                            .swatch.danger
                                                    default:
                                                        return THEME
                                                            .visualizations
                                                            .defaultFill
                                                }
                                            }
                                        },
                                        colorMethodKey: 'codes'
                                    },
                                    legendLayout: 'flex'
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
                                                401 and 403 show authorization
                                                friction; 307 and 303 show
                                                redirect use; 429 shows rate
                                                limiting.
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
                                value: 'when-requests-happen-clients',
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
                                value: 'when-requests-happen-requests',
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
                            }
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
                                        <strong>Why this view:</strong> people
                                        cluster in working hours; scripted load
                                        runs around the clock. Useful for
                                        picking maintenance windows.
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
    return [
        {
            component: (
                <DetailSuspence
                    key='endpoint-traffic'
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
                                render: (text) => (
                                    <InbarCell
                                        text={formatNum(text)}
                                        value={text}
                                    />
                                )
                            },

                            {
                                title: 'Share',
                                dataIndex: 'share',
                                key: 'share',
                                render: (v) => (
                                    <span>{(v * 100).toFixed(2)}%</span>
                                )
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
                                margin: { top: 0, left: 40 },
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
                                        <strong>Why this view:</strong> shows
                                        user activity patterns and identifies
                                        trends in user engagement over time.
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
                    key='most-requested-entities'
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
                                render: (text) => (
                                    <InbarCell
                                        text={formatNum(text)}
                                        value={text}
                                    />
                                )
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
                            }
                        ]
                        return (
                            <TableCard
                                data={data}
                                columns={columns}
                                title='Most requested datasets'
                                footer={
                                    <small>
                                        <strong>Why this view:</strong> shows
                                        which datasets people look up through
                                        the API, which can be compared with what
                                        they download.
                                    </small>
                                }
                                subTitle={`Top 50 datasets by distinct client IPs, all time. Publications, their ancillary datasets, uploads and other entity types are left out. ID and type come from the file download table. From ${from} to ${to}`}
                            />
                        )
                    }}
                />
            )
        }
    ]
}

const clientsAndUsersCharts = (from, to) => {
    return [
        {
            component: (
                <DetailSuspence
                    key='client-types'
                    suspenseBlockStyle={true}
                    query={SQL.apiRequests.clientTypes({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)
                        const columns = [
                            {
                                title: 'Client type',
                                dataIndex: 'client_type',
                                key: 'client_type',
                                sorter: (a, b) =>
                                    a.client_type.localeCompare(b.client_type)
                            },
                            {
                                title: 'Requests',
                                dataIndex: 'requests',
                                key: 'requests',
                                minWidth: '120px',
                                sorter: (a, b) => a.requests - b.requests,
                                render: (text) => (
                                    <InbarCell
                                        text={formatNum(text)}
                                        value={text}
                                        category='requests'
                                    />
                                )
                            },
                            {
                                title: 'Client IPs',
                                dataIndex: 'clients',
                                key: 'clients',
                                minWidth: '120px',
                                sorter: (a, b) => a.clients - b.clients,
                                render: (text) => (
                                    <InbarCell
                                        text={formatNum(text)}
                                        value={text}
                                        category='clients'
                                        style={{ backgroundColor: 'green' }}
                                    />
                                )
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
                            }
                        ]
                        return (
                            <TableCard
                                key='client-types'
                                data={data}
                                columns={columns}
                                title='Client types'
                                footer={
                                    <small>
                                        <strong>Why this view:</strong>{' '}
                                        programmatic use is the API's purpose,
                                        so scripted traffic is the core
                                        audience. Browsers have far more
                                        distinct clients but few calls each;
                                        bots are load without users..
                                    </small>
                                }
                                subTitle={`Grouped from the user agent string: Python scripts (requests, urllib), other tools (R httr2, curl), web browsers, crawlers and bots, and uptime monitoring. From ${from} to ${to}`}
                            />
                        )
                    }}
                />
            )
        },
        {
            component: (
                <div className='row mt-2' key='signed-in-vs-anonymous--requests-by-countries'>
                    <div className='col-md-6'>
                        <DetailSuspence
                            key='signed-in-vs-anonymous'
                            suspenseBlockStyle={true}
                            hostUrl={localhost}
                            query={SQL.apiRequests.signedInStatus({ from, to })}
                            buildCallback={(rawData) => {
                                // TODO use real api
                                const list = rawData //dataToArrayofObjects(rawData)
                                const data = []
                                let timeBucket
                                for (const item of list) {
                                    const date = new Date(
                                        item.time_bucket.micros  / 1000
                                    )
                                
                                    timeBucket = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01T00:00:00`
                                    data.push({
                                        time_bucket: timeBucket, //item.time_bucket
                                        type: 'is_anonymous',
                                        count: item.is_anonymous,
                                        label: 'Anonymous'
                                    })
                                    data.push({
                                        time_bucket: timeBucket, //item.time_bucket
                                        type: 'is_signed_in',
                                        count: item.is_signed_in,
                                        label: 'Signed in'
                                    })
                                }

                                const formattedData = {}
                                const subGroupLabels = {}
                                for (const d of data) {
                                    formattedData[d.time_bucket] = {
                                        ...(formattedData[d.time_bucket] || {}),
                                        [d.type]: d.count
                                    }
                                    subGroupLabels[d.type] = d.label
                                }
                                const config = {
                                    providerProps: {
                                        onBuildToolTip: (id, e, d) => {
                                            return onBuildToolTip(id, e, d, {
                                                row:
                                                    formattedData[d] ||
                                                    formattedData[d.data.group],
                                                subGroupLabels,
                                                title: !e.stacked
                                                ? formatAxisDate(d.data.group, true)
                                                : formatAxisDate(d, true),
                                                formatter: formatNum
                                            })
                                        }
                                    },
                                    data: Object.keys(formattedData).map(
                                        (time_bucket) => ({
                                            id: time_bucket,
                                            group: time_bucket,
                                            ...formattedData[time_bucket]
                                        })
                                    ),
                                    yAxis: {
                                        // scaleLog: true,
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
                                        key='signed-in-vs-anonymous'
                                        title='Signed-in vs anonymous requests'
                                        subTitle={`Requests per month made with or without a user token. From ${from} to ${to}`}
                                        data={config}
                                        chartType='StackedColumn'
                                        footer={
                                            <small>
                                                <strong>Why this view:</strong>{' '}
                                                401 and 403 show authorization
                                                friction; 307 and 303 show
                                                redirect use; 429 shows rate
                                                limiting.
                                            </small>
                                        }
                                    />
                                )
                            }}
                        />
                    </div>
                    <div className='col-md-6'>
                        <DetailSuspence
                            key='requests-by-countries'
                            suspenseBlockStyle={true}
                            hostUrl={localhost}
                            query={SQL.apiRequests.countries({ from, to })}
                            buildCallback={(rawData) => {
                                //const data = dataToArrayofObjects(rawData)
                                const data = rawData

                                const formattedData = {}

                                for (const d of data) {
                                    formattedData[d.country_name] = {
                                        ...(formattedData[d.country_name] ||
                                            {}),
                                        ...d,
                                        group: d.country_name
                                    }
                                }
                                const _onBuildToolTip = (id, e, d, { label, value }) => {
                                    return `<div class="c-visualizations__tooltipWrap">
                                        <strong>${d.data.country_name}</strong> <br>
                                        <span>${formatNum(d.data.requests)} requests</span> <br>
                                        <span>${formatNum(d.data.clients)} clients</span> <br>
                                        <span>${formatNum(d.data.users)} users</span>
                                        
                                    </div>`
                                }
                                const sharedProps = {
                                    style: {
                                        margin: {left: 0},
                                        monoColor:
                                            THEME.visualizations
                                                .defaultFill,
                                        valueFormatter: ({ d, v }) => {
                                            return formatNum(v)
                                        }
                                    },
                                    xAxis: {
                                        formatter: (v, i) =>
                                            formatNum(v)
                                    }
                                }
                                const config = [
                                    {
                                        label: 'Requests',
                                        value: 'requests-by-countries-requests',
                                        providerProps: {
                                            onBuildToolTip: _onBuildToolTip
                                        },
                                        config: {
                                            data: data.map((d) => ({
                                                id: d.country_name,
                                                label: d.country_name,
                                                value: d.requests,
                                                data: d
                                            })),

                                            ...sharedProps
                                        }
                                    },
                                    {
                                        label: 'Client IPs',
                                        value: 'requests-by-countries-clients',
                                        config: {
                                            data: data.map((d) => ({
                                                id: d.country_name,
                                                label: d.country_name,
                                                value: d.clients,
                                                data: d
                                            })),
                                            ...sharedProps
                                        }
                                    },
                                    {
                                        label: 'Users',
                                        value: 'requests-by-countries-users',
                                        config: {
                                            data: data.map((d) => ({
                                                id: d.country_name,
                                                label: d.country_name,
                                                value: d.users,
                                                data: d
                                            })),
                                            ...sharedProps
                                        }
                                    }
                                ]

                                return (
                                    <TabChartCard
                                        title='Countries'
                                        chartType='Bar'
                                        subTitle={`Request origin by client IP location. From ${from} to ${to}`}
                                        data={config}
                                        footer={
                                            <small>
                                                <strong>Why this view:</strong>{' '}
                                                international reach; client IPs
                                                are a better reach measure than
                                                requests, which a single script
                                                can inflate.
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
                    key="top-cities"
                    suspenseBlockStyle={true}
                    query={SQL.apiRequests.topCities({ from, to })}
                    hostUrl={localhost}
                    buildCallback={(rawData) => {
                        const data = rawData // dataToArrayofObjects(rawData)
                        const columns = [
                            {
                                title: 'City',
                                dataIndex: 'city_name',
                                key: 'city_name'
                            },
                            {
                                title: 'Region',
                                dataIndex: 'region_name',
                                key: 'region_name'
                            },
                            {
                                title: 'Country',
                                dataIndex: 'country_name',
                                key: 'country_name'
                            },
                            {
                                title: 'Requests',
                                dataIndex: 'requests',
                                key: 'requests',
                                minWidth: '150px',
                                render: (text) => <InbarCell text={text} />
                            },
                            {
                                title: 'Client IPs',
                                dataIndex: 'clients',
                                key: 'clients'
                            },
                            {
                                title: 'Users',
                                dataIndex: 'users',
                                key: 'users'
                            },
                            
                        ]
                        return (
                            <TableCard
                                data={data}
                                columns={columns}
                                title='Cities'
                                subTitle={`Request origin by city. From ${from} to ${to}`}
                            />
                        )
                    }}
                />
            )
            
        },
        {
            component: (
                <DetailSuspence
                    key="requests-on-a-map"
                    suspenseBlockStyle={true}
                    hostUrl={localhost}
                    query={SQL.apiRequests.topCities({ from, to })}
                    buildCallback={(rawData) => {
                        const data = rawData //dataToArrayofObjects(rawData)
                        const onBuildToolTip = (id, e, d) => {
                            return `<div>
                                <span>${d.data.city}, ${d.data.region}, ${d.data.country}</span> <br>
                                <span>${formatNum(d.data.requests)}</span> <br>
                                <span>${formatNum(d.data.clients)} files</span> <br>
                                <span>${formatNum(d.data.users)} users</span>
                                
                            </div>`
                        }
                        const config = [
                            {
                                label: 'United States',
                                value: 'unitedStates',
                                chartType: 'USA',
                                providerProps: {
                                    onBuildToolTip
                                },
                                config: {
                                    data: data.filter((d) => d.country_name === 'United States of America').map((d) => ({
                                        id: d.city_name,
                                        label: d.city_name,
                                        value: d.requests,
                                        data: {...d, city: d.city_name, country: d.country_name, region: d.region_name}
                                    })),
                                }
                            },
                            {
                                label: 'World',
                                value: 'world',
                                chartType: 'World',
                                providerProps: {
                                    onBuildToolTip
                                },
                                config: {
                                    data: data.map((d) => ({
                                        id: d.country,
                                        label: d.country,
                                        value: d.requests,
                                        data: {...d, city: d.city_name, country: d.country_name, region: d.region_name}
                                    })),
                                    style: {
                                        valueFormatter: ({ d, v }) => {
                                            return formatNum(v)
                                        }
                                    },
                                }
                            }
                        ]
                        return (
                            <TabChartCard
                                title='Requests on a map'
                                subTitle={`Each circle is a city; its area shows requests, all time. Hover for client IPs and users. From ${from} to ${to}`}
                                data={config}
                                chartType='Column'
                                footer={
                                    <small>
                                        <strong>Why this view:</strong>{' '}
                                        shows where demand clusters at a glance, including the regions that a country ranking flattens (US coasts versus the Midwest, or Europe as a whole).
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

const ApiRequests = memo(({ from, to }) => {
    const { getIpDetails } = useContext(UsageContext)
    const { globusToken } = useContext(AppContext)
    const inserted = useRef(false)

    const fetchClientIps = async () => {
        const url = URLS.ingest.analytics.query()

        const headers = getHeadersWith(globusToken).headers
        const query = 'SELECT * from api_usage LIMIT 300 OFFSET 600'
        const response = await callService(url, headers, { query }, 'POST')
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
        const ips = {}
        if (response.status == 200) {
            const data = dataToArrayofObjects(response.data)
            let details = {}
            let id = 800
            const users = [
                {
                    user: 'etsou2@johnshopkins.edu',
                    user_domain: 'johnshopkins.edu',
                    user_tld: 'johnshopkins.edu'
                },
                {
                    user: 'james@johnshopkins.edu',
                    user_domain: 'johnshopkins.edu',
                    user_tld: 'johnshopkins.edu'
                },
                {
                    user: 'jane@pitt.edu',
                    user_domain: 'pitt.edu',
                    user_tld: 'pitt.edu'
                },
                {
                    user: 'brendan@psc.edu',
                    user_domain: 'psc.edu',
                    user_tld: 'psc.edu'
                }
            ]
            for (const d of data) {
                if (d.client_ip) {
                    let ipDetails = ips[d.client_ip]
                    if (!ipDetails) {
                        ipDetails = await getIpDetails(d.client_ip)
                        ips[d.client_ip] = ipDetails
                    }

                    // Get a random index (0 to 3)
                    const randomIndex = Math.floor(Math.random() * users.length)

                    details = { id, ...d, ...ipDetails, ...users[randomIndex] }
                    await sleep(2000)
                    await callService(localhost, headers, details, 'PUT')
                    id++
                }
            }
            inserted.current = true
        }
    }

    useEffect(() => {
        // if (!inserted.current) {
        //     fetchClientIps()
        // }
    }, [])

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
