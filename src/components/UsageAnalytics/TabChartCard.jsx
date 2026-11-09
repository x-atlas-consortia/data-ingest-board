import React, { memo, useState } from 'react'
import { Card, Radio, Space } from 'antd'
import { Bar, Column } from '@ant-design/plots';

const TabChartCard = memo(({ title, subTitle, data, chartType, footer }) => {
    const [tabPlacement, setTabPlacement] = useState(data?.[0]?.value);
    const changeTabPlacement = e => {
      setTabPlacement(e.target.value);
    };
    const currentChartData = data?.find((tab) => tab.value === tabPlacement);
    return (
      <div className='c-usageCard c-usageCard--tab'>
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
       
            {chartType === 'bar' ? <Bar key={currentChartData?.value} {...currentChartData?.config} /> : <Column key={currentChartData?.value} {...currentChartData?.config} />}
            {currentChartData?.footer && <span>{currentChartData.footer}</span>}
            {footer && <div className='ant-card-actions pt-2 mt-2'>{footer}</div>}
        </Card>
      </div>
    )
})

export default TabChartCard;