import React, { useState } from 'react'
import { ChartProvider } from '@/context/ChartContext';
import Line from '@/components/Visualizations/Charts/Line';
import WithChart from './WithChart';

function LineWithLegend({ chartId, data, groups, yAxis, xAxis, style }) {
    const [legend, setLegend] = useState({})

    return (
        <WithChart legend={legend} data={data}>
             <ChartProvider>
                    <Line
                        style={style}
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