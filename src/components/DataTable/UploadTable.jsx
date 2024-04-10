import {Button,Modal, Table, Tooltip} from "antd";
import React, {useContext, useEffect, useState} from "react";
import Spinner from "../Spinner";
import {eq} from "../../lib/helpers/general";
import ModalOver from "../ModalOver";
import TABLE from "../../lib/helpers/table";
import URLS from "../../lib/helpers/urls";
import ENVS from "../../lib/helpers/envs";
import THEME from "../../lib/helpers/theme";
import AppContext from "../../context/AppContext";

const UploadTable = ({ data, loading, filterUploads, uploadData, datasetData, handleTableChange, page, pageSize, sortField, sortOrder, filters, className}) => {
    const [rawData, setRawData] = useState([])
    const [modifiedData, setModifiedData] = useState([])
    const [checkedModifiedData, setCheckedModifiedData] = useState([])
    const [disabledMenuItems, setDisabledMenuItems] = useState({})
    const {selectedEntities, setSelectedEntities} = useContext(AppContext)
    const [modalRowSelection, setModalRowSelection] = useState([])

    useEffect(() => {
        setRawData(JSON.parse(JSON.stringify(data)))
        setModifiedData(TABLE.flattenDataForCSV(JSON.parse(JSON.stringify(data))))
    }, [data])

    const [modalOpen, setModalOpen] = useState(false)
    const [modalBody, setModalBody] = useState(null)
    const [modalClassName, setModalClassName] = useState('')

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
        TABLE.reusableColumns(defaultSortOrder, defaultFilteredValue).id(renderDropdownContent),
        TABLE.reusableColumns(defaultSortOrder, defaultFilteredValue).groupName(uniqueGroupNames),
        {
            title: "Status",
            width: '15%',
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
        TABLE.reusableColumns(defaultSortOrder, defaultFilteredValue, {}).assignedToGroupName(uniqueAssignedToGroupNames),
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


    const rowSelection =  TABLE.rowSelection({setDisabledMenuItems, disabledMenuItems, selectedEntities, setSelectedEntities, setCheckedModifiedData, setModalRowSelection})

    const handleMenuClick = (e) => {
        if (e.key === '1') {
            TABLE.handleCSVDownload()
        }
    }

    const items = TABLE.bulkSelectionDropdown();

    const menuProps = {
        items,
        onClick: handleMenuClick,
    };

    return (
        <div>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    <div className="row">
                        <div className="col-12 col-md-3 count mt-md-3">
                            {TABLE.rowSelectionDropdown({menuProps, selectedEntities, countFilteredRecords, modifiedData, filters, entity: 'Upload'})}
                            {TABLE.csvDownloadButton({selectedEntities, countFilteredRecords, checkedModifiedData, filters, modifiedData, filename: 'uploads-data.csv'})}
                        </div>
                    </div>
                    <Table className={`m-4 c-table--main ${countFilteredRecords(data, filters).length > 0 ? '' : 'no-data'}`}
                           columns={uploadColumns}
                           showHeader={!loading}
                           dataSource={countFilteredRecords(rawData, filters)}
                           bordered={false}
                           loading={loading}
                           pagination={{ position: ["topRight", "bottomRight"], current: page, defaultPageSize: pageSize}}
                           scroll={{ x: 1500, y: 1500 }}
                           onChange={handleTableChange}
                           rowKey={TABLE.cols.f('id')}
                           rowSelection={{
                               type: 'checkbox',
                               ...rowSelection,
                           }}
                    />
                    <Modal
                        cancelButtonProps={{ style: { display: 'none' } }}
                        closable={false}
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