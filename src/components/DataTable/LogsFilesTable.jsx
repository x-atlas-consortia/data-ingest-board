import { useEffect, useState, useContext, useRef } from "react";
import TABLE from '@/lib/helpers/table';
import { Table } from 'antd';
import ESQ from "@/lib/helpers/esq";
import ENVS from "@/lib/helpers/envs";
import { callService, formatNum, getHeadersWith } from "@/lib/helpers/general";
import AppContext from "@/context/AppContext";
import IdLinkDropdown from "../IdLinkDropdown";

const LogsFilesTable = ({ fromDate, toDate }) => {

    const [tableData, setTableData] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const { globusToken } = useContext(AppContext)
    const adjustedForESPages = useRef(null)

    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            pageSize: 10,
        },
    });

    useEffect(()=> {
        adjustedForESPages.current = null
    }, [])

    const getESSearchable = async (totalEstimatedPages, url, headers, q, dataSize) => {
        // ES has a limitation in that depending on number of groups (cardinality) and 'size' parameter
        // pagination using 'from' parameter deep in results, may return 0 hits
        // so we need to get the actual offset from which ES will correctly return results.
        let searchablePage = totalEstimatedPages
        delete q.aggs.totalDatasets
        for (let i = totalEstimatedPages; i > 1; i--) {
            q.from = (i - 1) * dataSize
            let res = await callService(url, headers, q, 'POST')
            if (res.status === 200) {
                if (res.data.hits.hits.length > 0) {
                    searchablePage = i
                    break
                }
            }
        }
        adjustedForESPages.current = searchablePage * dataSize
    }

    const fetchData = async () => {
        setIsLoading(true)
        let dataSize = tableParams.pagination.pageSize
        let i = 'logs-file-downloads'
        let url = ENVS.urlFormat.search(`/${i}/search`)
        let q = ESQ.indexQueries({ from: fromDate, to: toDate, collapse: true, size: dataSize })[i]
        let headers = getHeadersWith(globusToken).headers
        q.size = dataSize
        q.from = (tableParams.pagination.current - 1) * dataSize
        q._source = ["dataset_uuid", "relative_file_path"]
        //q.aggs.groupSort = ESQ.groupSort({})
        delete q.aggs.totalBytes
        delete q.aggs.totalFiles
        // Get page for grouped Ids
        let res = await callService(url, headers, q, 'POST')
        let totalDatasets = 0

        let ids = []
        if (res.status === 200) {
         
            for (let d of res.data.hits.hits) {
                ids.push(d._source.dataset_uuid)
            }

            totalDatasets = res.data.aggregations.totalDatasets.value
            if (adjustedForESPages.current == null) {
               await getESSearchable(Math.ceil(totalDatasets/dataSize), url, headers, q, dataSize) 
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


            let _tableData = []
            q = ESQ.indexQueries({ list: ids, field: 'dataset_uuid' }).filter
            q.aggs = {
                datasetGroups: ESQ.bucket('dataset_uuid'),
            }
            let res2 = await callService(url, headers, q, 'POST')

            if (res2.status === 200) {
                for (let d of res2.data.aggregations.datasetGroups.buckets) {
                    _tableData.push(
                        {
                            files: d.doc_count,
                            uuid: d.key,
                            ...(entities[d.key] || {})
                        }
                    )

                }
            }
            setTableData(_tableData)

            setTableParams({
                ...tableParams,
                pagination: {
                    ...tableParams.pagination,
                    total: adjustedForESPages.current,
                },
            });
            setIsLoading(false)
        }
    }

    const cols = [
        {
            title: TABLE.cols.n('id'),
            dataIndex: 'entityId',
            key: 'entityId',
            render: (val, row) => {
                if (row.entityId) {
                    return <IdLinkDropdown data={{...row, [TABLE.cols.f('id')]: val}} />
                } else {
                    return <span className="text-muted">{row.uuid}</span>
                }
            }
        },
        {
            title: 'Dataset Type',
            dataIndex: 'datasetType',
            key: 'datasetType',
            width: '33%'
        },
        {
            title: 'Files Downloaded',
            dataIndex: 'files',
            key: 'files',
            defaultSortOrder: 'descend',
            render: (v, r) => {
                return <span data-field="files">{formatNum(v)}</span>
            }
        }
    ]

    useEffect(() => {
        fetchData()
    }, [
        tableParams.pagination?.current,
        tableParams.pagination?.pageSize,
        tableParams?.sortOrder,
        tableParams?.sortField,
        JSON.stringify(tableParams.filters),
    ])

    const rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        },
    };

    const handleTableChange = (pagination, filters, sorter) => {
        setTableParams({
            pagination,
            filters,
            sortOrder: Array.isArray(sorter) ? undefined : sorter.order,
            sortField: Array.isArray(sorter) ? undefined : sorter.field,
        });
       
        if (pagination.pageSize !== tableParams.pagination?.pageSize) {
            setTableData([])
        }
    };

    return (<>
        <Table
            rowSelection={{ type: 'checkbox', ...rowSelection }}
            pagination={tableParams.pagination}
            loading={isLoading}
            onChange={handleTableChange}
            rowKey={'uuid'}
            dataSource={tableData} columns={cols} />
    </>)
}

export default LogsFilesTable;

