import { useEffect, useState, useContext, useRef } from "react";
import TABLE from '@/lib/helpers/table';
import { Table, Button, Dropdown, Space, Popover } from 'antd';
import ESQ from "@/lib/helpers/esq";
import ENVS from "@/lib/helpers/envs";
import { callService, formatNum, formatBytes, eq, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import { SettingOutlined } from "@ant-design/icons";
import StackedBar, { prepareStackedData } from '@/components/Visualizations/Charts/StackedBar';
import { ChartProvider } from '@/context/ChartContext';

const LogsReposTable = ({ fromDate, toDate, setExtraActions, extraActions }) => {

    const [tableData, setTableData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const { globusToken } = useContext(AppContext)
    const [hasMoreData, setHasMoreData] = useState(true)
    const afterKey = useRef(null)
    const [tableType, setTableType] = useState('numOfRows')
    const [numOfRows, setNumOfRows] = useState(20)

    const fetchData = async () => {
        setIsLoading(true)
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

            let repo 
            let repos = {}
            let list = _data?.buckets
            let _tableData = []

            if (list.length) {
                for (let d of list) {
                    repo = d.key['repository.keyword']
                    repos[repo] = repos[repo] || {}
                    repos[repo] = { ...repos[repo], name: repo, [d.key['type.keyword']]: { unique: d.unique.value, count: d.count.value } }

                }

                for (let r of Object.values(repos)) {
                    _tableData.push(
                        {
                            name: r.name,
                            views: r.view?.count || 0,
                            uniqueViews: r.view?.unique || 0,
                            clones: r.clone?.count || 0,
                            uniqueClones: r.clone?.unique || 0

                        })
                }
            }

            /// END

            setTableData([...tableData, ..._tableData])

        } else {
            setHasMoreData(false)
        }
        setIsLoading(false)
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
        fetchData()
    }, [fromDate, toDate])

    const rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
    };

    const getMenuItemClassName = (s1, s2) => {
        return eq(s1, s2) ? 'is-active' : undefined
    }


    const getRowsPerLoadMore = () => {
        const ops = [10, 20, 50, 100, 200, 300]
        let r = []
        for (let o of ops) {
            r.push({
                key: o,
                label: o,
                className: getMenuItemClassName(numOfRows.toString(), o.toString())
            })
        }
        return r
    }

    const items = [
        {
            key: 'visualize',
            className: getMenuItemClassName(tableType, 'visualize'),
            label: 'Visualize',
        },
        {
            key: 'numOfRows',
            label: 'Rows Per Load More',
            children: getRowsPerLoadMore(),
        }
    ];

    const handleMenuClick = (e) => {

        if (e.keyPath.length > 1 && eq(e.keyPath[1], 'numOfRows')) {
            setNumOfRows(Number(e.key))
        } else {
            setTableType(e.key)
        }
    }

    const menuProps = {
        items,
        onClick: handleMenuClick,
    };

    useEffect(() => {
        setExtraActions({
            ...extraActions, 'tab-openSourceRepos': <div>
                <Dropdown menu={menuProps}>
                    <a onClick={e => e.preventDefault()}>
                        <Space>
                            Table Options
                            <SettingOutlined />
                        </Space>
                    </a>
                </Dropdown>
            </div>
        })
    }, [numOfRows, tableType])

    // TODO: 
    // onclick of table row, add modal with list of popular files and counts
    return (<>

        {tableData.length > 0 && <ChartProvider>
            <StackedBar data={prepareStackedData(Array.from(tableData))} chartId='modal' />
        </ChartProvider>}

        <Table
            rowSelection={{ type: 'checkbox', ...rowSelection }}
            pagination={false}
            loading={isLoading}
            rowKey={'uuid'}
            scroll={{ y: 'calc(100vh - 200px)' }}
            dataSource={tableData} columns={cols} />
        {hasMoreData && <Button onClick={fetchData} type="primary" block>
            Load More
        </Button>}

    </>)
}

export default LogsReposTable;

