import React, { memo } from 'react'
import { Card, Button } from 'antd'
import { Column } from '@ant-design/plots';
import { DownloadOutlined } from '@ant-design/icons';

const BasicCard = memo(({ title, data, children, footer }) => {
    console.log(data)
    return (
        <Card title={title} extra={ <Button type="primary" icon={<DownloadOutlined />} size={'small'}>
            CSV
          </Button>}>
            {children}
            <Column {...data} />
            {footer && <div className="ant-card-actions pt-2">{footer}</div>}
        </Card>
    )
})

export default BasicCard;