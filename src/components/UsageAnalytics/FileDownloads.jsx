import React, { memo, useState } from 'react'
import { Tabs } from 'antd'
import DetailSuspence from '@/components/DetailSuspence'
import SQL from '@/lib/helpers/sql'
import TabChartCard from './TabChartCard'
import {
    formatBytes,
    formatNum,
    formatAxisDate,
    dataToArrayofObjects
} from '@/lib/helpers/general'
import BasicCard from './BasicCard'
import TableCard from './TableCard'

const InbarCell = ({ text }) => {
    return (
        <span className='c-inbar'>
            <span className='js-inbar c-inbar__fill' data-value={text}></span>
            <span className='c-inbar__text'> {text}</span>
        </span>
    )
}

const onBuildToolTip = (id, e, d, { subGroupLabels, row, formatter }) => {
    debugger
    if (!e.fromTick) return `<div class="c-visualizations__tooltipWrap"><span class="text-muted">${formatAxisDate(
                                            d.data.group,
                                            true
                                        )}</span><br> <span>${subGroupLabels[d.key] || d.key}</span> <strong>${formatter(d.data[d.key])}</strong></div>`
    if (!e.colors) return null
    const colors = e.colors
    let total = 0
    return `<div class="c-visualizations__tooltipWrap"><span class="text-muted">${formatAxisDate(
        d,
        true
    )}</span><br>${Object.values(colors)
        .map(
            ({ color, label, key, value }) => {
                total += row[key] || 0
                return `<span><span class="c-visualizations__itemCol" style="background-color: ${color};"></span>${label}: <strong>${formatter(row[key])}</strong></span>`
            }
                
        )
        .join('<br>')}<br>Total: <strong>${formatter(total)}</strong></div>`
}

