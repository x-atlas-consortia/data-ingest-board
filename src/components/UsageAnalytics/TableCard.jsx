import React, { memo, useRef, useEffect } from 'react'
import { Card, Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import SearchFilterTable from '@/components/DataTable/SearchFilterTable'

const TableCard = memo(({ title, subTitle, data, columns, footer }) => {
    const tableRef = useRef(null)

    const renderInbars = () => {
        const cells = tableRef.current.querySelectorAll('.js-inbar')

        // 1. Extract all numeric values to find the maximum
        const values = Array.from(cells).map(
            (cell) => parseFloat(cell.getAttribute('data-value')) || 0
        )
        const maxVal = Math.max(...values, 1) // prevent division by zero

        // 2. Build the inbars proportionally
        cells.forEach((cell) => {
            const val = parseFloat(cell.getAttribute('data-value')) || 0
            const percentage = (val / (maxVal * 2)) * 100

            // Wrap existing text or set content cleanly

            cell.style.width = `${percentage}%`
        })
    }

    useEffect(() => {
        if (tableRef.current != null) {
            // Do something with the table reference
            renderInbars()
        }
    }, [])

    return (
        <div className='c-usageCard c-usageCard--table'>
          <Card
            title={title}
            extra={
                <Button
                    type='primary'
                    icon={<DownloadOutlined />}
                    size={'small'}
                >
                    CSV
                </Button>
            }
        >
            <p className='ant-card-description'>{subTitle}</p>
            <div ref={tableRef}>
                <SearchFilterTable
                    data={data}
                    columns={columns}
                    tableProps={{
                        size: 'small',
                        pagination: false,
                        scroll: { y: 400 }
                    }}
                />
            </div>

            {footer && <div className='ant-card-actions pt-2 mt-4'>{footer}</div>}
        </Card>
        </div>
    )
})

export default TableCard
