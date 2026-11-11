import React, { memo, useState, useMemo } from 'react'
import { Card } from 'antd'
import ChartCardActions from './ChartCardActions'
import ChartWithLegend from '@/components/Visualizations/ChartWithLegend'

const BasicCard = memo(({ title, chartType, data, children, footer }) => {
    const [logScale, setLogScale] = useState(
        data.optionsMenu.logScale.checked
    )
    const onChangeLogScale = (checked) => {
        setLogScale(checked)
    }
    const isBarChart = chartType === 'Bar'

    const chartProps = useMemo(
        () => {
            const valueAxisName = isBarChart ? 'xAxis' : 'yAxis'
            return {
                ...data,
                chartType,
                [valueAxisName]: {
                    ...data[valueAxisName],
                    scaleLog: logScale
                }
            }
        },
        [chartType, data, logScale]
    )

    return (
        <div className='c-usageCard c-usageCard--basic'>
            <Card
                title={title}
                extra={
                    <ChartCardActions
                        indexKey={title.toDashedCase()}
                        config={data}
                        logScale={logScale}
                        onChangeLogScale={onChangeLogScale}
                    />
                }
            >
                {children}
                <ChartWithLegend chartId={title.toDashedCase()} {...chartProps} />
                {/* <Column {...data} /> */}
                {footer && (
                    <div className='ant-card-actions pt-2'>{footer}</div>
                )}
            </Card>
        </div>
    )
})

export default BasicCard
