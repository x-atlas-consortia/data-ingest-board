import React, { memo, useState } from 'react'
import { Tabs } from 'antd'
import DetailSuspence from '@/components/DetailSuspence';
import SQL from '@/lib/helpers/sql';
import TabChartCard from './TabChartCard';
import { formatBytes, formatNum, formatAxisDate } from '@/lib/helpers/general';


const downloadsCharts = (from, to) => {
  return [
  {
    component: <DetailSuspence query={SQL.fileDownloads.monthly({ from, to })} buildCallback={(rawData) => {
      
      const data = rawData.rows.map(row => 
        Object.fromEntries(rawData.columns.map((key, i) => [key, row[i]]))
      );
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
                  return formatAxisDate(datum.time_bucket, true)
                },
                items: [
                  
                  {
                    name: 'Data transferred',
                    channel: 'y', // or field name
                    valueFormatter: (datum) => {
                      return formatBytes(datum)
                    }, 
                  },
                ],
              },
              axis: {
              x: {
                labelFormatter: (datum) => {
                  return formatAxisDate(datum)
                }
              },
              y: {
                labelFormatter: (datum) => formatBytes(datum),
              },
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
                  return formatAxisDate(datum.time_bucket, true)
                },
              items: [
                  
                  {
                    name: 'Files',
                    channel: 'y', // or field name
                    valueFormatter: (datum) => {
                      return formatNum(datum)
                    }, 
                  },
                ],
            },
            axis: {
              y: {
                labelFormatter: (datum) => formatNum(datum),
              },
            }
          }  
        }
      ]
      console.log('data', rawData, config)
      return <TabChartCard title="Monthly usage" subTitle={`Pick a measure. From ${from} to ${to}`} data={config} />
    }} />
  }
]
}

const FileDownloads = memo(({ from, to}) => {
    const items = [
    {
      key: 'downloads',
      label: 'Downloads',
      children: <div>{downloadsCharts(from, to)[0].component}</div>,
    },
    {
      key: 'locations',
      label: 'Locations',
      children: <div>Content of Tab Pane 2</div>,
    },
  ];

    const [activeTab, setActiveTab] = useState('downloads')

    return (
        <div>
            <Tabs defaultActiveKey={activeTab} items={items} onChange={setActiveTab} />
        </div>
    )
})

export default FileDownloads;