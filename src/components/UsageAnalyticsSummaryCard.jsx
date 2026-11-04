import React, { memo } from 'react'
import {
    Card,
    Col,
    DatePicker,
    Layout,
    Row,
    theme,
    Tabs,
    Carousel,
    Button,
    Tooltip,
    Skeleton,
    Spin
} from 'antd'
import {
    formatNum,
    formatBytes,
    roundToTheNearest
} from '@/lib/helpers/general'
import { InfoCircleOutlined } from '@ant-design/icons'
import DetailSuspence, { DetailUI } from './DetailSuspence'
import SQL from '@/lib/helpers/sql'

const ApiUsageSummary = memo(({ data, skeleton }) => {
    const getSummary = () => {
        let ms = []
        for (let d of data.services) {
            ms.push(
                <Row className='mt-3 w-50' key={d[0]}>
                    <Col>
                        {' '}
                        <span>
                            {skeleton ? (
                                <Skeleton.Input active size='small' />
                            ) : (
                                formatNum(d[1])
                            )}
                        </span>
                        <br />
                        <strong>
                            {skeleton ? (
                                <Skeleton.Input
                                    active
                                    size='small'
                                    className='mt-1'
                                />
                            ) : (
                                d[0]
                            )}
                        </strong>
                    </Col>
                </Row>
            )
        }
        return (
            <>
                <div>
                    <h3>
                        {skeleton ? (
                            <Skeleton.Input active size='small' />
                        ) : (
                            formatNum(data.totalHits)
                        )}{' '}
                        <small>total requests</small>
                    </h3>
                </div>
                <div className='c-logCard__flexWrap'>{ms}</div>
            </>
        )
    }
    return <>{getSummary()}</>
})

const UsageAnalyticsSummaryCard = memo(
    ({ from, to, title, tabName, cardKey, highlightSection, cardType }) => {
        const fileDownloadsCardSummary = () => {
            const totalBytesQuery = SQL.fileDownloads.totalBytesTransferred({
                from,
                to
            })
            const totalDownloadsQuery = SQL.fileDownloads.totalDownloads({
                from,
                to
            })
            const totalEntities = SQL.fileDownloads.totalEntities({ from, to })
            return (
                <>
                    <div>
                        <h3>
                            {' '}
                            <DetailSuspence
                                query={totalBytesQuery}
                                buildCallback={(data) =>
                                    formatBytes(data.rows[0] || 0)
                                }
                            />{' '}
                            <small>downloaded</small>
                        </h3>
                    </div>
                    <Row className='mt-3'>
                        <Col>
                            <DetailSuspence
                                query={totalEntities}
                                buildCallback={(data) =>
                                    formatNum(data.rows[0][0] || 0)
                                }
                            />
                            <br />
                            <strong>Datasets/Data Uploads</strong>
                        </Col>
                    </Row>
                    <Row className='mt-3'>
                        <Col span={12}>
                            <span>
                                <DetailSuspence
                                    query={totalDownloadsQuery}
                                    buildCallback={(data) =>
                                        formatNum(data.rows[0][0] || 0)
                                    }
                                />
                                &nbsp;
                                <Tooltip
                                    placement='right'
                                    title={`Estimated total number of files downloaded.`}
                                >
                                    <InfoCircleOutlined />
                                </Tooltip>
                            </span>
                            <br />
                            <strong>Files downloaded</strong>
                        </Col>
                    </Row>
                </>
            )
        }

        const apiUsageCardSummary = () => {
            const totalEntities = SQL.apiUsage.summary({ from, to })
            return (
                <>
                    <DetailSuspence
                        query={totalEntities}
                        suspenseFallback={
                            <ApiUsageSummary
                                skeleton={true}
                                data={{
                                    totalHits: 0,
                                    services: [
                                        ['Service 1', 0],
                                        ['Service 2', 0],
                                        ['Service 3', 0]
                                    ]
                                }}
                            />
                        }
                        buildCallback={(data) => {
                            const totalHits = data.rows.reduce(
                                (total, subArray) => total + (subArray[1] || 0),
                                0
                            )
                            return (
                                <ApiUsageSummary
                                    data={{ totalHits, services: data.rows }}
                                />
                            )
                        }}
                    />
                </>
            )
        }

        const getCardDetail = () => {
            if (cardType.isFiles(cardKey)) {
                return fileDownloadsCardSummary()
            } else if (cardType.isApi(cardKey)) {
                return apiUsageCardSummary()
            }
            return null
        }

        return (
            <Card
                className={`c-logCard c-logCard--${cardKey} ${cardKey == tabName ? 'is-highlighted' : ''}`}
                extra={
                    <>
                        <span className='pull-right c-logCard__spinner'>
                            <Spin size='small' />
                        </span>
                    </>
                }
                title={title}
                key={cardKey}
                variant='borderless'
                onClick={(e) => highlightSection(e, cardKey)}
            >
                {getCardDetail()}
            </Card>
        )
    }
)

export default UsageAnalyticsSummaryCard
