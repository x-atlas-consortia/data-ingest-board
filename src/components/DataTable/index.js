import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button } from "antd";

const DatasetTable = ({ data, loading, handleTableChange, page, pageSize, sortField, sortOrder, filters}) => {
    const uniqueGroupNames = [...new Set(data.map(item => item.group_name))];
    const unfilteredOrganTypes = [...new Set(data.map(item => item.organ))];
    const uniqueOrganType = unfilteredOrganTypes.filter(name => name !== "" && name !== " ");
    const uniqueDataType = [...new Set(data.map(item => item.data_types))]
    let order = sortOrder;
    let field = sortField;
    if (typeof sortOrder === "object"){
        order = order[0];
    }
    if (typeof sortField === "object"){
        field = field[0];
    }
    let defaultFilteredValue = {};
    let defaultSortOrder = {};
    if (order && field && (order.toLowerCase() === "ascend" || order.toLowerCase() === "descend")){
        if (field === "hubmap_id"){
            defaultSortOrder["hubmap_id"] = order;
        }
        if (field === "group_name"){
            defaultSortOrder["group_name"] = order;
        }
        if (field === "status"){
            defaultSortOrder["status"] = order;
        }
        if (field === "organ_type"){
            defaultSortOrder["organ_type"] = order;
        }
        if (field === "data_types"){
            defaultSortOrder["data_types"] = order;
        }
        if (field === "provider_experiment_id"){
            defaultSortOrder["provider_experiment_id"] = order;
        }
        if (field === "last_touch"){
            defaultSortOrder["last_touch"] = order;
        }
        if (field === "has_contacts"){
            defaultSortOrder["has_contacts"] = order;
        }
        if (field === "has_contributors"){
            defaultSortOrder["has_contributors"] = order;
        }
        if (field === "donor_hubmap_id"){
            defaultSortOrder["donor_hubmap_id"] = order;
        }
        if (field === "donor_submission_id"){
            defaultSortOrder["donor_submission_id"] = order;
        }
        if (field === "donor_lab_id"){
            defaultSortOrder["donor_lab_id"] = order;
        }
        if (field === "has_donor_metadata"){
            defaultSortOrder["has_donor_metadata"] = order;
        }
        if (field === "parent_dataset"){
            defaultSortOrder["parent_dataset"] = order;
        }
        if (field === "upload"){
            defaultSortOrder["upload"] = order;
        }
        if (field === "has_rui_info"){
            defaultSortOrder["has_rui_info"] = order;
        }
        if (field === "has_data"){
            defaultSortOrder["has_data"] = order;
        }
        if (field === "globus_url"){
            defaultSortOrder["globus_url"] = order;
        }
        if (field === "portal_url"){
            defaultSortOrder["portal_url"] = order;
        }
        if (field === "ingest_url"){
            defaultSortOrder["ingest_url"] = order;
        }
    }
    if (filters.hasOwnProperty("group_name")) {
        defaultFilteredValue["group_name"] = filters["group_name"].split(",");
    }
    if (filters.hasOwnProperty("status")) {
        defaultFilteredValue["status"] = filters["status"].split(",");
    }
    if (filters.hasOwnProperty("organ_type")) {
        defaultFilteredValue["organ_type"] = filters["organ_type"].split(",");
    }
    if (filters.hasOwnProperty("data_types")) {
        defaultFilteredValue["data_types"] = filters["data_types"].split(",");
    }
    const datasetColumns = [
        {
            title: "HuBMAP ID",
            dataIndex: "hubmap_id",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["hubmap_id"] || null,
            sorter: (a,b) => a.hubmap_id.localeCompare(b.hubmap_id),
        },
        {
            title: "Group Name",
            dataIndex: "group_name",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["group_name"] || null,
            sorter: (a,b) => a.group_name.localeCompare(b.group_name),
            defaultFilteredValue: defaultFilteredValue["group_name"] || null,
            filters: uniqueGroupNames.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => record.group_name.toLowerCase() === value.toLowerCase(),
        },
        {
            title: "Status",
            dataIndex: "status",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["status"] || null,
            sorter: (a,b) => a.status.localeCompare(b.status),
            defaultFilteredValue: defaultFilteredValue["status"] || null,
            filters: [
                {text: 'Unpublished', value: 'Unpublished'},
                {text: 'Published', value: 'Published'},
                {text: 'QA', value: 'QA'},
                {text: 'Error', value: 'Error'},
                {text: 'Invalid', value: 'Invalid'},
                {text: 'New', value: 'New'},
                {text: 'Processing', value: 'Processing'},
                {text: 'Submitted', value: 'Submitted'}
            ],
            onFilter: (value, record) => {
                if (value === 'Unpublished') {
                    return record.status.toLowerCase() !== 'published';
                }
                return record.status.toLowerCase() === value.toLowerCase();
            }
        },
        {
            title: "Organ Type",
            dataIndex: "organ",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["organ_type"] || null,
            sorter: (a,b) => a.organ.localeCompare(b.organ),
            defaultFilteredValue: defaultFilteredValue["organ_type"] || null,
            filters: uniqueOrganType.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => record.organ.toLowerCase() === value.toLowerCase(),
        },
        {
            title: "Data Types",
            dataIndex: "data_types",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["data_types"] || null,
            sorter: (a,b) => a.data_types.localeCompare(b.data_types),
            defaultFilteredValue: defaultFilteredValue["data_types"] || null,
            filters: uniqueDataType.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => record.data_types.toLowerCase() === value.toLowerCase(),
        },
        {
            title: "Provider Experiment ID",
            dataIndex: "provider_experiment_id",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["provider_experiment_id"] || null,
            sorter: (a,b) => a.provider_experiment_id.localeCompare(b.provider_experiment_id),
        },
        {
            title: "Last Touch",
            dataIndex: "last_touch",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["last_touch"] || null,
            sorter: (a,b) => new Date(a.last_touch) - new Date(b.last_touch),
        },
        {
            title: "Has Contacts",
            dataIndex: "has_contacts",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["has_contacts"] || null,
            sorter: (a,b) => b.has_contacts.localeCompare(a.has_contacts),
        },
        {
            title: "Has Contributors",
            dataIndex: "has_contributors",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["has_contributors"] || null,
            sorter: (a,b) => b.has_contributors.localeCompare(a.has_contributors),
        },
        {
            title: "Donor HuBMAP ID",
            dataIndex: "donor_hubmap_id",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["donor_hubmap_id"] || null,
            sorter: (a,b) => a.donor_hubmap_id.localeCompare(b.donor_hubmap_id),
        },{
            title: "Donor Submission ID",
            dataIndex: "donor_submission_id",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["donor_submission_id"] || null,
            sorter: (a,b) => a.donor_submission_id.localeCompare(b.donor_submission_id),
        },
        {
            title: "Donor Lab ID",
            dataIndex: "donor_lab_id",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["donor_lab_id"] || null,
            sorter: (a,b) => a.donor_lab_id.localeCompare(b.donor_lab_id),
        },
        {
            title: "Has Donor Metadata",
            dataIndex: "has_metadata",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["has_donor_metadata"] || null,
            sorter: (a,b) => b.has_metadata.localeCompare(a.has_metadata),
        },
        {
            title: "Parent Dataset",
            dataIndex: "parent_dataset",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["parent_dataset"] || null,
            sorter: (a,b) => a.parent_dataset.localeCompare(b.parent_dataset),
        },
        {
            title: "Upload",
            dataIndex: "upload",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["upload"] || null,
            sorter: (a,b) => a.upload.localeCompare(b.upload),
        },
        {
            title: "Has Rui Info",
            dataIndex: "has_rui_info",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["has_rui_info"] || null,
            sorter: (a,b) => b.has_rui_info.localeCompare(a.has_rui_info),
        },
        {
            title: "Has Data",
            dataIndex: "has_data",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["has_data"] || null,
            sorter: (a,b) => b.has_data.localeCompare(a.has_data),
        },
        {
            title: "Globus URL",
            dataIndex: "globus_url",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["globus_url"] || null,
            sorter: (a,b) => a.globus_url.localeCompare(b.globus_url),
        },
        {
            title: "Portal URL",
            dataIndex: "portal_url",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["portal_url"] || null,
            sorter: (a,b) => a.globus_url.localeCompare(b.globus_url),
        },
        {
            title: "Ingest URL",
            dataIndex: "ingest_url",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["ingest_url"] || null,
            sorter: (a,b) => a.ingest_url.localeCompare(b.ingest_url),
        }
    ]

    return (
        <Table
            columns={datasetColumns}
            dataSource={data}
            bordered
            loading={loading}
            pagination={{ position: ["topRight", "bottomRight"], current: page, defaultPageSize: pageSize}}
            scroll={{ x: 1500 }}
            onChange={handleTableChange}
            rowKey="hubmap_id"
        />
    );
};

