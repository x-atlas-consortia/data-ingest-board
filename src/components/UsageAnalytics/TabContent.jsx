import React, { memo } from 'react'
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons'
import SQL, { indexFixtures } from '@/lib/helpers/sql'
import TinyCard from '@/components/UsageAnalytics/TinyCard'
import {
    formatNum,
    formatBytes,
    roundToTheNearest
} from '@/lib/helpers/general'
import FileDownloads from '@/components/UsageAnalytics/FileDownloads'
import ApiRequests from '@/components/UsageAnalytics/ApiRequests'
import {Tooltip} from 'antd'

const TabContent = memo(({ tabKey, cardType, from, to }) => {
    const performancePercentage = (dataNow, dataPrev, cardConfig) => {
        const perc =
            ((dataNow.rows[0][0] - dataPrev.rows[0][0]) / dataPrev.rows[0][0]) *
            100
        return (
            <span>
                {' '}
                {perc > 0 ? (
                    <ArrowUpOutlined style={{ color: cardConfig?.negative ? 'red' : 'green' }} />
                ) : (
                    <ArrowDownOutlined style={{ color: 'red' }} />
                )}{' '}
                <span
                    style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: perc > 0 && !cardConfig?.negative ? 'green' : 'red'
                    }}
                >
                    {perc.toFixed(2)} %
                </span>
            </span>
        )
    }
    const _months = {
        apiRequests: 1,
        fileDownloads: 12
    }
    const _tabs = {
        apiRequests: {
            title: 'API usage',
            lastXMonths: {
                totalRequests: {
                    title: `Total requests, last ${'month'.plural(_months.apiRequests)}`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                clientIps: {
                    title: `Client IPs, last ${'month'.plural(_months.apiRequests)}`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                entitiesRequested: {
                    title: `Entities requested, last ${'month'.plural(_months.apiRequests)}`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                errorRate: {
                    negative: true,
                    title: `Error rate, last ${'month'.plural(_months.apiRequests)}`,
                    formatter: (data) => `${data.rows[0][0]} %`
                },
                serverErrors: {
                    negative: true,
                    title: `Server errors, last ${'month'.plural(_months.apiRequests)}`,
                    debug: true,
                    formatter: (data) => `${data.rows[0][0]} %`
                }
            }
        },
        fileDownloads: {
            title: 'File download usage',
            lastXMonths: {
                totalBytesTransferred: {
                    title: `Data transferred, last ${'month'.plural(_months.fileDownloads)}`,
                    formatter: (data) => formatBytes(data.rows[0][0])
                },
                filesDownloaded: {
                    title: `Files downloaded, last ${'month'.plural(_months.fileDownloads)}`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                uniqueUsers: {
                    title: `Distinct users, last ${'month'.plural(_months.fileDownloads)}`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                uniqueOrganizations: {
                    title: `Organizations, last ${'month'.plural(_months.fileDownloads)}`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                uniqueCountries: {
                    title: `Countries, last ${'month'.plural(_months.fileDownloads)}`,
                    formatter: (data) => formatNum(data.rows[0][0])
                },
                uniqueEntities: {
                    title: `Datasets touched, last ${'month'.plural(_months.fileDownloads)}`,
                    formatter: (data) => formatNum(data.rows[0][0])
                }
            }
        }
    }

    const getLastMonthName = (months) => {
        const now = new Date()
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - months, 1);
        return firstDayLastMonth.toLocaleString('default', { month: 'short' })
    }

    const getApiTinyCardFooter = (data, dataPrev, cardKey) => {
        const cardConfig = _tabs.apiRequests.lastXMonths[cardKey]
        let months = _months.apiRequests
        const months2 = months * 2
        const numStr = dataPrev.rows[0][0].toString()
        let decimalPlaces = 1
        if (numStr.includes('.')) {
            decimalPlaces = numStr.split('.')[1]?.length
        }
        return (<>
            {performancePercentage(data, dataPrev, cardConfig)}
            <span> vs <Tooltip title={formatNum(dataPrev.rows[0][0], decimalPlaces)}><span style={{ textDecoration: 'underline', textDecorationColor: 'blue' }}>{getLastMonthName(months2)}</span></Tooltip></span>
        </>)
      
    }

    const getTabContent = () => {
        const tinyCards = []
        if (cardType.isApi(tabKey)) {
            let months = _months.apiRequests
            const months2 = months * 2
            for (const q in SQL.apiRequests.lastXMonths) {
                if (_tabs.apiRequests.lastXMonths[q].debug) {
                    console.log('SQL', SQL.apiRequests.lastXMonths[q]({ months }), SQL.apiRequests.priorToLastXMonths[q]({
                                months1: months,
                                months2
                            }))
                }
                tinyCards.push(
                    <div key={q} className='col-md-2'>
                        <TinyCard
                            cardKey={q}
                            query={SQL.apiRequests.lastXMonths[q]({ months })}
                            query2={SQL.apiRequests.priorToLastXMonths[q]({
                                months1: months,
                                months2
                            })}
                            title={_tabs.apiRequests.lastXMonths[q].title}
                            formatter={
                                _tabs.apiRequests.lastXMonths[q].formatter
                            }
                            footer={
                                _tabs.apiRequests.lastXMonths[q].footer ||
                                ``
                            }
                            formatter2={
                                _tabs.apiRequests.lastXMonths[q].formatter2 || getApiTinyCardFooter
                            }
                        />
                    </div>
                )
            }
            
            return <div className='row g-3'>{tinyCards}<ApiRequests from={from} to={to} /></div>
        }
        if (cardType.isFiles(tabKey)) {
            let months = _months.fileDownloads
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
            
            return <div className='row g-3'>{tinyCards}<FileDownloads from={from} to={to} /></div>
        }
    }
    return (
        <div>
            <h2 className='h4'>{_tabs[tabKey]?.title}</h2>
            {getTabContent()}
        </div>
    )
})

export default TabContent
