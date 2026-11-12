import React, { useState, memo, useMemo } from 'react'
import { ChartProvider } from '@/context/ChartContext'
import Column from '@/components/Visualizations/Charts/Column'
import Bar from '@/components/Visualizations/Charts/Bar'
import WithChartFlex from '@/components/Visualizations/WithChartFlex'
import Line from '@/components/Visualizations/Charts/Line'
import OverlappedColumn from '@/components/Visualizations/Charts/OverlappedColumn'
import GroupedColumn from '@/components/Visualizations/Charts/GroupedColumn'
import { prepareStackedData } from '@/components/Visualizations/Charts/OverlappedColumn'
import WithOnlyChart from '@/components/Visualizations/WithOnlyChart'
import StackedColumn from '@/components/Visualizations/Charts/StackedColumn'
import WithChartSider from '@/components/Visualizations/WithChartSider'
import USA from '@/components/Visualizations/Charts/USA'
import World from '@/components/Visualizations/Charts/World'

const ChartWithLegend = memo(
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
                GroupedColumn,
                StackedColumn,
                USA,
                World,
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

        const ChartWrapper =
            legendLayout === 'flex' ? WithChartFlex : legendLayout === 'sider' ? WithChartSider : WithOnlyChart

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

export default ChartWithLegend