const downloadsCharts = (from, to) => {
    return [
        {
            component: (
                <DetailSuspence
                    suspenseBlockStyle={true}
                    query={[
                        SQL.fileDownloads.monthly({ from, to }),
                        SQL.fileDownloads.monthlyDatasetPullsTouched({
                            from,
                            to
                        })
                    ]}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData[0])
                        const datasetPullsTouchedData = dataToArrayofObjects(
                            rawData[1]
                        )
                        const config = [
                            {
                                label: 'Data transferred (TB)',
                                value: 'bytes',
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
                                        id: d.time_bucket,
                                        label: d.time_bucket,
                                        value: d.total_bytes_transferred
                                    })),
                                    style: {
                                        monoColor: '#2f6fb3',
                                        valueFormatter: ({ d, v }) => {
                                            return formatBytes(v)
                                        }
                                    },
                                    yAxis: {
                                        scaleLog: true,
                                        formatter: (v, i) => formatBytes(v)
                                    },
                                    xAxis: {
                                        formatter: (v, i) =>
                                            formatAxisDate(v, i == 0)
                                    }
                                }

                            },
                            {
                                label: 'Files',
                                value: 'files',
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
                                        )}</span><br> <strong>${formatNum(d.value)}</strong>`
                                    }
                                },
                                config: {
                                    data: data.map((d) => ({
                                        id: d.time_bucket,
                                        label: d.time_bucket,
                                        value: d.files
                                    })),
                                    style: {
                                        monoColor: '#2f6fb3',
                                        valueFormatter: ({ d, v }) => {
                                            return formatNum(v)
                                        }
                                    },
                                    yAxis: {
                                        scaleLog: true,
                                        formatter: (v, i) => formatNum(v)
                                    },
                                    xAxis: {
                                        formatter: (v, i) =>
                                            formatAxisDate(v, i == 0)
                                    }
                                }
                            },
                            {
                                label: 'Dataset pulls',
                                value: 'dataset_pulls',
                                footer: (
                                    <small>
                                        <strong>Dataset pulls:</strong> one user
                                        downloading any files from one dataset
                                        on one day counts as one pull, however
                                        many files that is. Monthly bars add up
                                        the pulls on each day of the month.
                                    </small>
                                ),
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
                                        )}</span><br> <strong>${formatNum(d.value)}</strong>`
                                    }
                                },
                                config: {
                                    data: datasetPullsTouchedData.map((d) => ({
                                        id: d.time_bucket,
                                        label: d.time_bucket,
                                        value: d.dataset_pulls
                                    })),
                                    style: {
                                        monoColor: '#2f6fb3',
                                        valueFormatter: ({ d, v }) => {
                                            return formatNum(v)
                                        }
                                    },
                                    yAxis: {
                                        scaleLog: true,
                                        formatter: (v, i) => formatNum(v)
                                    },
                                    xAxis: {
                                        formatter: (v, i) =>
                                            formatAxisDate(v, i == 0)
                                    }
                                }
                            },
                            {
                                label: 'Datasets touched',
                                value: 'datasets_touched',
                                footer: (
                                    <small>
                                        <strong>Datasets touched:</strong> the
                                        number of distinct datasets that had at
                                        least one file downloaded that month, by
                                        anyone.
                                    </small>
                                ),
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
                                        )}</span><br> <strong>${formatNum(d.value)}</strong>`
                                    }
                                },
                                config: {
                                    data: datasetPullsTouchedData.map((d) => ({
                                        id: d.time_bucket,
                                        label: d.time_bucket,
                                        value: d.datasets_touched
                                    })),
                                    style: {
                                        monoColor: '#2f6fb3',
                                        valueFormatter: ({ d, v }) => {
                                            return formatNum(v)
                                        }
                                    },
                                    yAxis: {
                                        scaleLog: true,
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
                                title='Monthly usage'
                                chartType='Column'
                                subTitle={`Pick a measure. From ${from} to ${to}`}
                                data={config}
                                footer={
                                    <small>
                                        <strong>Why this view:</strong> volume,
                                        file counts and pulls tell different
                                        stories. A single user syncing a CODEX
                                        dataset can add millions of files in one
                                        month, so a dataset pull, one user
                                        taking files from one dataset on one
                                        day, is a steadier measure of demand.
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
                            key='data-transferred-by-assay'
                            suspenseBlockStyle={true}
                            query={SQL.fileDownloads.perAssay({ from, to })}
                            buildCallback={(rawData) => {
                               
                                const data = dataToArrayofObjects(rawData)
                                
                                const formattedData = {}
                                const subGroupLabels = {}
                                for (const d of data) {
                                    formattedData[d.time_bucket] = {
                                        ...(formattedData[d.time_bucket] || {}),
                                        [d.assay]: d.total_bytes_transferred
                                    }
                                    subGroupLabels[d.assay] = d.assay
                                    
                                }
                                const config = {
                                    providerProps: {
                                        onBuildToolTip: (id, e, d) => {
                                            return onBuildToolTip(id, e, d, {row: formattedData[d] || formattedData[d.data.group], subGroupLabels, formatter: formatBytes})
                                        }
                                    },
                                    optionsMenu: {
                                        logScale: {
                                            checked: true
                                        }
                                    },
                                    data: Object.keys(formattedData).map((time_bucket) => ({
                                        id: time_bucket,
                                        group: time_bucket,
                                        ...formattedData[time_bucket]
                                    })),
                                    yAxis: {
                                        scaleLog: true,
                                        formatter: (v, i) => formatBytes(v)
                                    },
                                    xAxis: {
                                   
                                        formatter: (v, i) => formatAxisDate(v)
                                    },
                                    style: {
                                   
                                        valueFormatter: ({ d, v }) => {
                                            return formatBytes(v)
                                        }
                                    },
                                    legendLayout: 'flex',
                                    subGroupLabels,
                                }
                        
                                return (
                                    <BasicCard
                                        key='data-transferred-by-assay'
                                        chartType='StackedColumn'
                                        title='Data transferred by assay, per month'
                                        subTitle={`Dataset types grouped to their base assay (pipeline suffix removed). Seven largest by all-time volume, the rest as Other. NA is mostly uploads and publications. From ${from} to ${to}`}
                                        data={config}
                                        footer={
                                            <small>
                                                <strong>Why this view:</strong>{' '}
                                                shows which data modalities
                                                drive demand over time and when
                                                a new assay starts to be picked
                                                up.
                                            </small>
                                        }
                                    />
                                )
                            }}
                        />
                    </div>
                    <div className='col-md-6'>
                        <DetailSuspence
                            key='active-users-by-month'
                            suspenseBlockStyle={true}
                            query={SQL.fileDownloads.activeUsers({ from, to })}
                            buildCallback={(rawData) => {
                                const list = dataToArrayofObjects(rawData)
                                const data = []
                                for (const item of list) {
                                    data.push({
                                        time_bucket: item.time_bucket,
                                        type: 'new_users',
                                        count: item.new_users,
                                        label: 'New',
                                    })
                                    data.push({
                                        time_bucket: item.time_bucket,
                                        type: 'returning_users',
                                        count: item.returning_users,
                                        label: 'Returning',
                                    })
                                }

                                const formattedData = {}
                                const subGroupLabels = {}
                                for (const d of data) {
                                    formattedData[d.time_bucket] = {
                                        ...(formattedData[d.time_bucket] || {}),
                                        [d.type]: d.count,
                                    }
                                    subGroupLabels[d.type] = d.label
                                    
                                }
                                const config = {
                                    providerProps: {
                                        onBuildToolTip: (id, e, d) => {
                                            return onBuildToolTip(id, e, d, {row: formattedData[d] || formattedData[d.data.group], subGroupLabels, formatter: formatNum})
                                        }
                                    },
                                    // optionsMenu: {
                                    //     logScale: {
                                    //         checked: true
                                    //     }
                                    // },
                                    data: Object.keys(formattedData).map((time_bucket) => ({
                                        id: time_bucket,
                                        group: time_bucket,
                                        ...formattedData[time_bucket]
                                    })),
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
                                    subGroupLabels,
                                }
                        
                                return (
                                    <BasicCard
                                        key='active-users-by-month'
                                        title='Active Users by Month'
                                        subTitle={`Tracking user engagement and retention. From ${from} to ${to}`}
                                        data={config}
                                        chartType='StackedColumn'
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
                    </div>
                </div>
            )
        },
        {
            component: (
                <DetailSuspence
                    suspenseBlockStyle={true}
                    query={SQL.fileDownloads.datasetTypes({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)
                        const columns = [
                            {
                                title: 'Dataset type',
                                dataIndex: 'dataset_type',
                                key: 'dataset_type'
                            },
                            {
                                title: 'Assay',
                                dataIndex: 'assay',
                                key: 'assay'
                            },
                            {
                                title: 'TB',
                                dataIndex: 'terabytes',
                                key: 'terabytes',
                                minWidth: '150px',
                                render: (text) => (
                                    <InbarCell text={text} />
                                )
                            },
                            {
                                title: 'Files',
                                dataIndex: 'files',
                                key: 'files'
                            },
                            {
                                title: 'Users',
                                dataIndex: 'users',
                                key: 'users'
                            },
                            {
                                title: 'Datasets',
                                dataIndex: 'datasets',
                                key: 'datasets'
                            },
                            {
                                title: 'Median MB',
                                dataIndex: 'median_mb',
                                key: 'median_mb'
                            }
                        ]
                        return (
                            <TableCard
                                data={data}
                                columns={columns}
                                title='Dataset Types'
                                subTitle={`All time, one row per dataset type including pipeline. Median file size helps explain file-count vs volume differences. From ${from} to ${to}`}
                            />
                        )
                    }}
                />
            )
        },
        {
            component: (
                <DetailSuspence
                    suspenseBlockStyle={true}
                    query={SQL.fileDownloads.popularDatasets({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)
                        const columns = [
                            {
                                title: 'ID',
                                dataIndex: 'application_id',
                                key: 'application_id'
                            },
                            {
                                title: 'Dataset type',
                                dataIndex: 'dataset_type',
                                key: 'dataset_type'
                            },
                            {
                                title: 'Users',
                                dataIndex: 'users',
                                key: 'users',
                                render: (text) => (
                                    <span className='c-inbar'>
                                        <span
                                            className='js-inbar c-inbar__fill'
                                            data-value={text}
                                        ></span>
                                        <span className='c-inbar__text'>
                                            {' '}
                                            {text}
                                        </span>
                                    </span>
                                )
                            },
                            {
                                title: 'Orgs',
                                dataIndex: 'orgs',
                                key: 'orgs'
                            },

                            {
                                title: 'Files',
                                dataIndex: 'files',
                                key: 'files'
                            },

                            {
                                title: 'Unique files',
                                dataIndex: 'unique_files',
                                key: 'unique_files'
                            },
                            {
                                title: 'TB',
                                dataIndex: 'terabytes',
                                key: 'terabytes',
                                minWidth: '150px'
                            },
                            {
                                title: 'Last download',
                                dataIndex: 'last_download',
                                key: 'last_download'
                            }
                        ]
                        return (
                            <TableCard
                                data={data}
                                columns={columns}
                                title='Most widely used datasets'
                                subTitle={`Top 50 entities by distinct users. Unique files is the number of different files taken; the gap to Files shows repeat downloads. From ${from} to ${to}`}
                                footer={
                                    <small>
                                        <strong>Why this view:</strong> ranking
                                        by distinct users, rather than bytes,
                                        surfaces the datasets with the broadest
                                        community value. Good candidates for
                                        featuring or caching.
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

const locationsCharts = (from, to) => {
    return [
        {
            component: (
                <DetailSuspence
                    suspenseBlockStyle={true}
                    query={SQL.fileDownloads.locations({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData).filter(
                            (d) => d.total_bytes_transferred !== 0
                        )
                        const config = [
                            {
                                label: 'Data transferred (TB)',
                                value: 'bytes',
                                optionsMenu: {
                                    logScale: {
                                        checked: true
                                    }
                                },
                                config: {
                                    data: data.map((d) => ({
                                        id: d.country,
                                        label: d.country,
                                        value: d.total_bytes_transferred
                                    })),
                                    style: {
                                        valueFormatter: ({d, v}) => {
                                            return formatBytes(v)
                                        }
                                    },
                                    xAxis: {
                                        scaleLog: true,
                                        formatter: (v) => formatBytes(v)
                                    }
                                }
                            },
                            {
                                label: 'Users',
                                value: 'users',
                                config: {
                                    data: data.map((d) => ({
                                        id: d.country,
                                        label: d.country,
                                        value: d.users
                                    })),
                                    style: {
                                        valueFormatter: ({d, v}) => {
                                            return formatNum(v)
                                        }
                                    },
                                    xAxis: {
                                        //scaleLog: true,
                                        formatter: (v) => formatNum(v)
                                    }
                                }
                            },
                            {
                                label: 'Files',
                                value: 'files',
                                config: {
                                    data: data.map((d) => ({
                                        id: d.country,
                                        label: d.country,
                                        value: d.files
                                    })),
                                    style: {
                                        valueFormatter: ({d, v}) => {
                                            return formatNum(v)
                                        }
                                    },
                                    xAxis: {
                                        //scaleLog: true,
                                        formatter: (v) => formatNum(v)
                                    }
                                }

                            }
                        ]
                        return (
                            <TabChartCard
                                title='Countries'
                                subTitle={`Destination country from the download IP. From ${from} to ${to}`}
                                data={config}
                                chartType='Bar'
                                footer={
                                    <small>
                                        <strong>Why this view:</strong>{' '}
                                        international reach for reporting.
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
                    suspenseBlockStyle={true}
                    query={SQL.fileDownloads.organizations({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)
                        const columns = [
                            {
                                title: 'Organization',
                                dataIndex: 'organization',
                                key: 'organization'
                            },
                            {
                                title: 'Country',
                                dataIndex: 'country',
                                key: 'country'
                            },
                            {
                                title: 'Users',
                                dataIndex: 'users',
                                key: 'users'
                            },
                            {
                                title: 'TB',
                                dataIndex: 'terabytes',
                                key: 'terabytes',
                                minWidth: '150px',
                                render: (text) => (
                                    <InbarCell text={text} />
                                )
                            },
                            {
                                title: 'Files',
                                dataIndex: 'files',
                                key: 'files'
                            },
                            {
                                title: 'Datasets',
                                dataIndex: 'datasets',
                                key: 'datasets'
                            },
                            {
                                title: 'Assays',
                                dataIndex: 'assays',
                                key: 'assays'
                            },
                            {
                                title: 'Active Months',
                                dataIndex: 'active_months',
                                key: 'active_months'
                            },
                            {
                                title: 'First',
                                dataIndex: 'first_download',
                                key: 'first_download'
                            },
                            {
                                title: 'Last',
                                dataIndex: 'last_download',
                                key: 'last_download'
                            }
                            
                        ]
                        return (
                            <TableCard
                                data={data}
                                columns={columns}
                                title='Organizations'
                                subTitle={`Top 50 by volume, grouped by the registrable part of the user's login domain. github.com, orcid.org and gmail.com are sign-in providers that hide the real institution; UNDETERMINED could not be parsed. Country is the most common download country. From ${from} to ${to}`}
                            />
                        )
                    }}
                />
            )
        },
        {
            component: (
                <DetailSuspence
                    suspenseBlockStyle={true}
                    query={SQL.fileDownloads.topCities({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)
                        const columns = [
                             {
                                title: 'City',
                                dataIndex: 'city',
                                key: 'city'
                            },
                            {
                                title: 'Region',
                                dataIndex: 'region',
                                key: 'region'
                            },
                            {
                                title: 'Country',
                                dataIndex: 'country',
                                key: 'country'
                            },
                            {
                                title: 'Users',
                                dataIndex: 'users',
                                key: 'users'
                            },
                            {
                                title: 'TB',
                                dataIndex: 'terabytes',
                                key: 'terabytes',
                                minWidth: '150px',
                                render: (text) => (
                                    <InbarCell text={text} />
                                )
                            },
                            {
                                title: 'Files',
                                dataIndex: 'files',
                                key: 'files'
                            },
                        ]
                        return (
                            <TableCard
                                data={data}
                                columns={columns}
                                title='Top cities'
                                subTitle={`Top 25 destination cities by volume. From ${from} to ${to}`}
                            />
                        )
                    }}
                />
            )
        },
    ]
}

const FileDownloads = memo(({ from, to }) => {
    const items = [
        {
            key: 'downloads',
            label: 'Downloads',
            children: (
                <div>
                    {downloadsCharts(from, to).map((chart) => chart.component)}
                </div>
            )
        },
        {
            key: 'locations',
            label: 'Locations',
            children: (
                <div>
                    {locationsCharts(from, to).map((chart) => chart.component)}
                </div>
            )
        }
    ]

    const [activeTab, setActiveTab] = useState('downloads')

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

export default FileDownloads
