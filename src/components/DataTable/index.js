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
        const response = await axios.get("http://jsonplaceholder.typicode.com/comments");
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
            title: "ID",
            dataIndex: "id",
        },
        {
            title: "Name",
            dataIndex: "name",
            align: "center",
            editTable: true
        },
        {
            title: "Email",
            dataIndex: "email",
            align: "center",
            editTable: true
        },
        {
            title: "Message",
            dataIndex: "message",
            align: "center",
            editTable: true
        }
    ]

    return (
        <div>
            <Table
            columns={columns}
            dataSource={modifiedData}
            bordered
            loading={loading}
            />
        </div>
    )
}

export default DataTable