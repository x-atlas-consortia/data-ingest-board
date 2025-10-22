import React, { useState } from 'react'
import { ChartProvider } from '@/context/ChartContext';
import Bar from '@/components/Visualizations/Charts/Bar';
import WithChartFlex from './WithChartFlex';

function BarWithLegendFlex({ chartId, data, yAxis, xAxis}) {
    const [legend, setLegend] = useState({})

    return (
        <WithChartFlex legend={legend} data={data}>
                <ChartProvider>
                    <Bar
                        xAxis={xAxis}
                        yAxis={yAxis}
                        reload={false}
                        setLegend={setLegend}
                        data={data}
                        chartId={chartId} />
                </ChartProvider>
        </WithChartFlex>
    )
}

export default BarWithLegendFlex