import {Button,Modal, Table, Tooltip} from "antd";
import React, {useContext, useEffect, useState} from "react";
import Spinner from "../Spinner";
import {callService, eq, getHeadersWith} from "../../lib/helpers/general";
import ModalOver from "../ModalOver";
import TABLE from "../../lib/helpers/table";
import URLS from "../../lib/helpers/urls";
import ENVS from "../../lib/helpers/envs";
import AppContext from "../../context/AppContext";
import {STATUS} from "../../lib/constants";
import BulkEditForm from "../BulkEditForm";
import UI_BLOCKS from "../../lib/helpers/uiBlocks";

const UploadTable = ({ data, loading, filterUploads, uploadData, datasetData, handleTableChange, page, pageSize, sortField, sortOrder, filters, className}) => {
    const [rawData, setRawData] = useState([])
    const [modifiedData, setModifiedData] = useState([])
    const [checkedModifiedData, setCheckedModifiedData] = useState([])
    const [disabledMenuItems, setDisabledMenuItems] = useState({})
    const {selectedEntities, setSelectedEntities, hasDataAdminPrivs, writeGroups, globusToken, confirmBulkEdit} = useContext(AppContext)
    const [bulkEditValues, setBulkEditValues] = useState({})
    const [confirmModalArgs, setConfirmModalArgs] = useState({})

    useEffect(() => {
        setRawData(JSON.parse(JSON.stringify(data)))
        setModifiedData(TABLE.flattenDataForCSV(JSON.parse(JSON.stringify(data))))
    }, [data])

    const [modal, setModal] = useState({cancelCSS: 'none'})

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
        TABLE.reusableColumns(defaultSortOrder, defaultFilteredValue).groupName(uniqueGroupNames, '25%'),
        TABLE.reusableColumns(defaultSortOrder, defaultFilteredValue).statusUpload,
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
                return <ModalOver content={task} modal={modal} setModal={setModal} />
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

    const rowSelection =  TABLE.rowSelection({setDisabledMenuItems, disabledMenuItems, selectedEntities, setSelectedEntities, setCheckedModifiedData})

    const handleRemove = (record) => {
        TABLE.removeFromSelection(record, selectedEntities, setSelectedEntities, setCheckedModifiedData)
    }

    const showConfirmModalOfSelectedUploads  = ({callback, afterTableComponent}) => {
        setConfirmModalArgs({callback, afterTableComponent})
        let columns = [
            TABLE.reusableColumns(defaultSortOrder, {}).id(),
            TABLE.reusableColumns(defaultSortOrder, {}).groupName(uniqueGroupNames),
            TABLE.reusableColumns(defaultSortOrder, defaultFilteredValue).statusUpload,
            TABLE.reusableColumns(defaultSortOrder, defaultFilteredValue).deleteAction(handleRemove)
        ]
        UI_BLOCKS.modalConfirm.showConfirmModalOfSelectedEntities({callback, afterTableComponent,
            columns, selectedEntities, setModal, entityName: 'Uploads'})
    }

    const handleMenuClick = (e) => {
        if (e.key === '1') {
            TABLE.handleCSVDownload()
        }

        if (e.key === '3') {
            showConfirmModalOfSelectedUploads({callback: 'confirmBulkUploadEdit',
                afterTableComponent: <BulkEditForm statuses={TABLE.getStatusFilters(STATUS.uploads)}
                                                   writeGroups={writeGroups} setBulkEditValues={setBulkEditValues}
                                                   selectedEntitiesStatuses={selectedEntities.map((e) => e.status)} entityName={'uploads'} />})
        }
    }

    const confirmBulkUploadEdit = () => {
        confirmBulkEdit({url: URLS.ingest.bulk.edit.uploads(), setModal, bulkEditValues, entityName: 'Upload'})
    }

    const items = TABLE.bulkSelectionDropdown([], {hasDataAdminPrivs, disabledMenuItems});

    const menuProps = {
        items,
        onClick: handleMenuClick,
    };
    const closeModal = () => {
        setModal({...modal, open: false})
    }

    const modalCallbacks = {
        confirmBulkUploadEdit
    }

    const handleModalOk = () => {
        if (modal.okCallback && modalCallbacks[modal.okCallback]) {
            if (selectedEntities.length) {
                modalCallbacks[modal.okCallback]()
            }
        } else {
            closeModal()
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
                        cancelButtonProps={{ style: { display: modal.cancelCSS } }}
                        width={modal.width}
                        closable={false}
                        open={modal.open}
                        onCancel={closeModal}
                        onOk={handleModalOk}
                    >
                        {modal.body}
                    </Modal>
                </>
            )}
        </div>
    );
};

export default UploadTable