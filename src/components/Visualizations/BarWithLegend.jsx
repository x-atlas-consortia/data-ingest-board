import React, { useState } from 'react'
import { ChartProvider } from '@/context/ChartContext';
import Bar from '@/components/Visualizations/Charts/Bar';
import WithChart from './WithChart';

function BarWithLegend({ chartId, data, yAxis }) {
    const [legend, setLegend] = useState({})

    return (
        <WithChart legend={legend} data={data}>
                <ChartProvider>
                    <Bar
                        yAxis={yAxis}
                        reload={false}
                        setLegend={setLegend}
                        data={data}
                        chartId={chartId} />
                </ChartProvider>
        </WithChart>
    )
}

export default BarWithLegend