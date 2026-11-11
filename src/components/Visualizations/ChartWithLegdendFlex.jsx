import React, { useState, memo, useMemo } from 'react'
import { ChartProvider } from '@/context/ChartContext'
import Column from '@/components/Visualizations/Charts/Column'
import Bar from '@/components/Visualizations/Charts/Bar'
import WithChartFlex from './WithChartFlex'
import Line from './Charts/Line'
import OverlappedColumn from './Charts/OverlappedColumn'
import GroupedColumn from './Charts/GroupedColumn'
import { prepareStackedData } from '@/components/Visualizations/Charts/OverlappedColumn'
import WithOnlyChart from './WithOnlyChart'

const ChartWithLegendFlex = memo(
    ({
        chartId,
        data,
        yAxis,
        xAxis,
        groups,
        subGroupLabels,
        chartType = 'Column',
        legendLayout = 'flex',
        providerProps = {},
        style = {}
    }) => {
        const [legend, setLegend] = useState({})

        const ChartComponent = useMemo(() => {
            const types = {
                Column,
                Bar,
                Line,
                OverlappedColumn,
                GroupedColumn
            }
            return types[chartType]
        }, [chartType])

        const supportsStackedData = useMemo(() => {
            return ['OverlappedColumn', 'GroupedColumn'].includes(chartType)
        }, [chartType])

        const preparedData = useMemo(
            () =>
                supportsStackedData
                    ? prepareStackedData(Array.from(data))
                    : data,
            [data, supportsStackedData]
        )

        const ChartWrapper = legendLayout === 'flex' ? WithChartFlex : WithOnlyChart

        return (
            <ChartWrapper legend={legend} data={preparedData}>
                <ChartProvider {...providerProps}>
                    <ChartComponent
                        style={style}
                        xAxis={xAxis}
                        yAxis={yAxis}
                        groups={groups}
                        subGroupLabels={subGroupLabels}
                        setLegend={setLegend}
                        data={preparedData}
                        chartId={chartId}
                    />
                </ChartProvider>
            </ChartWrapper>
        )
    }
)

export default ChartWithLegendFlex
