import React, { useState } from 'react'
import { ChartProvider } from '@/context/ChartContext';
import OverlappedBar, { prepareStackedData } from '@/components/Visualizations/Charts/OverlappedBar';
import WithChart from './WithChart';

function OverlappedBarWithLegend({ chartId, data, subGroupLabels, yAxis, xAxis, style }) {
    const [legend, setLegend] = useState({})

    return (
        <WithChart legend={legend} data={data}>
                <ChartProvider>
                    <OverlappedBar
                        reload={false}
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
}

export default OverlappedBarWithLegend