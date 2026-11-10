import React, { memo } from 'react'
import { DownOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Dropdown, message, Space } from 'antd';

const items = [
  {
    label: '1st menu item',
    key: '1',
  },
  {
    label: '2nd menu item',
    key: '2',
  },
];

const ChartCardActions = memo(({}) => {
  return (
    <div>
      <Button type="primary" icon={<DownloadOutlined />} size={'small'}>
              CSV
            </Button>
      {/* Chart card actions content goes here */}
    </div>
  )

})

export default ChartCardActions