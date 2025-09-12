import React, { useContext, useEffect, useState } from 'react'
import { Col, Row } from 'antd';
import Legend from "@/components/Visualizations/Legend";
import { ChartProvider } from '@/context/ChartContext';
import Line from '@/components/Visualizations/Charts/Line';

function LineWithLegend({ chartId, data, groups, yAxis, xAxis }) {
    const [legend, setLegend] = useState({})
    const [_, setRefresh] = useState(null)

    useEffect(() =>{
        setRefresh(new Date().getTime())
    }, [data])

    return (
        <Row>
            <Col span={18} push={6}>
                <ChartProvider>
                    <Line
                        xAxis={xAxis}
                        yAxis={yAxis}
                        groups={groups}
                        reload={false}
                        setLegend={setLegend}
                        data={data}
                        chartId={chartId} />
                </ChartProvider>
            </Col>
            <Col span={5} pull={18} className='pe-4'>
                <Legend legend={legend} sortLegend={false} />
            </Col>
        </Row>
    )
}

export default LineWithLegend