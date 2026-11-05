import React, { memo } from 'react'
import { Card } from 'antd'
import { Column } from '@ant-design/plots';

const ChartCard = memo(({ title, data, children }) => {
    return (
        <Card title={title}>
            {children}
            <Column {...data?.config} />
        </Card>
    )
})

export default ChartCard;