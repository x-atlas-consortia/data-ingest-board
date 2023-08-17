import {Button, Dropdown, Menu, Table} from "antd";
import {DownloadOutlined, ExportOutlined} from "@ant-design/icons";
import {CSVLink} from "react-csv";
import React from "react";
import Spinner from "../Spinner";

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
        if (field === "title") {
            defaultSortOrder["title"] = order;
        }
        if (field === "uuid") {
            defaultSortOrder["uuid"] = order;
        }
    }
    const ingest_url = process.env.NEXT_PUBLIC_INGEST_BASE.endsWith('/') ? process.env.NEXT_PUBLIC_INGEST_BASE : process.env.NEXT_PUBLIC_INGEST_BASE + '/'
    const renderDropdownContent = (record) => {
        const showGlobusUrl = record.status.toLowerCase() !== 'reorganized';
        return (
            <Menu>
                <Menu.Item key="1">
                    <a href={ingest_url + 'upload/' + record.uuid} target="_blank" rel="noopener noreferrer">Data Portal</a>
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
                    <a href="#">{hubmapId}<ExportOutlined style={{verticalAlign: 'middle'}}/></a>
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
            width: '12%',
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
            },
            render: (status) => (
                <span style={{backgroundColor: getStatusColor(status).color, border: `1px solid ${getStatusColor(status).darkColor}`, color: 'white', borderRadius: '7px', padding: '0px .5rem', fontWeight: 'bold', textShadow: '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',}}>
                    {status}
                </span>
            )
        },
        {
            title: "Title",
            width: '23%',
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
        return filteredData;
    }

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'unreorganized':
                return { color: 'grey', darkColor: "darkgrey" };
            case 'reorganized':
                return { color: 'green', darkColor: "darkgreen"};
            case 'error':
                return { color: 'red', darkColor: "darkred"};
            case 'invalid':
                return { color: 'orange', darkColor: "darkorange"};
            case 'valid':
                return { color: 'lime', darkColor: "darkgreen"};
            case 'new':
                return { color: 'cyan', darkColor: "darkblue"};
            case 'processing':
                return { color: 'blue', darkColor: "darkblue"};
            case 'submitted':
                return { color: 'purple', darkColor: "darkpurple"};
            default:
                return { color: 'white', darkColor: "darkgrey"};
        }
    }

    return (
        <div>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    <div className="row">
                        <div className="col-12 col-md-3 count mt-md-3">
                                <span style={{ marginRight: '1rem' }}>
                                    {countFilteredRecords(data, filters).length} Selected
                                </span>
                            <CSVLink data={countFilteredRecords(data, filters)} filename="uploads-data.csv" className="ic--download">
                                <DownloadOutlined title="Export Selected Data as CSV" style={{ fontSize: '24px', transition: 'fill 0.3s', fill: '#000000'}}/>
                            </CSVLink>
                        </div>
                    </div>
                    <Table className={`m-4 UploadTable ${countFilteredRecords(data, filters).length > 0 ? '' : 'no-data'}`}
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
                </>
            )}
        </div>
    );
};

export default UploadTable