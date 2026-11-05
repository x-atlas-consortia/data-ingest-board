import React from 'react'
import {
    DownloadOutlined,
    ApiOutlined,
    CodeOutlined,
    CalendarOutlined,
    ExclamationCircleFilled,
    MinusOutlined,
    PlusOutlined,
    InfoCircleOutline,
    ArrowUpOutlined,
    ArrowDownOutlined
} from '@ant-design/icons'
import SQL, { indexFixtures } from '@/lib/helpers/sql'
import TinyCard from '@/components/UsageAnalytics/TinyCard'
import {
    formatNum,
    formatBytes,
    roundToTheNearest
} from '@/lib/helpers/general'
import { Tabs } from 'antd'

const TabContent = ({ tabKey, cardType }) => {
    const performancePercentage = (dataNow, dataPrev) => {
        const perc =
            ((dataNow.rows[0][0] - dataPrev.rows[0][0]) / dataPrev.rows[0][0]) *
            100
        return (
            <span>
                {' '}
                {perc > 0 ? (
                    <ArrowUpOutlined style={{ color: 'green' }} />
                ) : (
                    <ArrowDownOutlined style={{ color: 'red' }} />
                )}{' '}
                <span
                    style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: perc > 0 ? 'green' : 'red'
                    }}
                >
                    {perc.toFixed(2)} %
                </span>
            </span>
        )
    }
    const months = 12
    const _tabs = {
        apiUsage: {
            title: 'API usage',
            lastXMonths: {}
        },
        fileDownloads: {
            title: 'File download usage',
            lastXMonths: {
                totalBytesTransferred: {
                    title: `Data transferred, last ${months} months`,
                    formatter: (data) => formatBytes(data.rows[0][0])
                },
                filesDownloaded: {
                    title: `Files downloaded, last ${months} months`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                uniqueUsers: {
                    title: `Distinct users, last ${months} months`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                uniqueOrganizations: {
                    title: `Organizations, last ${months} months`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                uniqueCountries: {
                    title: `Countries, last ${months} months`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                uniqueEntities: {
                    title: `Datasets touched, last ${months} months`,
                    formatter: (data) => formatNum(data.rows[0][0])
                }
            }
        }
    }

    const getTabContent = () => {
        const tinyCards = []
        if (cardType.isApi(tabKey)) {
            return <TinyCard cardKey={tabKey} />
        }
        if (cardType.isFiles(tabKey)) {
            for (const q in SQL.fileDownloads.lastXMonths) {
                tinyCards.push(
                    <div key={q} className='col-md-2'>
                        <TinyCard
                            cardKey={tabKey}
                            query={SQL.fileDownloads.lastXMonths[q]({ months })}
                            query2={SQL.fileDownloads.priorToLastXMonths[q]({
                                months
                            })}
                            title={_tabs.fileDownloads.lastXMonths[q].title}
                            formatter={
                                _tabs.fileDownloads.lastXMonths[q].formatter
                            }
                            footer={
                                _tabs.fileDownloads.lastXMonths[q].footer ||
                                `vs prior ${months} months`
                            }
                            formatter2={
                                _tabs.fileDownloads.lastXMonths[q].formatter2 ||
                                performancePercentage
                            }
                        />
                    </div>
                )
            }
            return <div className='row g-3'>{tinyCards}</div>
        }
    }
    return (
        <div>
            <h2 className='h4'>{_tabs[tabKey]?.title}</h2>
            {getTabContent()}
        </div>
    )
}

export default TabContent
