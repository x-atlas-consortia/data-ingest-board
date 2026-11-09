import React, { useState, memo } from 'react'
import { ChartProvider } from '@/context/ChartContext'
import { prepareStackedData } from '@/components/Visualizations/Charts/OverlappedColumn'
import GroupedColumn from '@/components/Visualizations/Charts/GroupedColumn'
import WithChart from './WithChart'

const GroupedColumnWithLegend = memo(
    ({ chartId, data, subGroupLabels, yAxis, xAxis, style = {} }) => {
        const [legend, setLegend] = useState({})

        return (
            <WithChart legend={legend} data={data}>
                <ChartProvider>
                    <GroupedColumn
                        reload={false}
                        setLegend={setLegend}
                        subGroupLabels={subGroupLabels}
                        data={prepareStackedData(Array.from(data))}
                        style={style}
                        yAxis={yAxis}
                        xAxis={xAxis}
                        chartId={chartId}
                    />
                </ChartProvider>
            </WithChart>
        )
    }
)

export default GroupedColumnWithLegend
