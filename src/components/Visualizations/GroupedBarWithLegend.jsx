import React, { useState, memo } from 'react'
import { ChartProvider } from '@/context/ChartContext';
import { prepareStackedData } from '@/components/Visualizations/Charts/OverlappedBar';
import GroupedBar from '@/components/Visualizations/Charts/GroupedBar';
import WithChart from './WithChart';


const GroupedBarWithLegend = memo(({ chartId, data, subGroupLabels, yAxis, xAxis, style = {} }) => {
    const [legend, setLegend] = useState({})

    return (
        <WithChart legend={legend} data={data}>
                <ChartProvider>
                    <GroupedBar
                        setLegend={setLegend}
                        subGroupLabels={subGroupLabels}
                        data={prepareStackedData(Array.from(data))}
                        style={style}
                        yAxis={yAxis}
                        xAxis={xAxis}
                        chartId={chartId} />
                </ChartProvider>
        </WithChart>
    )
})

export default GroupedBarWithLegend