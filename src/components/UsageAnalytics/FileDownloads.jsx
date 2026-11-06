import React, { memo, useState } from 'react'
import { Tabs } from 'antd'
import DetailSuspence from '@/components/DetailSuspence'
import SQL from '@/lib/helpers/sql'
import TabChartCard from './TabChartCard'
import { formatBytes, formatNum, formatAxisDate } from '@/lib/helpers/general'
import BasicCard from './BasicCard'

const dataToArrayofObjects = (rawData) => {
    return rawData.rows.map((row) =>
        Object.fromEntries(rawData.columns.map((key, i) => [key, row[i]]))
    )
}

const downloadsCharts = (from, to) => {
    return [
        {
            component: (
                <DetailSuspence
                    query={SQL.fileDownloads.monthly({ from, to })}
                    buildCallback={(rawData) => {
                        const data = dataToArrayofObjects(rawData)
                        const config = [
                            {
                                label: 'Data transferred (TB)',
                                value: 'bytes',
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
                            }
                        ]
                        return (
                            <TabChartCard
                                title='Monthly usage'
                                subTitle={`Pick a measure. From ${from} to ${to}`}
                                data={config}
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
                                              name: datum.assay, // Map it directly to avoid duplicate field evaluation
                                              value: formatBytes(datum.total_bytes_transferred ),
                                            }),
                                          ],
                                        // fields: ['assay', 'total_bytes_transferred'], // limit fields to exactly these two
                                        // formatter: (datum) => {
                                        //   return { 
                                        //     name: datum.assay, 
                                        //     value: formatBytes(datum.total_bytes_transferred )
                                        //   };
                                        // },
                                        // items: [
                                        //     {
                                        //         channel: 'y', // or field name
                                        //         valueFormatter: (datum) => {
                                        //             return formatBytes(datum)
                                        //         }
                                        //     }
                                        // ]
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
                                        footer={<small><strong>Why this view:</strong> shows which data modalities drive demand over time and when a new assay starts to be picked up.</small>}
                                    />
                                )
                            }}
                        />
                    </div>
                    <div className='col-md-6'>
                      <DetailSuspence
                            query={SQL.fileDownloads.activeUsers({ from, to })}
                            buildCallback={(rawData) => {
                         
                                const list = dataToArrayofObjects(rawData)
                                const data = []
                                for(const item of list) {
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
                                              value: formatNum(datum.count ),
                                            }),
                                          ],
                                     
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
                                        footer={<small><strong>Why this view:</strong> shows user activity patterns and identifies trends in user engagement over time.</small>}
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

const FileDownloads = memo(({ from, to }) => {
    const items = [
        {
            key: 'downloads',
            label: 'Downloads',
            children: <div>
              
              {downloadsCharts(from, to)[0].component}
              {downloadsCharts(from, to)[1].component}
            
            </div>
        },
        {
            key: 'locations',
            label: 'Locations',
            children: <div>Content of Tab Pane 2</div>
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
