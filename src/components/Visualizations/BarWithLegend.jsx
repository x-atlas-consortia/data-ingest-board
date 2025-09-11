import React, { useContext, useEffect, useState } from 'react'
import { Col, Row } from 'antd';
import Legend from "@/components/Visualizations/Legend";
import { ChartProvider } from '@/context/ChartContext';
import Bar from '@/components/Visualizations/Charts/Bar';

function BarWithLegend({ chartId, data, subGroupLabels, yAxisTickFormatter }) {
    const [legend, setLegend] = useState({})
    const [_, setRefresh] = useState(null)

    useEffect(() =>{
        setRefresh(new Date().getTime())
    }, [data])

    return (
        <Row>
            <Col span={18} push={6}>
                <ChartProvider>
                    <Bar
                        yAxisTickFormatter={yAxisTickFormatter}
                        reload={false}
                        setLegend={setLegend}
                        data={data}
                        chartId={chartId} />
                </ChartProvider>
            </Col>
            <Col span={6} pull={18}>
                <Legend legend={legend} sortLegend={false} />
            </Col>
        </Row>
    )
}

export default BarWithLegend