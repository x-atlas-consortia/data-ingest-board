import React, { memo, useState } from 'react'
import { DownloadOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Dropdown, message, Space, Switch } from 'antd'

const ChartCardActions = memo(({ config, indexKey, logScale, onChangeLogScale }) => {
  const [isLogScale, setIsLogScale] = useState(logScale)

  const scaleTypeChange = (checked) => {
    setIsLogScale(checked)
    if (onChangeLogScale) {
      onChangeLogScale(checked)
    }
  }

  const getItems = (config, indexKey) => {
      const options = []
      if (config.optionsMenu?.logScale) {
          options.push({
              key: 'scaleType' + indexKey,
              className: 'ant-menu-item--scaleType',
              disabled: true, //disable clicks on label
              label: (
                  <>
                      {config.optionsMenu?.logScale?.label || 'Y-Axis'} Scale{' '}
                      <Switch
                          checkedChildren='Log'
                          onChange={scaleTypeChange}
                          unCheckedChildren='Linear'
                          size='small'
                          defaultChecked={isLogScale}
                      />
                  </>
              )
          })
      }
      return [
          ...options,
          {
              key: 'export',
              label: (
                  <span data-gtm-info={indexKey} data-gtm-action='export'>
                      Export
                  </span>
              ),
              icon: <DownloadOutlined />
          }
      ]
    }

    const items = getItems(config, indexKey)

    const onClick = ({ key }) => {
        if (key === 'export') {
            //message.success('Exporting...')
        }
    }

    return (
        <div>
            {/* <Button type='primary' icon={<DownloadOutlined />} size={'small'}>
                CSV
            </Button> */}
            {/* Chart card actions content goes here */}
            <Dropdown menu={{ items, onClick }}>
                <a onClick={(e) => e.preventDefault()}>
                    <Space>
                        Options
                        <SettingOutlined />
                    </Space>
                </a>
            </Dropdown>
        </div>
    )
})

export default ChartCardActions
