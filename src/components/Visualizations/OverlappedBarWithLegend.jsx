import React, { useState, memo } from 'react'
import { ChartProvider } from '@/context/ChartContext'
import OverlappedColumn, {
    prepareStackedData
} from '@/components/Visualizations/Charts/OverlappedColumn'
import WithChart from './WithChart'

const OverlappedBarWithLegend = memo(
    ({ chartId, data, subGroupLabels, yAxis, xAxis, style = {} }) => {
        const [legend, setLegend] = useState({})

        return (
            <WithChart legend={legend} data={data}>
                <ChartProvider>
                    <OverlappedColumn
                        reload={false}
                        setLegend={setLegend}
                        subGroupLabels={subGroupLabels}
                        data={prepareStackedData(Array.from(data))}
                        style={style}
                        yAxis={yAxis}
                        xAxis={xAxis}
                        chartId={chartId}
                    />
                </ChartProvider>
            </WithChart>
        )
    }
)

export default OverlappedBarWithLegend