const UploadTable = ({ data, loading, filterUploads, uploadData, datasetData, handleTableChange, page, pageSize, sortField, sortOrder, filters}) => {
    const unfilteredGroupNames = [...new Set(data.map(item => item.group_name))];
    const uniqueGroupNames = unfilteredGroupNames.filter(name => name.trim() !== "" && name !== " ");
    let defaultFilteredValue = {};
    if (filters.hasOwnProperty("group_name")) {
        defaultFilteredValue["group_name"] = filters["group_name"].split(",");
    }
    if (filters.hasOwnProperty("status")) {
        defaultFilteredValue["status"] = filters["status"].split(",");
    }
    let order = sortOrder;
    let field = sortField;
    if (typeof sortOrder === "object"){
        order = order[0];
    }
    if (typeof sortField === "object"){
        field = field[0];
    }
    let defaultSortOrder = {};
    if (order && field && (order.toLowerCase() === "ascend" || order.toLowerCase() === "descend")) {
        if (field === "hubmap_id") {
            defaultSortOrder["hubmap_id"] = order;
        }
        if (field === "group_name") {
            defaultSortOrder["group_name"] = order;
        }
        if (field === "status") {
            defaultSortOrder["status"] = order;
        }
        if (field === "ingest_url") {
            defaultSortOrder["ingest_url"] = order;
        }
        if (field === "title") {
            defaultSortOrder["title"] = order;
        }
        if (field === "uuid") {
            defaultSortOrder["uuid"] = order;
        }
    }
    const uploadColumns = [
        {
            title: "HuBMAP ID",
            dataIndex: "hubmap_id",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["hubmap_id"] || null,
            sorter: (a,b) => a.hubmap_id.localeCompare(b.hubmap_id),
        },
        {
            title: "Group Name",
            dataIndex: "group_name",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["group_name"] || null,
            sorter: (a,b) => a.group_name.localeCompare(b.group_name),
            defaultFilteredValue: defaultFilteredValue["group_name"] || null,
            filters: uniqueGroupNames.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => record.group_name.toLowerCase() === value.toLowerCase(),
        },
        {
            title: "Status",
            dataIndex: "status",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["status"] || null,
            sorter: (a,b) => a.status.localeCompare(b.status),
            defaultFilteredValue: defaultFilteredValue["status"] || null,
            filters: [
                {text: 'Unreorganized', value: 'Unreorganized'},
                {text: 'Error', value: 'Error'},
                {text: 'Valid', value: 'Valid'},
                {text: 'Invalid', value: 'Invalid'},
                {text: 'New', value: 'New'},
                {text: 'Processing', value: 'Processing'},
                {text: 'Submitted', value: 'Submitted'},
                {text: 'Reorganized', value: 'Reorganized'},
            ],
            onFilter: (value, record) => {
                if (value === 'Unreorganized') {
                    return record.status.toLowerCase() !== 'Reorganized';
                }
                return record.status.toLowerCase() === value.toLowerCase();
            }
        },
        {
            title: "Ingest Url",
            dataIndex: "ingest_url",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["ingest_url"] || null,
            sorter: (a,b) => a.ingest_url.localeCompare(b.ingest_url),
        },
        {
            title: "Title",
            dataIndex: "title",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["title"] || null,
            sorter: (a,b) => a.title.localeCompare(b.title),
        },
        {
            title: "UUID",
            dataIndex: "uuid",
            align: "center",
            editTable: true,
            defaultSortOrder: defaultSortOrder["uuid"] || null,
            sorter: (a,b) => a.uuid.localeCompare(b.uuid),
        },
        {
            title: "Show Datasets",
            dataIndex: "show_datasets",
            render: (text, record) => (
                <Button onClick={() => {
                    const hm_uuid = record.uuid.trim();
                    filterUploads(uploadData, datasetData, hm_uuid);
                    window.history.pushState(null, null, `/?upload_id=${record.hubmap_id}`)
                }}>
                    Filter
                </Button>
            )
        }
    ];

    return (
        <Table
            columns={uploadColumns}
            dataSource={data}
            bordered
            loading={loading}
            pagination={{ position: ["topRight", "bottomRight"], current: page, defaultPageSize: pageSize}}
            scroll={{ x: 1500 }}
            onChange={handleTableChange}
            rowKey="hubmap_id"
        />
    );
};

