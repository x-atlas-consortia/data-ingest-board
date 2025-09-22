import React, { useContext, useEffect, useState } from 'react'
import { Col, Row } from 'antd';
import Legend from "@/components/Visualizations/Legend";
import { ChartProvider } from '@/context/ChartContext';
import Line from '@/components/Visualizations/Charts/Line';

function LineWithLegend({ chartId, data, groups, yAxis, xAxis, colorGroups }) {
    const [legend, setLegend] = useState({})
    const [_, setRefresh] = useState(null)

    useEffect(() =>{
        setRefresh(new Date().getTime())
    }, [data])

    return (
        <Row>
            <Col md={{span: 6, push: 6}}>
                <ChartProvider>
                    <Line
                        colorGroups={colorGroups}
                        xAxis={xAxis}
                        yAxis={yAxis}
                        groups={groups}
                        reload={false}
                        setLegend={setLegend}
                        data={data}
                        chartId={chartId} />
                </ChartProvider>
            </Col>
            <Col md={{span: 6, pull: 16}} className='pe-4'>
                <Legend legend={legend} sortLegend={false} />
            </Col>
        </Row>
    )
}

export default LineWithLegend