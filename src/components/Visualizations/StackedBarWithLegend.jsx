import LogsContext from '@/context/LogsContext'
import React, { useContext } from 'react'
import { Col, Row } from 'antd';
import Legend from "@/components/Visualizations/Legend";
import { ChartProvider } from '@/context/ChartContext';
import StackedBar, { prepareStackedData } from '@/components/Visualizations/Charts/StackedBar';

function StackedBarWithLegend({ chartId, data, subGroupLabels }) {
    const { legend, setLegend } = useContext(LogsContext)
    return (
        <Row>
            <Col span={18} push={6}>
                <ChartProvider>
                    <StackedBar
                        setLegend={setLegend}
                        subGroupLabels={subGroupLabels}
                        data={prepareStackedData(Array.from(data))}
                        chartId={chartId} />
                </ChartProvider>
            </Col>
            <Col span={6} pull={18}>
                <Legend legend={legend} setLegend={setLegend} />
            </Col>
        </Row>
    )
}

export default StackedBarWithLegend