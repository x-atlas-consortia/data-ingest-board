import React, { useState, useEffect } from "react";
import axios from "axios";
import {Table, Button, Dropdown, Menu} from "antd";
import { ExportOutlined} from "@ant-design/icons";
import {Span} from "next/dist/server/lib/trace/tracer";

const DatasetTable = ({ data, loading, handleTableChange, page, pageSize, sortField, sortOrder, filters, className}) => {
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
        if (field === "organ"){
            defaultSortOrder["organ"] = order;
        }
        if (field === "organ_hubmap_id"){
            defaultSortOrder["organ_hubmap_id"] = order;
        }
        if (field === "data_types"){
            defaultSortOrder["data_types"] = order;
        }
        if (field === "descendants"){
            defaultSortOrder["descendants"] = order;
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
    if (filters.hasOwnProperty("organ")) {
        defaultFilteredValue["organ"] = filters["organ"].split(",");
    }
    if (filters.hasOwnProperty("data_types")) {
        defaultFilteredValue["data_types"] = filters["data_types"].split(",");
    }

    const renderDropdownContent = (record) => (
        <Menu>
            <Menu.Item key="1">
                <a href={record.portal_url} target="_blank" rel="noopener noreferrer">Data Portal</a>
            </Menu.Item>
            <Menu.Item key="2">
                <a href={record.ingest_url} target="_blank" rel="noopener noreferrer">Ingest Portal</a>
            </Menu.Item>
            <Menu.Item key="3">
                <a href={record.globus_url} target="_blank" rel="noopener noreferrer">Globus Directory</a>
            </Menu.Item>
        </Menu>
);

    const datasetColumns = [
        {
            title: "HuBMAP ID",
            width: 175,
            dataIndex: "hubmap_id",
            align: "left",
            defaultSortOrder: defaultSortOrder["hubmap_id"] || null,
            sorter: (a,b) => a.hubmap_id.localeCompare(b.hubmap_id),
            ellipsis: true,
            render: (hubmapId, record) => (
                <Dropdown overlay={renderDropdownContent(record)} trigger={['click']}>
                    <a href="#">{hubmapId}<ExportOutlined /></a>
                </Dropdown>
            )
        },
        {
            title: "Group Name",
            width: 300,
            dataIndex: "group_name",
            align: "left",
            defaultSortOrder: defaultSortOrder["group_name"] || null,
            sorter: (a,b) => a.group_name.localeCompare(b.group_name),
            defaultFilteredValue: defaultFilteredValue["group_name"] || null,
            filters: uniqueGroupNames.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => record.group_name.toLowerCase() === value.toLowerCase(),
            ellipsis: true,
        },
        {
            title: "Status",
            width: 150,
            dataIndex: "status",
            align: "left",
            defaultSortOrder: defaultSortOrder["status"] || null,
            sorter: (a,b) => a.status.localeCompare(b.status),
            defaultFilteredValue: defaultFilteredValue["status"] || null,
            ellipsis: true,
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
            title: "Data Types",
            width: 150,
            dataIndex: "data_types",
            align: "left",
            defaultSortOrder: defaultSortOrder["data_types"] || null,
            sorter: (a,b) => a.data_types.localeCompare(b.data_types),
            defaultFilteredValue: defaultFilteredValue["data_types"] || null,
            filters: uniqueDataType.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => record.data_types.toLowerCase() === value.toLowerCase(),
            ellipsis: true,
        },
        {
            title: "Organ Type",
            width: 150,
            dataIndex: "organ",
            align: "left",
            defaultSortOrder: defaultSortOrder["organ"] || null,
            sorter: (a,b) => a.organ.localeCompare(b.organ),
            defaultFilteredValue: defaultFilteredValue["organ"] || null,
            filters: uniqueOrganType.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => record.organ.toLowerCase() === value.toLowerCase(),
            ellipsis: true,
        },
        {
            title: "Organ Hubmap Id",
            width: 175,
            dataIndex: "organ_hubmap_id",
            align: "left",
            defaultSortOrder: defaultSortOrder['organ_hubmap_id'] || null,
            sorter: (a,b) => a.organ_hubmap_id.localeCompare(b.organ_hubmap_id),
            ellipsis: true,
            render: (organHubmapId, record) => {
                if (!organHubmapId.trim()) {
                    return null;
                }
                return (
                    <a href={record.organ_portal_url} target="_blank" rel="noopener noreferrer">{organHubmapId}<ExportOutlined /></a>
                );
            }
        },
        {
            title: "Provider Experiment ID",
            width: 200,
            dataIndex: "provider_experiment_id",
            align: "left",
            defaultSortOrder: defaultSortOrder["provider_experiment_id"] || null,
            sorter: (a,b) => a.provider_experiment_id.localeCompare(b.provider_experiment_id),
            ellipsis: true,
        },
        {
            title: "Last Touch",
            width: 225,
            dataIndex: "last_touch",
            align: "left",
            defaultSortOrder: defaultSortOrder["last_touch"] || null,
            sorter: (a,b) => new Date(a.last_touch) - new Date(b.last_touch),
            ellipsis: true,
        },
        {
            title: "Has Contacts",
            width: 150,
            dataIndex: "has_contacts",
            align: "left",
            defaultSortOrder: defaultSortOrder["has_contacts"] || null,
            sorter: (a,b) => b.has_contacts.localeCompare(a.has_contacts),
            ellipsis: true,
        },
        {
            title: "Has Contributors",
            width: 175,
            dataIndex: "has_contributors",
            align: "left",
            defaultSortOrder: defaultSortOrder["has_contributors"] || null,
            sorter: (a,b) => b.has_contributors.localeCompare(a.has_contributors),
            ellipsis: true,
        },
        {
            title: "Donor HuBMAP ID",
            width: 175,
            dataIndex: "donor_hubmap_id",
            align: "left",
            defaultSortOrder: defaultSortOrder["donor_hubmap_id"] || null,
            sorter: (a,b) => a.donor_hubmap_id.localeCompare(b.donor_hubmap_id),
            ellipsis: true,
        },{
            title: "Donor Submission ID",
            width: 200,
            dataIndex: "donor_submission_id",
            align: "left",
            defaultSortOrder: defaultSortOrder["donor_submission_id"] || null,
            sorter: (a,b) => a.donor_submission_id.localeCompare(b.donor_submission_id),
            ellipsis: true,
        },
        {
            title: "Donor Lab ID",
            width: 150,
            dataIndex: "donor_lab_id",
            align: "left",
            defaultSortOrder: defaultSortOrder["donor_lab_id"] || null,
            sorter: (a,b) => a.donor_lab_id.localeCompare(b.donor_lab_id),
            ellipsis: true,
        },
        {
            title: "Has Donor Metadata",
            width: 200,
            dataIndex: "has_metadata",
            align: "left",
            defaultSortOrder: defaultSortOrder["has_donor_metadata"] || null,
            sorter: (a,b) => b.has_metadata.localeCompare(a.has_metadata),
            ellipsis: true,
        },
        {
            title: "Upload",
            width: 175,
            dataIndex: "upload",
            align: "left",
            defaultSortOrder: defaultSortOrder["upload"] || null,
            sorter: (a,b) => a.upload.localeCompare(b.upload),
            ellipsis: true,
        },
        {
            title: "Has Rui Info",
            width: 150,
            dataIndex: "has_rui_info",
            align: "left",
            defaultSortOrder: defaultSortOrder["has_rui_info"] || null,
            sorter: (a,b) => b.has_rui_info.localeCompare(a.has_rui_info),
            ellipsis: true,
        },
        {
            title: "Has Data",
            width: 125,
            dataIndex: "has_data",
            align: "left",
            defaultSortOrder: defaultSortOrder["has_data"] || null,
            sorter: (a,b) => b.has_data.localeCompare(a.has_data),
            ellipsis: true,
        },
    ]

    const dataIndexList = datasetColumns.map(column => column.dataIndex);

    function countFilteredRecords(data, filters) {
        const filteredData = data.filter(item => {
            for (const key in filters) {
                if (!dataIndexList.includes(key)) {
                    continue;
                }
                const filterValue = filters[key].toLowerCase();
                const filterValues = filterValue.split(",");
                if (filterValues.includes("unpublished")) {
                    if (item[key].toLowerCase() === "published") {
                        return false;
                    }
                } else if (item[key] && !filterValues.some(value => item[key].toLowerCase() === value)) {
                    return false;
                } else if (!item[key]) {
                    return false;
                }
            }
            return true;
        });
        return filteredData.length;
    }

    return (
        <div>
            <div className="row">
                {!loading && (
                    <p className="col count mt-md-3 mt-lg-3">
                        {countFilteredRecords(data, filters)} Selected
                    </p>
                )}
            </div>
            <Table className="m-4"
                columns={datasetColumns}
                dataSource={data}
                showHeader={!loading}
                bordered={false}
                loading={loading}
                pagination={{ position: ["topRight", "bottomRight"], current: page, defaultPageSize: pageSize}}
                scroll={{ x: 1500, y: 1500 }}
                onChange={handleTableChange}
                rowKey="hubmap_id"
            />
        </div>
    );
};

const UploadTable = ({ data, loading, filterUploads, uploadData, datasetData, handleTableChange, page, pageSize, sortField, sortOrder, filters, className}) => {
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

    const renderDropdownContent = (record) => {
        const showGlobusUrl = record.status.toLowerCase() !== 'reorganized';
        return (
            <Menu>
                <Menu.Item key="1">
                    <a href={record.ingest_url} target="_blank" rel="noopener noreferrer">Data Portal</a>
                </Menu.Item>
                {showGlobusUrl && (
                    <Menu.Item key="2">
                    <a href={record.globus_url} target="_blank" rel="noopener noreferrer">Globus Directory</a>
                </Menu.Item>
                )}

                <Menu.Item key="3">
                    <Button onClick={() => {
                        const hm_uuid = record.uuid.trim();
                        filterUploads(uploadData, datasetData, hm_uuid);
                        window.history.pushState(null, null, `/?upload_id=${record.hubmap_id}`)
                    }}>
                        Show Datasets
                    </Button>
                </Menu.Item>

            </Menu>
        );
    };
    const uploadColumns = [
        {
            title: "HuBMAP ID",
            width: '15%',
            dataIndex: "hubmap_id",
            align: "left",
            defaultSortOrder: defaultSortOrder["hubmap_id"] || null,
            sorter: (a,b) => a.hubmap_id.localeCompare(b.hubmap_id),
            ellipsis: true,
            render: (hubmapId, record) => (
                <Dropdown overlay={renderDropdownContent(record)} trigger={['click']}>
                    <a href="#">{hubmapId}<ExportOutlined /></a>
                </Dropdown>
            )
        },
        {
            title: "Group Name",
            width: '25%',
            dataIndex: "group_name",
            align: "left",
            defaultSortOrder: defaultSortOrder["group_name"] || null,
            sorter: (a,b) => a.group_name.localeCompare(b.group_name),
            defaultFilteredValue: defaultFilteredValue["group_name"] || null,
            filters: uniqueGroupNames.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => record.group_name.toLowerCase() === value.toLowerCase(),
            ellipsis: true,
        },
        {
            title: "Status",
            width: '10%',
            dataIndex: "status",
            align: "left",
            defaultSortOrder: defaultSortOrder["status"] || null,
            sorter: (a,b) => a.status.localeCompare(b.status),
            defaultFilteredValue: defaultFilteredValue["status"] || null,
            ellipsis: true,
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
                    return record.status.toLowerCase() !== 'reorganized';
                }
                return record.status.toLowerCase() === value.toLowerCase();
            }
        },
        {
            title: "Title",
            width: '25%',
            dataIndex: "title",
            align: "left",
            defaultSortOrder: defaultSortOrder["title"] || null,
            sorter: (a,b) => a.title.localeCompare(b.title),
            ellipsis: true,
        },
        {
            title: "UUID",
            width: '25%',
            dataIndex: "uuid",
            align: "left",
            defaultSortOrder: defaultSortOrder["uuid"] || null,
            sorter: (a,b) => a.uuid.localeCompare(b.uuid),
            ellipsis: true,
        },
    ];

    const dataIndexList = uploadColumns.map(column => column.dataIndex);

    function countFilteredRecords(data, filters) {
        const filteredData = data.filter(item => {
            for (const key in filters) {
                if (!dataIndexList.includes(key)) {
                    continue;
                }
                const filterValue = filters[key].toLowerCase();
                const filterValues = filterValue.split(",");
                if (filterValues.includes("unreorganized")) {
                    if (item[key].toLowerCase() === "reorganized") {
                        return false;
                    }
                } else if (item[key] && !filterValues.some(value => item[key].toLowerCase() === value)) {
                    return false;
                } else if (!item[key]) {
                    return false;
                }
            }
            return true;
        });
        return filteredData.length;
    }

    return (
        <div>
            <div className="row">
                {!loading && (
                    <p className="col count mt-md-3 mt-lg-3">
                        {countFilteredRecords(data, filters)} Selected
                    </p>
                )}
            </div>
            <Table className="m-4"
                columns={uploadColumns}
                showHeader={!loading}
                dataSource={data}
                bordered={false}
                loading={loading}
                pagination={{ position: ["topRight", "bottomRight"], current: page, defaultPageSize: pageSize}}
                scroll={{ x: 1000 }}
                onChange={handleTableChange}
                rowKey="hubmap_id"
            />
        </div>
    );
};

