import React, { useState } from 'react'
import { ChartProvider } from '@/context/ChartContext';
import StackedBar, { prepareStackedData } from '@/components/Visualizations/Charts/StackedBar';
import WithChart from './WithChart';

function StackedBarWithLegend({ chartId, data, subGroupLabels, yAxis, xAxis }) {
    const [legend, setLegend] = useState({})

    return (
        <WithChart legend={legend} data={data}>
                <ChartProvider>
                    <StackedBar
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

export default StackedBarWithLegend