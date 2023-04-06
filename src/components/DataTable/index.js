import React, {useState, useEffect} from "react";
import axios from "axios"
import {Table} from "antd";

const DataTable = () => {
    const [gridData, setGridData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [])

    const loadData = async () => {
        setLoading(true);
        //const response = await axios.get("http://jsonplaceholder.typicode.com/comments");
        const response = await axios.get("http://localhost:8484/datasets/data-status")
        setGridData(response.data);
        setLoading(false)
    }

    const dataWithAge = gridData.map((item) => ({
        ...item,
        age: Math.floor(Math.random() * 6) + 20,
    }));

    const modifiedData = dataWithAge.map(({body, ...item}) => ({
        ...item,
        key: item.id,
        message: body
    }));

    const columns = [
        {
            title: "HuBMAP ID",
            dataIndex: "hubmap_id",
            align: "center",
            editTable: true
        },
        {
            title: "Group Name",
            dataIndex: "group_name",
            align: "center",
            editTable: true,
        },
        {
            title: "Status",
            dataIndex: "status",
            align: "center",
            editTable: true
        },
        {
            title: "Organ Type",
            dataIndex: "organ",
            align: "center",
            editTable: true,
        },
        {
            title: "Provider Experiment ID",
            dataIndex: "provider_experiment_id",
            align: "center",
            editTable: true
        },
        {
            title: "Last Touch",
            dataIndex: "last_touch",
            align: "center",
            editTable: true
        },
        {
            title: "Has Contacts",
            dataIndex: "has_contacts",
            align: "center",
            editTable: true
        },
        {
            title: "Has Contributors",
            dataIndex: "has_contributors",
            align: "center",
            editTable: true
        },
        {
            title: "Data Types",
            dataIndex: "datatypes",
            align: "center",
            editTable: true
        },
        {
            title: "Donor UUID",
            dataIndex: "donor_uuid",
            align: "center",
            editTable: true
        },
        {
            title: "Donor HuBMAP ID",
            dataIndex: "donor_hubmap_id",
            align: "center",
            editTable: true
        },{
            title: "Donor Submission ID",
            dataIndex: "donor_submission_id",
            align: "center",
            editTable: true
        },
        {
            title: "Donor Lab ID",
            dataIndex: "donor_lab_id",
            align: "center",
            editTable: true
        },
        {
            title: "Has Donor Metadata",
            dataIndex: "has_metadata",
            align: "center",
            editTable: true
        },
        {
            title: "Parent Dataset",
            dataIndex: "parent_dataset",
            align: "center",
            editTable: true
        },
        {
            title: "Upload",
            dataIndex: "upload",
            align: "center",
            editTable: true
        },
        {
            title: "Has Rui Info",
            dataIndex: "has_rui_info",
            align: "center",
            editTable: true
        },
        {
            title: "Globus URL",
            dataIndex: "globus_url",
            align: "center",
            editTable: true
        },
        {
            title: "Portal URL",
            dataIndex: "portal_url",
            align: "center",
            editTable: true
        },
        {
            title: "Ingest URL",
            dataIndex: "ingest_url",
            align: "center",
            editTable: true
        }
    ]

    return (
        <div>
            <Table
            columns={columns}
            dataSource={gridData}
            bordered
            loading={loading}
            pagination={{position: ['topRight', 'bottomRight']}}
            scroll={{x: 1500}}
            />
        </div>
    )
}

export default DataTable