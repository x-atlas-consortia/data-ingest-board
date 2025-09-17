import React, { useEffect, useState } from 'react'
import { Col, Row } from 'antd';
import Legend from "@/components/Visualizations/Legend";
import { ChartProvider } from '@/context/ChartContext';
import Bar from '@/components/Visualizations/Charts/Bar';

function BarWithLegend({ chartId, data, yAxis }) {
    const [legend, setLegend] = useState({})
    const [_, setRefresh] = useState(null)

    useEffect(() =>{
        setRefresh(new Date().getTime())
    }, [data])

    return (
        <Row>
            <Col md={{span: 18, push: 6}}>
                <ChartProvider>
                    <Bar
                        yAxis={yAxis}
                        reload={false}
                        setLegend={setLegend}
                        data={data}
                        chartId={chartId} />
                </ChartProvider>
            </Col>
            <Col md={{span: 5, pull: 18}} className='pe-4'>
                <Legend legend={legend} sortLegend={false} />
            </Col>
        </Row>
    )
}

export default BarWithLegend