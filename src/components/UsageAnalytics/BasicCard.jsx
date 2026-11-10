import React, { memo } from 'react'
import { Card, Button } from 'antd'
import { Column } from '@ant-design/plots';

import ChartCardActions from './ChartCardActions';

const BasicCard = memo(({ title, data, children, footer }) => {
    
    return (
        <div className='c-usageCard c-usageCard--basic'>
          <Card title={title} extra={<ChartCardActions indexKey={title.toDashedCase()} config={data} />}>
              {children}
              <Column {...data} />
              {footer && <div className="ant-card-actions pt-2">{footer}</div>}
          </Card>
        </div>
    )
})

export default BasicCard;