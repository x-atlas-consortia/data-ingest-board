import React, { memo, useState, useMemo } from 'react'
import { Card, Radio, Space } from 'antd'
import { Column } from '@ant-design/charts'
import ChartWithLegendFlex from '../Visualizations/ChartWithLegdendFlex'
import ChartCardActions from './ChartCardActions'

const TabChartCard = memo(({ title, subTitle, data, chartType, footer }) => {
    const [tabPlacement, setTabPlacement] = useState(data?.[0]?.value)
    const changeTabPlacement = (e) => {
        setTabPlacement(e.target.value)
    }
    const currentChartData = data?.find((tab) => tab.value === tabPlacement)
    const [logScales, setLogScales] = useState({
        [tabPlacement]:
            currentChartData?.optionsMenu?.logScale?.checked || false
    })
    const changeLogScale = (checked) => {
        setLogScales((prev) => ({
            ...prev,
            [tabPlacement]: checked
        }))
    }
    const isBarChart = chartType === 'bar'
    const chartProps = useMemo(() => {
        let valueAxisName = isBarChart ? 'xAxis' : 'yAxis'
        return {
            ...currentChartData?.config,
            [valueAxisName]: {
                ...currentChartData?.config?.[valueAxisName],
                scaleLog: logScales[tabPlacement]
            }
        }
    }, [currentChartData, logScales, tabPlacement])

    return (
        <div className='c-usageCard c-usageCard--tab w-100'>
            <Card
                title={title}
                extra={
                    <ChartCardActions
                        indexKey={tabPlacement}
                        config={currentChartData}
                        logScale={logScales[tabPlacement]}
                        onChangeLogScale={changeLogScale}
                    />
                }
            >
                <p>{subTitle}</p>
                <Space style={{ marginBottom: 24 }}>
                    <Radio.Group
                        value={tabPlacement}
                        onChange={changeTabPlacement}
                    >
                        {data?.map((tab) => (
                            <Radio.Button key={tab.value} value={tab.value}>
                                {tab.label}
                            </Radio.Button>
                        ))}
                    </Radio.Group>
                </Space>

                {isBarChart ? (
                    <ChartWithLegendFlex
                        chartType='Bar'
                        legendLayout={'none'}
                        key={currentChartData?.value}
                        chartId={tabPlacement}
                        {...chartProps}
                    />
                ) : (
                    <Column
                        key={currentChartData?.value}
                        {...chartProps}
                    />
                )}
                {currentChartData?.footer && (
                    <span>{currentChartData.footer}</span>
                )}
                {footer && (
                    <div className='ant-card-actions pt-2 mt-2'>{footer}</div>
                )}
            </Card>
        </div>
    )
})

export default TabChartCard
