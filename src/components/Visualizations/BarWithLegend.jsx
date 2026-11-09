import React, { useState, memo } from 'react'
import { ChartProvider } from '@/context/ChartContext'
import Column from '@/components/Visualizations/Charts/Column'
import WithChart from './WithChart'

const BarWithLegend = memo(({ chartId, data, yAxis, xAxis, style = {} }) => {
    const [legend, setLegend] = useState({})

    return (
        <WithChart legend={legend} data={data}>
            <ChartProvider>
                <Column
                    style={style}
                    xAxis={xAxis}
                    yAxis={yAxis}
                    reload={false}
                    setLegend={setLegend}
                    data={data}
                    chartId={chartId}
                />
            </ChartProvider>
        </WithChart>
    )
})

export default BarWithLegend
