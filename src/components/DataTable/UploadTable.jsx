import {Button, Dropdown, Menu, Modal, Table, Tooltip} from "antd";
import {CaretDownOutlined, DownloadOutlined} from "@ant-design/icons";
import {CSVLink} from "react-csv";
import React, {useState} from "react";
import Spinner from "../Spinner";
import {ENVS, TABLE, THEME, URLS} from "../../lib/helper";
import ModalOver from "../ModalOver";

const UploadTable = ({ data, loading, filterUploads, uploadData, datasetData, handleTableChange, page, pageSize, sortField, sortOrder, filters, className}) => {
    const [modalOpen, setModalOpen] = useState(false)
    const [modalBody, setModalBody] = useState(null)

    const unfilteredGroupNames = [...new Set(data.map(item => item.group_name))];
    const uniqueGroupNames = unfilteredGroupNames.filter(name => name.trim() !== "" && name !== " ");
    const uniqueAssignedToGroupNames = [...new Set(data.map(item => item.assigned_to_group_name))]
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
            width: '15%',
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
            filters: TABLE.getStatusFilters([
                {text: 'Unreorganized', value: 'Unreorganized'},
                {text: 'Valid', value: 'Valid'},
                {text: 'Reorganized', value: 'Reorganized'},
            ]),
            onFilter: (value, record) => {
                if (value === 'Unreorganized') {
                    return record.status.toLowerCase() !== 'reorganized';
                }
                return record.status.toLowerCase() === value.toLowerCase();
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
            onFilter: (value, record) => record.assigned_to_group_name.toLowerCase() === value.toLowerCase(),
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
                    <Table className={`m-4 c-table--main ${countFilteredRecords(data, filters).length > 0 ? '' : 'no-data'}`}
                           columns={uploadColumns}
                           showHeader={!loading}
                           dataSource={data}
                           bordered={false}
                           loading={loading}
                           pagination={{ position: ["topRight", "bottomRight"], current: page, defaultPageSize: pageSize}}
                           scroll={{ x: 1000 }}
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