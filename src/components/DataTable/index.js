import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button } from "antd";

const DatasetTable = ({ data, loading }) => {
    const uniqueGroupNames = [...new Set(data.map(item => item.group_name))];
    const unfilteredOrganTypes = [...new Set(data.map(item => item.organ))];
    const uniqueOrganType = unfilteredOrganTypes.filter(name => name !== "" && name !== " ");
    const uniqueDataType = [...new Set(data.map(item => item.data_types))]
    const datasetColumns = [
        {
            title: "HuBMAP ID",
            dataIndex: "hubmap_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.hubmap_id.localeCompare(b.hubmap_id),
        },
        {
            title: "Group Name",
            dataIndex: "group_name",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.group_name.localeCompare(b.group_name),
            filters: uniqueGroupNames.map(name => ({ text: name, value: name })),
            onFilter: (value, record) => record.group_name === value,
        },
        {
            title: "Status",
            dataIndex: "status",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.status.localeCompare(b.status),
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
                    return record.status !== 'Published';
                }
                return record.status === value;
            }
        },
        {
            title: "Organ Type",
            dataIndex: "organ",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.organ.localeCompare(b.organ),
            filters: uniqueOrganType.map(name => ({ text: name, value: name })),
            onFilter: (value, record) => record.organ === value,
        },
        {
            title: "Data Types",
            dataIndex: "data_types",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.data_types.localeCompare(b.data_types),
            filters: uniqueDataType.map(name => ({ text: name, value: name })),
            onFilter: (value, record) => record.data_types === value,
        },
        {
            title: "Provider Experiment ID",
            dataIndex: "provider_experiment_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.provider_experiment_id.localeCompare(b.provider_experiment_id),
        },
        {
            title: "Last Touch",
            dataIndex: "last_touch",
            align: "center",
            editTable: true,
            sorter: (a,b) => new Date(a.last_touch) - new Date(b.last_touch),
        },
        {
            title: "Has Contacts",
            dataIndex: "has_contacts",
            align: "center",
            editTable: true,
            sorter: (a,b) => b.has_contacts.localeCompare(a.has_contacts),
        },
        {
            title: "Has Contributors",
            dataIndex: "has_contributors",
            align: "center",
            editTable: true,
            sorter: (a,b) => b.has_contributors.localeCompare(a.has_contributors),
        },
        {
            title: "Donor HuBMAP ID",
            dataIndex: "donor_hubmap_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.donor_hubmap_id.localeCompare(b.donor_hubmap_id),
        },{
            title: "Donor Submission ID",
            dataIndex: "donor_submission_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.donor_submission_id.localeCompare(b.donor_submission_id),
        },
        {
            title: "Donor Lab ID",
            dataIndex: "donor_lab_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.donor_lab_id.localeCompare(b.donor_lab_id),
        },
        {
            title: "Has Donor Metadata",
            dataIndex: "has_metadata",
            align: "center",
            editTable: true,
            sorter: (a,b) => b.has_metadata.localeCompare(a.has_metadata),
        },
        {
            title: "Parent Dataset",
            dataIndex: "parent_dataset",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.parent_dataset.localeCompare(b.parent_dataset),
        },
        {
            title: "Upload",
            dataIndex: "upload",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.upload.localeCompare(b.upload),
        },
        {
            title: "Has Rui Info",
            dataIndex: "has_rui_info",
            align: "center",
            editTable: true,
            sorter: (a,b) => b.has_rui_info.localeCompare(a.has_rui_info),
        },
        {
            title: "Has Data",
            dataIndex: "has_data",
            align: "center",
            editTable: true,
            sorter: (a,b) => b.has_data.localeCompare(a.has_data),
        },
        {
            title: "Globus URL",
            dataIndex: "globus_url",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.globus_url.localeCompare(b.globus_url),
        },
        {
            title: "Portal URL",
            dataIndex: "portal_url",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.globus_url.localeCompare(b.globus_url),
        },
        {
            title: "Ingest URL",
            dataIndex: "ingest_url",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.ingest_url.localeCompare(b.ingest_url),
        }
    ]

    return (
        <Table
            columns={datasetColumns}
            dataSource={data}
            bordered
            loading={loading}
            pagination={{ position: ["topRight", "bottomRight"] }}
            scroll={{ x: 1500 }}
        />
    );
};

const UploadTable = ({ data, loading, filterUploads, uploadData, datasetData}) => {
    const uploadColumns = [
        {
            title: "HuBMAP ID",
            dataIndex: "hubmap_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.hubmap_id.localeCompare(b.hubmap_id),
            filter: true
        },
        {
            title: "Group Name",
            dataIndex: "group_name",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.group_name.localeCompare(b.group_name),
        },
        {
            title: "Ingest Url",
            dataIndex: "ingest_url",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.ingest_url.localeCompare(b.ingest_url),
        },
        {
            title: "Status",
            dataIndex: "status",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.status.localeCompare(b.status),
        },
        {
            title: "Title",
            dataIndex: "title",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.title.localeCompare(b.title),
        },
        {
            title: "UUID",
            dataIndex: "uuid",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.uuid.localeCompare(b.uuid),
        },
        {
            title: "Show Datasets",
            dataIndex: "show_datasets",
            render: (text, record) => (
                <Button onClick={() => {
                    const hm_uuid = record.uuid.trim();
                    filterUploads(uploadData, datasetData, hm_uuid);
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
            pagination={{ position: ["topRight", "bottomRight"] }}
            scroll={{ x: 1500 }}
        />
    );
};

const DataTable = (props) => {
    const [datasetData, setDatasetData] = useState([]);
    const [uploadData, setUploadData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [useDatasetApi, setUseDatasetApi] = useState(props.useDatasetApi);
    const [originalDatasetData, setOriginalDatasetData] = useState([]);
    const [selectUploadId, setSelectUploadId] = useState(props.selectUploadId);
    const [invalidUploadId, setInvalidUploadId] = useState(false);
    const datasetUrl = "http://localhost:8484/datasets/data-status";
    const uploadUrl = "http://localhost:8484/uploads/data-status";
    useEffect(() => {
        loadData();
    }, []);

    const filterUploads = (uploadResponse, datasetResponse, uploadId) => {
        console.log(uploadId);
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
    const loadData = async () => {
        setLoading(true);
        try {
            const datasetResponse = await axios.get(datasetUrl);
            const uploadResponse = await axios.get(uploadUrl);
            setDatasetData(datasetResponse.data);
            setOriginalDatasetData(datasetResponse.data);
            setUploadData(uploadResponse.data);
            filterUploads(uploadResponse.data, datasetResponse.data, selectUploadId);
        } catch (error) {
        } finally {
        setLoading(false);
        }
    };

    const toggleApi = () => {
        setUseDatasetApi(!useDatasetApi);
    };

    const table = useDatasetApi ? (
        <DatasetTable data={datasetData} loading={loading} />
    ) : (
        <UploadTable data={uploadData} loading={loading} filterUploads={filterUploads} uploadData={uploadData} datasetData={originalDatasetData}/>
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
            {table}
        </div>
    )
}

export default DataTable

