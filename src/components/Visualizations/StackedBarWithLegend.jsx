import React, { useContext, useEffect, useState } from 'react'
import { Col, Row } from 'antd';
import Legend from "@/components/Visualizations/Legend";
import { ChartProvider } from '@/context/ChartContext';
import StackedBar, { prepareStackedData } from '@/components/Visualizations/Charts/StackedBar';

function StackedBarWithLegend({ chartId, data, subGroupLabels, yAxis, xAxis}) {
    const [legend, setLegend] = useState({})
    const [_, setRefresh] = useState(null)

    useEffect(() =>{
        setRefresh(new Date().getTime())
    }, [data])

    return (
        <Row>
            <Col span={18} push={6}>
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
            </Col>
            <Col span={5} pull={18}>
                <Legend legend={legend} sortLegend={false} />
            </Col>
        </Row>
    )
}

export default StackedBarWithLegend