import React, { useState } from 'react'
import { ChartProvider } from '@/context/ChartContext';
import { prepareStackedData } from '@/components/Visualizations/Charts/StackedBar';
import GroupedBar from '@/components/Visualizations/Charts/GroupedBar';
import WithChart from './WithChart';

function GroupedBarWithLegend({ chartId, data, subGroupLabels, yAxis, xAxis }) {
    const [legend, setLegend] = useState({})

    return (
        <WithChart legend={legend} data={data}>
                <ChartProvider>
                    <GroupedBar
                        reload={false}
                        setLegend={setLegend}
                        subGroupLabels={subGroupLabels}
                        data={prepareStackedData(Array.from(data))}
                        yAxis={yAxis}
                        xAxis={xAxis}
                        chartId={chartId} />
                </ChartProvider>
        </WithChart>
    )
}

export default GroupedBarWithLegend