import {Dropdown, Menu, Table} from "antd";
import {DownloadOutlined, ExportOutlined} from "@ant-design/icons";
import {CSVLink} from "react-csv";
import React from "react";
import Spinner from "../Spinner";

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
    const ingest_url = process.env.NEXT_PUBLIC_INGEST_URL.endsWith('/') ? process.env.NEXT_PUBLIC_INGEST_URL : process.env.NEXT_PUBLIC_INGEST_URL + '/'
    const portal_url = process.env.NEXT_PUBLIC_PORTAL_URL.endsWith('/') ? process.env.NEXT_PUBLIC_PORTAL_URL : process.env.NEXT_PUBLIC_PORTAL_URL + '/'

    const renderDropdownContent = (record) => (
        <Menu>
            <Menu.Item key="1">
                <a href={portal_url + 'dataset/' + record.uuid} target="_blank" rel="noopener noreferrer">Data Portal</a>
            </Menu.Item>
            <Menu.Item key="2">
                <a href={ingest_url + 'dataset/' + record.uuid} target="_blank" rel="noopener noreferrer">Ingest Portal</a>
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
                    <a href="#">{hubmapId}<ExportOutlined style={{verticalAlign: 'middle'}}/></a>
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
            },
            render: (status) => (
                <span style={{backgroundColor: getStatusColor(status).color, border: `1px solid ${getStatusColor(status).darkColor}`, color: 'white', borderRadius: '7px', padding: '0px .5rem', fontWeight: 'bold', textShadow: '-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black',}}>
                    {status}
                </span>
            )
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
                if (!organHubmapId?.trim()) {
                    return null;
                }
                return (
                    <a href={portal_url + 'browse/sample/' + record.organ_uuid} target="_blank" rel="noopener noreferrer">{organHubmapId}<ExportOutlined style={{verticalAlign: 'middle'}}/></a>
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
        return filteredData;
    }

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'unpublished':
                return { color: 'grey', darkColor: 'darkgrey' };
            case 'published':
                return { color: 'green', darkColor: 'darkgreen' };
            case 'qa':
                return { color: 'yellow', darkColor: 'darkyellow' };
            case 'error':
                return { color: 'red', darkColor: 'darkred' };
            case 'invalid':
                return { color: 'orange', darkColor: 'darkorange' };
            case 'new':
                return { color: 'cyan', darkColor: 'darkcyan' };
            case 'processing':
                return { color: 'blue', darkColor: 'darkblue' };
            case 'submitted':
                return { color: 'purple', darkColor: 'darkpurple' };
            default:
                return { color: 'white', darkColor: 'darkgrey' };
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
                            <CSVLink data={countFilteredRecords(data, filters)} filename="datasets-data.csv" className="ic--download">
                                <DownloadOutlined title="Export Selected Data as CSV" style={{ fontSize: '24px' }}/>
                            </CSVLink>
                        </div>
                    </div>
                    <Table className={`m-4 c-table--upload UploadTable ${countFilteredRecords(data, filters).length > 0 ? '' : 'no-data'}`}
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
                </>
            )}
        </div>
    );
};

export default DatasetTable