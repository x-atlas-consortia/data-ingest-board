import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table } from "antd";

const DatasetTable = ({ data, loading }) => {
    const datasetColumns = [
        {
            title: "HuBMAP ID",
            dataIndex: "hubmap_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.hubmap_id.localeCompare(b.hubmap_id)
        },
        {
            title: "Group Name",
            dataIndex: "group_name",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.group_name.localeCompare(b.group_name)
        },
        {
            title: "Status",
            dataIndex: "status",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.status.localeCompare(b.status)
        },
        {
            title: "Organ Type",
            dataIndex: "organ",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.organ.localeCompare(b.organ)
        },
        {
            title: "Provider Experiment ID",
            dataIndex: "provider_experiment_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.provider_experiment_id.localeCompare(b.provider_experiment_id)
        },
        {
            title: "Last Touch",
            dataIndex: "last_touch",
            align: "center",
            editTable: true,
            sorter: (a,b) => new Date(a.last_touch) - new Date(b.last_touch)
        },
        {
            title: "Has Contacts",
            dataIndex: "has_contacts",
            align: "center",
            editTable: true,
            sorter: (a,b) => b.has_contacts.localeCompare(a.has_contacts)
        },
        {
            title: "Has Contributors",
            dataIndex: "has_contributors",
            align: "center",
            editTable: true,
            sorter: (a,b) => b.has_contributors.localeCompare(a.has_contributors)
        },
        {
            title: "Data Types",
            dataIndex: "data_types",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.data_types.localeCompare(b.data_types)
        },
        {
            title: "Donor HuBMAP ID",
            dataIndex: "donor_hubmap_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.donor_hubmap_id.localeCompare(b.donor_hubmap_id)
        },{
            title: "Donor Submission ID",
            dataIndex: "donor_submission_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.donor_submission_id.localeCompare(b.donor_submission_id)
        },
        {
            title: "Donor Lab ID",
            dataIndex: "donor_lab_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.donor_lab_id.localeCompare(b.donor_lab_id)
        },
        {
            title: "Has Donor Metadata",
            dataIndex: "has_metadata",
            align: "center",
            editTable: true,
            sorter: (a,b) => b.has_metadata.localeCompare(a.has_metadata)
        },
        {
            title: "Parent Dataset",
            dataIndex: "parent_dataset",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.parent_dataset.localeCompare(b.parent_dataset)
        },
        {
            title: "Upload",
            dataIndex: "upload",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.upload.localeCompare(b.upload)
        },
        {
            title: "Has Rui Info",
            dataIndex: "has_rui_info",
            align: "center",
            editTable: true,
            sorter: (a,b) => b.has_rui_info.localeCompare(a.has_rui_info)
        },
        {
            title: "Globus URL",
            dataIndex: "globus_url",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.globus_url.localeCompare(b.globus_url)
        },
        {
            title: "Portal URL",
            dataIndex: "portal_url",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.globus_url.localeCompare(b.globus_url)
        },
        {
            title: "Ingest URL",
            dataIndex: "ingest_url",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.ingest_url.localeCompare(b.ingest_url)
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

const UploadTable = ({ data, loading }) => {
    const uploadColumns = [
        {
            title: "Datasets",
            dataIndex: "datasets",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.datasets.localeCompare(b.datasets)
        },
        {
            title: "Group Name",
            dataIndex: "group_name",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.group_name.localeCompare(b.group_name)
        },
        {
            title: "HuBMAP ID",
            dataIndex: "hubmap_id",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.hubmap_id.localeCompare(b.hubmap_id)
        },
        {
            title: "Ingest Url",
            dataIndex: "ingest_url",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.ingest_url.localeCompare(b.ingest_url)
        },
        {
            title: "Status",
            dataIndex: "status",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.status.localeCompare(b.status)
        },
        {
            title: "Title",
            dataIndex: "title",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.title.localeCompare(b.title)
        },
        {
            title: "UUID",
            dataIndex: "uuid",
            align: "center",
            editTable: true,
            sorter: (a,b) => a.uuid.localeCompare(b.uuid)
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

const DataTable = () => {
    const [datasetData, setDatasetData] = useState([]);
    const [uploadData, setUploadData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [useDatasetApi, setUseDatasetApi] = useState(true);
    const datasetUrl = "http://localhost:8484/datasets/data-status";
    const uploadUrl = "http://localhost:8484/uploads/data-status";

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const datasetResponse = await axios.get(datasetUrl);
            const uploadResponse = await axios.get(uploadUrl);
            setDatasetData(datasetResponse.data);
            // const dataWithDatasetsList = uploadResponse.data.map((item) => {
            //     const datasetsList = item.datasets !== undefined && item.datasets !== null && item.datasets !== "" ? item.datasets.split(",") : " ";
            //     return {
            //         ...item,
            //         datasets: datasetsList,
            //     };
            // });
            setUploadData(uploadResponse.data);
        } catch (error) {
            console.error("Error fetching data:", error);
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
        <UploadTable data={uploadData} loading={loading} />
    );

    return (
        <div>
            <center>
                <h2>{useDatasetApi ? "Datasets" : "Uploads"}</h2>
            </center>
            <button onClick={toggleApi}>
                {useDatasetApi ? "Switch to Uploads Table" : 'Switch to Datasets Table'}
            </button>
            {table}
        </div>
    )
}

export default DataTable

