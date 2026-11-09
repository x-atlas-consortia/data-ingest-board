import React, { useState, memo } from 'react'
import { ChartProvider } from '@/context/ChartContext'
import Column from '@/components/Visualizations/Charts/Column'
import WithChartFlex from './WithChartFlex'

const ColumnWithLegendFlex = memo(
    ({ chartId, data, yAxis, xAxis, style = {} }) => {
        const [legend, setLegend] = useState({})

        return (
            <WithChartFlex legend={legend} data={data}>
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
            </WithChartFlex>
        )
    }
)

export default ColumnWithLegendFlex
