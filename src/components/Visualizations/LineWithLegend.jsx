import React, { useState } from 'react'
import { ChartProvider } from '@/context/ChartContext';
import Line from '@/components/Visualizations/Charts/Line';
import WithChart from './WithChart';

function LineWithLegend({ chartId, data, groups, yAxis, xAxis, colorGroups }) {
    const [legend, setLegend] = useState({})

    return (
        <WithChart legend={legend} data={data}>
             <ChartProvider>
                    <Line
                        colorGroups={colorGroups}
                        xAxis={xAxis}
                        yAxis={yAxis}
                        groups={groups}
                        reload={false}
                        setLegend={setLegend}
                        data={data}
                        chartId={chartId} />
                </ChartProvider>
        </WithChart>
    )
}

export default LineWithLegend