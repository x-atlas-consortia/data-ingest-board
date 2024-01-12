import {Button, Dropdown, Menu, Modal, Table, Tooltip} from "antd";
import {CaretDownOutlined, DownloadOutlined} from "@ant-design/icons";
import {CSVLink} from "react-csv";
import React, {useState} from "react";
import Spinner from "../Spinner";
import {ENVS, eq, TABLE, THEME, URLS} from "../../lib/helper";
import ModalOver from "../ModalOver";

const UploadTable = ({ data, loading, filterUploads, uploadData, datasetData, handleTableChange, page, pageSize, sortField, sortOrder, filters, className}) => {
    const modifiedData = data.map(item => {
        for (const key in item) {
            if (Array.isArray(item[key])) {
                // Convert objects to string representations
                item[key] = item[key].map(element => (typeof element === 'object' ? JSON.stringify(element) : element));
                // Convert other arrays to comma-delimited strings
                if (item[key].length === 1) {
                    item[key] = item[key][0].toString();
                } else {
                    item[key] = item[key].join(', ');
                }
            }
        }
        return item;
    })
    const [modalOpen, setModalOpen] = useState(false)
    const [modalBody, setModalBody] = useState(null)
    const unfilteredGroupNames = [...new Set(data.map(item => item.group_name))];
    const uniqueGroupNames = unfilteredGroupNames.filter(name => name.trim() !== "" && name !== " ");
    const uniqueAssignedToGroupNames = [...new Set(data.map(item => item.assigned_to_group_name))]
    let defaultFilteredValue = {};

    for (let _field of ["group_name", "status"]) {
        if (filters.hasOwnProperty(_field)) {
            defaultFilteredValue[_field] = filters[_field].toLowerCase().split(",");
        }
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
    if (order && field && (eq(order, "ascend") || eq(order, "descend"))) {
        if (ENVS.filterFields().includes(field)) {
            defaultSortOrder[field] = order;
        }
    }

    const renderDropdownContent = (record) => {
        const showGlobusUrl = record.status?.toLowerCase() !== 'reorganized';
        const items = [
            {
                key: '1',
                label: (
                    <a href={URLS.ingest.view(record.uuid, 'upload')} target="_blank" rel="noopener noreferrer">Data Portal</a>
                )
            }
        ]

        if (showGlobusUrl) {
            items.push(
                {
                    key: '2',
                    label: (
                        <a href={record.globus_url} target="_blank" rel="noopener noreferrer">Globus Directory</a>
                    )
                }
            )
        }

        items.push(
            {
                key: '3',
                label: (
                    <Button onClick={() => {
                        const uuid = record.uuid.trim();
                        filterUploads(uploadData, datasetData, uuid);
                        window.history.pushState(null, null, `/?upload_id=${record[TABLE.cols.f('id')]}`)
                    }}>
                        Show Datasets
                    </Button>
                )
            }
        )
        return items
    };
    const uploadColumns = [
        {
            title: TABLE.cols.n('id'),
            width: 180,
            dataIndex: TABLE.cols.f('id'),
            align: "left",
            defaultSortOrder: defaultSortOrder[TABLE.cols.f('id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('id')].localeCompare(b[TABLE.cols.f('id')]),
            ellipsis: true,
            render: (id, record) => (
                <Dropdown menu={{items: renderDropdownContent(record)}} trigger={['click']}>
                    <a href="#" onClick={(e) => e.preventDefault()} className='lnk--ic'>{id} <CaretDownOutlined style={{verticalAlign: 'middle'}} /></a>
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
            onFilter: (value, record) => eq(record.group_name, value),
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
            filters: TABLE.getStatusFilters([
                {text: 'Unreorganized', value: 'unreorganized'},
                {text: 'Valid', value: 'valid'},
                {text: 'Reorganized', value: 'reorganized'},
            ]),
            onFilter: (value, record) => {
                if (value === 'Unreorganized') {
                    return !eq(record.status, 'reorganized');
                }
                return eq(record.status, value);
            },
            render: (status) => (
                <Tooltip title={TABLE.getStatusDefinition(status, 'Upload')}>
                    <span className={`c-badge c-badge--${status.toLowerCase()}`} style={{backgroundColor: THEME.getStatusColor(status).bg, color: THEME.getStatusColor(status).text}}>
                        {status}
                    </span>
                </Tooltip>
            )
        },
        {
            title: "Assigned To Group Name",
            width: 300,
            dataIndex: "assigned_to_group_name",
            align: "left",
            defaultSortOrder: defaultSortOrder["assigned_to_group_name"] || null,
            sorter: (a,b) => a.assigned_to_group_name.localeCompare(b.assigned_to_group_name),
            defaultFilteredValue: defaultFilteredValue["assigned_to_group_name"] || null,
            filters: uniqueAssignedToGroupNames.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => eq(record.assigned_to_group_name, value),
            ellipsis: true,
        },
        {
            title: "Ingest Task",
            width: 200,
            dataIndex: "ingest_task",
            align: "left",
            defaultSortOrder: defaultSortOrder["ingest_task"] || null,
            sorter: (a,b) => a.ingest_task.localeCompare(b.ingest_task),
            ellipsis: true,
            render: (task, record) => {
                return <ModalOver content={task} setModalOpen={setModalOpen} setModalBody={setModalBody} />
            }
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
        return TABLE.countFilteredRecords(data, filters, dataIndexList, {case1: 'unreorganized', case2: 'reorganized'})
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
                                    {countFilteredRecords(modifiedData, filters).length} Selected
                                </span>
                            <CSVLink data={countFilteredRecords(modifiedData, filters)} filename="uploads-data.csv" className="ic--download">
                                <DownloadOutlined title="Export Selected Data as CSV" style={{ fontSize: '24px', transition: 'fill 0.3s', fill: '#000000'}}/>
                            </CSVLink>
                        </div>
                    </div>
                    <Table className={`m-4 c-table--main ${countFilteredRecords(data, filters).length > 0 ? '' : 'no-data'}`}
                           columns={uploadColumns}
                           showHeader={!loading}
                           dataSource={countFilteredRecords(modifiedData, filters)}
                           bordered={false}
                           loading={loading}
                           pagination={{ position: ["topRight", "bottomRight"], current: page, defaultPageSize: pageSize}}
                           scroll={{ x: 1500, y: 1500 }}
                           onChange={handleTableChange}
                           rowKey={TABLE.cols.f('id')}
                    />
                    <Modal
                        cancelButtonProps={{ style: { display: 'none' } }}
                        open={modalOpen}
                        onCancel={()=> {setModalOpen(false)}}
                        onOk={() => {setModalOpen(false)}}
                    >
                        {modalBody}
                    </Modal>
                </>
            )}
        </div>
    );
};

export default UploadTable