const DataTable = (props) => {
    const [datasetData, setDatasetData] = useState([]);
    const [uploadData, setUploadData] = useState([]);
    const [primaryData, setPrimaryData] = useState([]);
    const [originalPrimaryData, setOriginalPrimaryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [useDatasetApi, setUseDatasetApi] = useState(props.entityType !== 'uploads');
    const [selectUploadId, setSelectUploadId] = useState(props.selectUploadId);
    const [invalidUploadId, setInvalidUploadId] = useState(false);
    const [page, setPage] = useState(props.initialPage);
    const [pageSize, setPageSize] = useState(props.pageSize !== undefined ? props.pageSize : 10);
    const [sortField, setSortField] = useState(props.sortField);
    const [sortOrder, setSortOrder] = useState(props.sortOrder);
    const [filters, setFilters] = useState(props.tableFilters);
    const datasetUrl = "http://localhost:8484/datasets/data-status";
    const uploadUrl = "http://localhost:8484/uploads/data-status";
    useEffect(() => {
        loadData();
    }, []);
    console.log(`filters: ${JSON.stringify(filters)}`);
    const handleTableChange = (pagination, filters, sorter) => {
        setPage(pagination.current)
        setPageSize(pagination.pageSize)
        let correctedFilters = {};
        for (let filter in filters) {
            if (filters[filter]) {
                correctedFilters[filter] = filters[filter];
            }
        }

        for (let correctedFilter in correctedFilters){
            if (Array.isArray(correctedFilters[correctedFilter])){
                correctedFilters[correctedFilter] = correctedFilters[correctedFilter].join(',');
            }
        }
        setFilters(correctedFilters);
        const query = new URLSearchParams(window.location.search);
        if (sorter.field) {
            query.set('sort_field', sorter.field);
            if (sorter.order) {
                query.set('sort_order', sorter.order);
            } else {
                query.delete('sort_field');
                query.delete('sort_order');
            }
        } else {
            query.delete('sort_field');
            query.delete('sort_order');
        }
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                query.set(key, filters[key].join(','));
            } else {
                query.delete(key);
            }
        });
        if (pagination.current && pagination.current !== 1) {
            query.set('page', pagination.current);
        } else {
            query.delete('page');
        }
        if (pagination.pageSize && pagination.pageSize !== 10) {
            query.set('page_size', pagination.pageSize);
        } else {
            query.delete('page_size');
        }
        window.history.pushState(null, null, `?${query.toString()}`);
    }

    const filterUploads = (uploadResponse, datasetResponse, uploadId) => {
        if (typeof uploadId !== 'undefined') {
            const matchingUpload = uploadResponse.find(upload => upload.uuid === uploadId || upload.hubmap_id === uploadId);
            if (typeof matchingUpload !== 'undefined') {
                const datasetsInUpload = matchingUpload.datasets;
                const listOfDatasets = datasetsInUpload.split(',').map(item => item.trim());
                const filteredDatasets = datasetResponse.filter((dataset) => listOfDatasets.includes(dataset.uuid));
                setDatasetData(filteredDatasets);
                setUseDatasetApi(true);
                setInvalidUploadId(false);
            }
            else if (typeof matchingUpload === 'undefined') {
                setInvalidUploadId(true);
            }
        }
    }

    const getPrimaryDatasets = (dataResponse) => {
        return dataResponse.filter(dataset => dataset.parent_dataset === null || dataset.parent_dataset === undefined || dataset.parent_dataset.trim() === "");
    }

    // const handleInitialProps = (sortField, sortOrder, page, pageSize, filters) => {
    //     setSorter({
    //         columnKey: sortField,
    //         sortOrder: sortOrder,
    //     });
    //     setPagination(current, pageSize);
    //     setFilter(filters);
    // }


    const loadData = async () => {
        setLoading(true);
        try {
            const datasetResponse = await axios.get(datasetUrl);
            const uploadResponse = await axios.get(uploadUrl);
            const primaryDatasets = getPrimaryDatasets(datasetResponse.data);
            setDatasetData(datasetResponse.data);
            setPrimaryData(primaryDatasets);
            setOriginalPrimaryData(primaryDatasets);
            setUploadData(uploadResponse.data);
            filterUploads(uploadResponse.data, datasetResponse.data, selectUploadId);
        } catch (error) {
        } finally {
        setLoading(false);
        }
    };

    const toggleApi = () => {
        setInvalidUploadId(false);
        setUseDatasetApi(!useDatasetApi);
        if (useDatasetApi) {
            window.history.pushState(null, null, `/?entity_type=uploads`)
        } else {
            window.history.pushState(null, null, `/`)
        }
        setFilters({});
        setSortField(undefined);
        setSortOrder(undefined);
        setPage(undefined);

    };
    //
    // const clearUploadFilter = () => {
    //     setSelectUploadId(undefined);
    //     setDatasetData(originalPrimaryData);
    // };
    const table = useDatasetApi ? (
        <DatasetTable
            data={primaryData}
            loading={loading}
            handleTableChange={handleTableChange}
            //handleInitialProps={handleInitialProps}
            page={page}
            pageSize={pageSize}
            sortField={sortField}
            sortOrder={sortOrder}
            filters={filters}
        />
    ) : (
        <UploadTable
            data={uploadData}
            loading={loading}
            filterUploads={filterUploads}
            uploadData={uploadData}
            datasetData={originalPrimaryData}
            handleTableChange={handleTableChange}
            //handleInitialProps={handleInitialProps}
            page={page}
            pageSize={pageSize}
            sortField={sortField}
            sortOrder={sortOrder}
            filters={filters}
        />
    );

    return (
        <div>
            <center>
                <h2>{useDatasetApi ? "Datasets" : "Uploads"}</h2>
            </center>
            {invalidUploadId && <p style={{ color: "red" }}>Upload ID Not Found</p>}
            <button onClick={toggleApi}>
                {useDatasetApi ? "Switch to Uploads Table" : 'Switch to Datasets Table'}
            </button>
            {/*<button>*/}
            {/*    onClick={clearUploadFilter}>*/}
            {/*</button>*/}
            {table}
        </div>
    )
}

export default DataTable

