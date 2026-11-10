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
                                config: {
                                    data,
                                    xField: 'time_bucket',
                                    yField: 'total_bytes_transferred',
                                    tooltip: {
                                        title: (datum) => {
                                            return formatAxisDate(
                                                datum.time_bucket,
                                                true
                                            )
                                        },
                                        items: [
                                            {
                                                name: 'Data transferred',
                                                channel: 'y', // or field name
                                                valueFormatter: (datum) => {
                                                    return formatBytes(datum)
                                                }
                                            }
                                        ]
                                    },
                                    axis: {
                                        x: {
                                            labelFormatter: (datum) => {
                                                return formatAxisDate(datum)
                                            }
                                        },
                                        y: {
                                            labelFormatter: (datum) =>
                                                formatBytes(datum)
                                        }
                                    }
                                }
                            },
                            {
                                label: 'Files',
                                value: 'files',
                                config: {
                                    data,
                                    xField: 'time_bucket',
                                    yField: 'files',
                                    tooltip: {
                                        title: (datum) => {
                                            return formatAxisDate(
                                                datum.time_bucket,
                                                true
                                            )
                                        },
                                        items: [
                                            {
                                                name: 'Files',
                                                channel: 'y', // or field name
                                                valueFormatter: (datum) => {
                                                    return formatNum(datum)
                                                }
                                            }
                                        ]
                                    },
                                    axis: {
                                        y: {
                                            labelFormatter: (datum) =>
                                                formatNum(datum)
                                        }
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
                                config: {
                                    data: datasetPullsTouchedData,
                                    xField: 'time_bucket',
                                    yField: 'dataset_pulls',
                                    tooltip: {
                                        title: (datum) => {
                                            return formatAxisDate(
                                                datum.time_bucket,
                                                true
                                            )
                                        },
                                        items: [
                                            {
                                                name: 'Dataset pulls',
                                                channel: 'y', // or field name
                                                valueFormatter: (datum) => {
                                                    return formatNum(datum)
                                                }
                                            }
                                        ]
                                    },
                                    axis: {
                                        y: {
                                            labelFormatter: (datum) =>
                                                formatNum(datum)
                                        }
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
                                config: {
                                    data: datasetPullsTouchedData,
                                    xField: 'time_bucket',
                                    yField: 'datasets_touched',
                                    tooltip: {
                                        title: (datum) => {
                                            return formatAxisDate(
                                                datum.time_bucket,
                                                true
                                            )
                                        },
                                        items: [
                                            {
                                                name: 'Datasets touched',
                                                channel: 'y', // or field name
                                                valueFormatter: (datum) => {
                                                    return formatNum(datum)
                                                }
                                            }
                                        ]
                                    },
                                    axis: {
                                        y: {
                                            labelFormatter: (datum) =>
                                                formatNum(datum)
                                        }
                                    }
                                }
                            }
                        ]
                        return (
                            <TabChartCard
                                title='Monthly usage'
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
                            suspenseBlockStyle={true}
                            query={SQL.fileDownloads.perAssay({ from, to })}
                            buildCallback={(rawData) => {
                                console.log('Raw Data:', rawData)
                                const data = dataToArrayofObjects(rawData)
                                const config = {
                                    data,
                                    xField: 'time_bucket',
                                    yField: 'total_bytes_transferred',
                                    colorField: 'assay',
                                    stack: true,
                                    tooltip: {
                                        shared: true,
                                        title: (datum) => {
                                            return formatAxisDate(
                                                datum.time_bucket,
                                                true
                                            )
                                        },
                                        items: [
                                            (datum, index, data, column) => ({
                                                name: datum.assay,
                                                value: formatBytes(
                                                    datum.total_bytes_transferred
                                                )
                                            })
                                        ]
                                    },
                                    axis: {
                                        x: {
                                            labelFormatter: (datum) => {
                                                return formatAxisDate(datum)
                                            }
                                        },
                                        y: {
                                            labelFormatter: (datum) =>
                                                formatBytes(datum)
                                        }
                                    }
                                }
                                return (
                                    <BasicCard
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
                            suspenseBlockStyle={true}
                            query={SQL.fileDownloads.activeUsers({ from, to })}
                            buildCallback={(rawData) => {
                                const list = dataToArrayofObjects(rawData)
                                const data = []
                                for (const item of list) {
                                    data.push({
                                        time_bucket: item.time_bucket,
                                        type: 'new_users',
                                        count: item.new_users
                                    })
                                    data.push({
                                        time_bucket: item.time_bucket,
                                        type: 'returning_users',
                                        count: item.returning_users
                                    })
                                }

                                const config = {
                                    data,
                                    xField: 'time_bucket',
                                    yField: 'count',
                                    colorField: 'type',
                                    stack: true,
                                    tooltip: {
                                        shared: true,
                                        title: (datum) => {
                                            return formatAxisDate(
                                                datum.time_bucket,
                                                true
                                            )
                                        },
                                        items: [
                                            (datum, index, data, column) => ({
                                                name: datum.type,
                                                value: formatNum(datum.count)
                                            })
                                        ]
                                    },
                                    axis: {
                                        x: {
                                            labelFormatter: (datum) => {
                                                return formatAxisDate(datum)
                                            }
                                        },
                                        y: {
                                            labelFormatter: (datum) =>
                                                formatNum(datum)
                                        }
                                    }
                                }
                                return (
                                    <BasicCard
                                        title='Active Users by Month'
                                        subTitle={`Tracking user engagement and retention. From ${from} to ${to}`}
                                        data={config}
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
                                chartType='bar'
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
        }
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