const DataTable = (props) => {
    const [datasetData, setDatasetData] = useState([]);
    const [datasetCount, setDatasetCount] = useState(0);
    const [uploadCount, setUploadCount] = useState(0);
    const [uploadData, setUploadData] = useState([]);
    const [primaryData, setPrimaryData] = useState([]);
    const [originalPrimaryData, setOriginalPrimaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [useDatasetApi, setUseDatasetApi] = useState(props.entityType !== 'uploads');
    const [selectUploadId, setSelectUploadId] = useState(props.selectUploadId);
    const [invalidUploadId, setInvalidUploadId] = useState(false);
    const [page, setPage] = useState(props.initialPage);
    const [pageSize, setPageSize] = useState(props.pageSize !== undefined ? props.pageSize : 10);
    const [sortField, setSortField] = useState(props.sortField);
    const [sortOrder, setSortOrder] = useState(props.sortOrder);
    const [filters, setFilters] = useState(props.tableFilters);
    const [globusToken, setGlobusToken] = useState(props.globusToken);
    const [tableKey, setTableKey] = useState('initialKey');
    const datasetUrl = process.env.NEXT_PUBLIC_DATASET_URL;
    const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_URL;
    useEffect(() => {
        loadData();
    }, []);
    const handleTableChange = (pagination, filters, sorter, { currentDataSource }) => {
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

        if (useDatasetApi) {
            const filteredDatasets = currentDataSource || [];
            setDatasetCount(filteredDatasets.length)
        } else {
            const filteredUploads = currentDataSource || [];
            setUploadCount(filteredUploads.length);
        }

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
                setPrimaryData(filteredDatasets);
                setSelectUploadId(uploadId);
                setUseDatasetApi(true);
                setInvalidUploadId(false);
                window.history.pushState(null, null, `/?upload_id=${uploadId}`)
            }
            else if (typeof matchingUpload === 'undefined') {
                setInvalidUploadId(true);
            }
        }
    }

    const getPrimaryDatasets = (dataResponse) => {
        return dataResponse.filter(dataset => dataset.is_primary === "true");
    }

    const addDescendants = (datasetResponse) => {
        return datasetResponse.map(dataset => {
            const descendantsArray = dataset.descendant_datasets ? dataset.descendant_datasets.split(",") : [];
            let descendant = "";
            if (descendantsArray.length === 1) {
                descendant = descendantsArray[0];
            } else if (descendantsArray.length > 1) {
                descendant = descendantsArray.length.toString();
            }
            return {
                ...dataset,
                descendants: descendant
            };
        });
    }

    const loadData = async () => {
        setLoading(true);
        const options = {
            headers: {
            Authorization:
            "Bearer " + globusToken,
            "Content-Type": "application/json"
            }
        };
        try {
            const datasetResponse = await axios.get(datasetUrl, options);
            const uploadResponse = await axios.get(uploadUrl, options);
            const datasetsWithDescendants = addDescendants(datasetResponse.data);
            const primaryDatasets = getPrimaryDatasets(datasetsWithDescendants);
            setDatasetData(datasetsWithDescendants);
            setDatasetCount(primaryDatasets.length);
            setUploadCount(uploadResponse.data.length);
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
        setPage(1);
        setPageSize( 10);
        setDatasetCount(primaryData.length);
        setUploadCount(uploadData.length);
    };

    const clearAll = () => {
        setInvalidUploadId(false);
        if (!useDatasetApi) {
            window.history.pushState(null, null, `/?entity_type=uploads`)
        } else {
            window.history.pushState(null, null, `/`)
        }
        setPrimaryData(originalPrimaryData);
        setFilters({});
        setSortField(undefined);
        setSortOrder(undefined);
        setPage(1);
        setPageSize( 10);
        setDatasetCount(primaryData.length);
        setUploadCount(uploadData.length);
        setTableKey(prevKey => prevKey === 'initialKey' ? 'updatedKey' : 'initialKey');

    };
    const table = useDatasetApi ? (
        <DatasetTable
            key={tableKey}
            data={primaryData}
            loading={loading}
            handleTableChange={handleTableChange}
            page={page}
            pageSize={pageSize}
            sortField={sortField}
            sortOrder={sortOrder}
            filters={filters}
        />
    ) : (
        <UploadTable
            key={tableKey}
            data={uploadData}
            loading={loading}
            filterUploads={filterUploads}
            uploadData={uploadData}
            datasetData={originalPrimaryData}
            handleTableChange={handleTableChange}
            page={page}
            pageSize={pageSize}
            sortField={sortField}
            sortOrder={sortOrder}
            filters={filters}
        />
    );

    return (
        <div className="DataTable container">
            <div className="row">
                <h2 className="CurrentEntity col text-center m-3">
                    {useDatasetApi ? "Datasets" : "Uploads"}
                </h2>
            </div>
            {invalidUploadId && <p style={{ color: "red" }}>Upload ID Not Found</p>}
            <div className="row">
                <button className="Button Switch col-3 offset-3" onClick={toggleApi}>
                    {useDatasetApi ? "SWITCH TO UPLOADS" : 'SWITCH TO DATASETS'}
                </button>
                <button className="Button Clear col-3" onClick={clearAll}>
                    {"CLEAR"}
                </button>
            </div>
            {table}
        </div>
    )
}

export default DataTable

