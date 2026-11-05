import React, { memo, useEffect } from 'react'
import { Card, Col, Row, Tooltip, Skeleton, Spin } from 'antd'
import URLS from '@/lib/helpers/urls'
import SQL from '@/lib/helpers/sql'

import DetailSuspence from '@/components/DetailSuspence'

const TinyCard = memo(
    ({ cardKey, query, formatter, title, query2, formatter2, footer }) => {
        return (
            <Card key={cardKey} className='c-logCard--tiny'>
                <DetailSuspence
                    query={query}
                    buildCallback={(data) => {
                        return (
                            <span>
                                <small className='p5 text-muted'>{title}</small>{' '}
                                <br />
                                <span className='h4 mt-2 d-block'>
                                    {formatter
                                        ? formatter(data)
                                        : data.rows[0][0]}
                                </span>
                                <span>
                                    <DetailSuspence
                                        query={query2}
                                        buildCallback={(dataPrev) =>
                                            formatter2
                                                ? formatter2(data, dataPrev)
                                                : dataPrev.rows[0][0]
                                        }
                                    />{' '}
                                    {footer}
                                </span>
                            </span>
                        )
                    }}
                />
            </Card>
        )
    }
)

export default TinyCard
