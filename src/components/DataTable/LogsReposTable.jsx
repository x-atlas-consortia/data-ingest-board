import { useEffect, useState, useContext, useRef } from "react";
import { Table, Button } from 'antd';
import ESQ from "@/lib/helpers/esq";
import ENVS from "@/lib/helpers/envs";
import { callService, formatNum, eq, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";

import LogsContext from "@/context/LogsContext";
import StackedBarWithLegend from "../Visualizations/StackedBarWithLegend";

const LogsReposTable = ({ }) => {
    const { globusToken } = useContext(AppContext)
    const {
        tableData, setTableData,
        isBusy, setIsBusy,
        hasMoreData, setHasMoreData,
        afterKey,
        numOfRows, 
        vizData, setVizData,
        updateTableData,
        fromDate, toDate,

    } = useContext(LogsContext)

    const subgroupLabels = useRef({})


    const fetchData = async (includePrevData = true) => {
        setIsBusy(true)
        let dataSize = numOfRows
        let i = 'logs-repos'
        let url = ENVS.urlFormat.search(`/${i}/search`)
        let q = ESQ.indexQueries({ from: fromDate, to: toDate, collapse: true, size: dataSize })[`${i}-table`]
        let headers = getHeadersWith(globusToken).headers

        if (afterKey.current !== null) {
            q.aggs.buckets.composite.after = afterKey.current
        }

        let res = await callService(url, headers, q, 'POST')
        let _data = res.data?.aggregations?.buckets

        let ids = []
        if (res.status === 200 && _data?.buckets.length) {

            afterKey.current = _data.after_key

            /// 

            let repo, types, r
            let repos = {}
            let list = _data?.buckets
            let _tableData = []

            if (list.length) {

                for (let d of list) {
                    types = d['type.keyword'].buckets
                    repo = d.key['repository.keyword']
                    repos[repo] = {}
                    for (let t of types) {
                        repos[repo] = { ...repos[repo], name: repo, [t.key]: { unique: t.unique.value, count: t.count.value } }
                    }

                    r = repos[repo]

                    _tableData.push(
                        {
                            name: repo,
                            views: r.view?.count || 0,
                            uniqueViews: r.view?.unique || 0,
                            clones: r.clone?.count || 0,
                            uniqueClones: r.clone?.unique || 0

                        })

                }
            }

            /// END

            updateTableData(includePrevData, _tableData)


        } else {
            setHasMoreData(false)
        }
        setIsBusy(false)
    }

    const cols = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Total Views',
            dataIndex: 'views',
            key: 'views',
            render: (v, r) => {
                return <span data-field="views">{formatNum(v)}</span>
            }
        },
        {
            title: 'Unique Views',
            dataIndex: 'uniqueViews',
            key: 'uniqueViews',
            render: (v, r) => {
                return <span data-field="uniqueViews">{formatNum(v)}</span>
            }
        },
        {
            title: 'Total Clones',
            dataIndex: 'clones',
            key: 'clones',
            render: (v, r) => {
                return <span data-field="clones">{v > 0 ? formatNum(v) : '-'}</span>
            }
        },
        {
            title: 'Unique Clones',
            dataIndex: 'uniqueClones',
            key: 'uniqueClones',
            render: (v, r) => {
                return <span data-field="uniqueClones">{v > 0 ? formatNum(v) : '-'}</span>
            }
        }
    ]

    useEffect(() => {
        setTableData([])
        setVizData([])
        afterKey.current = null
        fetchData(false)
    }, [fromDate, toDate])


    useEffect(() => {
        for (let c of cols) {
            subgroupLabels.current[c.dataIndex] = c.title
        }
    }, [])


    const rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            if (selectedRows.length < 10) {
                setVizData(selectedRows)
            }
            //console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
    };




    return (<>
        {vizData.length > 0 && <StackedBarWithLegend data={vizData} subGroupLabels={subgroupLabels.current} chartId={'repos'} />}

        <Table
            rowSelection={{ type: 'checkbox', ...rowSelection }}
            pagination={false}
            loading={isBusy}
            rowKey={'name'}
            scroll={{ y: 'calc(100vh - 200px)' }}
            dataSource={tableData} columns={cols} />
        {hasMoreData && <Button onClick={fetchData} type="primary" block>
            Load More
        </Button>}

    </>)
}

export default LogsReposTable;

