import { useEffect, useState, useContext, useRef } from "react";
import TABLE from '@/lib/helpers/table';
import { Table, Button } from 'antd';
import ESQ from "@/lib/helpers/esq";
import ENVS from "@/lib/helpers/envs";
import { callService, formatNum, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import IdLinkDropdown from "../IdLinkDropdown";

const LogsFilesTable = ({ fromDate, toDate }) => {

    const [tableData, setTableData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const { globusToken } = useContext(AppContext)
    const [hasMoreData, setHasMoreData] = useState(true)
    const afterKey = useRef(null)

    const fetchData = async () => {
        setIsLoading(true)
        let dataSize = 10
        let i = 'logs-file-downloads'
        let url = ENVS.urlFormat.search(`/${i}/search`)
        let q = ESQ.indexQueries({ from: fromDate, to: toDate, collapse: true, size: dataSize })['filesBucketSearch']
        let headers = getHeadersWith(globusToken).headers

        if (afterKey.current !== null) {
            q.aggs.dataset_buckets.composite.after = afterKey.current
        }

        // Get page for grouped Ids
        let res = await callService(url, headers, q, 'POST')
        let _data = res.data?.aggregations?.dataset_buckets

        let ids = []
        if (res.status === 200 && _data?.buckets.length) {

            afterKey.current = _data.after_key

            for (let d of _data.buckets) {
                ids.push(d.key['dataset_uuid.keyword'])
            }

            // Find out info about these ids
            let entitiesSearch = await callService(ENVS.urlFormat.search(`/entities/search`),
                headers,
                ESQ.indexQueries({ list: ids }).filter,
                'POST')

            let entities = {}
            if (entitiesSearch.status == 200) {
                for (let d of entitiesSearch.data.hits.hits) {
                    entities[d._source.uuid] = {
                        entityId: d._source.hubmap_id, // TODO change to TABLE.col.f('id')
                        datasetType: d._source.dataset_type,
                    }
                }
            }

            let uuid
            let _tableData = []
            for (let d of _data.buckets) {
                uuid = d.key['dataset_uuid.keyword']
                _tableData.push(
                    {
                        files: d.doc_count,
                        uuid,
                        ...(entities[uuid] || {})
                    }
                )
            }

            setTableData([...tableData, ..._tableData])
            
        } else {
            setHasMoreData(false)
        }
        setIsLoading(false)
    }

    const cols = [
        {
            title: TABLE.cols.n('id'),
            dataIndex: 'entityId',
            key: 'entityId',
            render: (val, row) => {
                if (row.entityId) {
                    return <IdLinkDropdown data={{ ...row, [TABLE.cols.f('id')]: val }} />
                } else {
                    return <span className="text-muted">{row.uuid}</span>
                }
            }
        },
        {
            title: 'Dataset Type',
            dataIndex: 'datasetType',
            key: 'datasetType',
            width: '33%',
            sorter: (a, b) => a.datasetType?.localeCompare(b?.datasetType),
        },
        {
            title: 'Files Downloaded',
            dataIndex: 'files',
            key: 'files',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.files - b.files,
            render: (v, r) => {
                return <span data-field="files">{formatNum(v)}</span>
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

    return (<>

        <Table
            rowSelection={{ type: 'checkbox', ...rowSelection }}
            pagination={false}
            loading={isLoading}
            //onChange={handleTableChange}
            rowKey={'uuid'}
            scroll={{ y: 'calc(100vh - 200px)' }}
            dataSource={tableData} columns={cols} />
        {hasMoreData && <Button onClick={fetchData} type="primary" block>
            Load More
        </Button>}

    </>)
}

export default LogsFilesTable;

