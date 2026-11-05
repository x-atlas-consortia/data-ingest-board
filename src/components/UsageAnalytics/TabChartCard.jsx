import React, { memo, useState } from 'react'
import { Card, Radio, Space } from 'antd'
import ChartCard from './ChartCard';

const TabChartCard = memo(({ title, subTitle, data }) => {
    const [tabPlacement, setTabPlacement] = useState(data?.[0]?.value);
    const changeTabPlacement = e => {
      setTabPlacement(e.target.value);
    };
    return (
        <Card title={title}>
            <p>{subTitle}</p>
             <Space style={{ marginBottom: 24 }}>
              <Radio.Group value={tabPlacement} onChange={changeTabPlacement}>
                {data?.map((tab) => (
                  <Radio.Button key={tab.value} value={tab.value}>
                    {tab.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Space>
            <ChartCard data={data?.find((tab) => tab.value === tabPlacement)} />
        </Card>
    )
})

export default TabChartCard;