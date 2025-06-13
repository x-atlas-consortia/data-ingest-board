import {Button,Modal} from "antd";
import React, {useContext, useEffect, useState} from "react";
import Spinner from "../Spinner";
import {eq, getUBKGName} from "@/lib/helpers/general";
import ModalOver from "../ModalOver";
import TABLE from "@/lib/helpers/table";
import URLS from "@/lib/helpers/urls";
import ENVS from "@/lib/helpers/envs";
import AppContext from "@/context/AppContext";
import {STATUS} from "@/lib/constants";
import BulkEditForm from "../BulkEditForm";
import UI_BLOCKS from "@/lib/helpers/uiBlocks";
import AppTable from "@/components/DataTable/AppTable";
import {AppTableProvider} from "@/context/TableContext";
import RouterContext from "@/context/RouterContext";

const UploadTable = ({ data, loading, filterUploads, uploadData, datasetData}) => {
    const {sortField, sortOrder, filters} = useContext(RouterContext)
    const [modifiedData, setModifiedData] = useState([])
    const [checkedModifiedData, setCheckedModifiedData] = useState([])
    const [disabledMenuItems, setDisabledMenuItems] = useState({})
    const {selectedEntities, setSelectedEntities, hasDataAdminPrivs, dataProviderGroups, confirmBulkEdit} = useContext(AppContext)
    const [bulkEditValues, setBulkEditValues] = useState({})
    const [confirmModalArgs, setConfirmModalArgs] = useState({})
    const hierarchyGroupings = {}
    const uniqueDataFilters = {}
    let urlParamFilters = {}
    let urlSortOrder = {}

    useEffect(() => {
        setModifiedData(TABLE.flattenDataForCSV(JSON.parse(JSON.stringify(data))))
    }, [data])

    useEffect(() => {
        if (modal.open && eq(modal.key, 'bulkProcess')) {
            showConfirmModalOfSelectedUploads(confirmModalArgs)
        }
    }, [selectedEntities])

    const [modal, setModal] = useState({cancelCSS: 'none'})

    const excludedColumns = ENVS.excludeTableColumnsUploads()
    const filterField = (f) => {
        return TABLE.filterField(data, f, excludedColumns)
    }

    // Build unique filter dropdown for listed fields based on their respective data
    // Currently HM & SN share the same settings here; if deviate will need to create a separate .env to handle.
    const uploadsFilterFields = ['intended_organ', 'intended_dataset_type', 'intended_source_type', 'assigned_to_group_name', ...ENVS.sharedFilterFields()]
    for (let f of uploadsFilterFields) {
        uniqueDataFilters[f] = filterField(f)
    }

    const uniqueOrganType =  TABLE.makeHierarchyFilters(uniqueDataFilters['intended_organ'], hierarchyGroupings)
    const uniquePriorityPList = [...new Set(filterField('priority_project_list').flat())]

    // This is important to show visual indicator selections on filter drop down menu when there are valid url filters
    TABLE.handleUrlParams({filters, urlParamFilters, fields: uploadsFilterFields, hierarchyGroupings})

    TABLE.handleSortOrder({sortOrder, sortField, urlSortOrder, filterFields: uploadsFilterFields})

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
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).id(renderDropdownContent),
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).groupName(uniqueDataFilters['group_name']),
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).statusUpload,
        {
            ... TABLE.columnOptions({
                field: 'intended_source_type',
                title: 'Intended Source Type',
                width: 220,  urlSortOrder, urlParamFilters, uniqueDataFilters})
        },
        {
            ... TABLE.columnOptions({
                field: 'intended_organ',
                title: 'Intended Organ',
                width: 180,  urlSortOrder, urlParamFilters, uniqueDataFilters}),
            filteredValue: urlParamFilters["intended_organ"] ? filters['intended_organ'].toLowerCase().split(",") : null,
            filters: uniqueOrganType.map(name => ({ text: getUBKGName(name), value: name.toLowerCase() })),
            onFilter: (value, record) => eq(record.organ, value) || hierarchyGroupings[value]?.includes(record.organ),
            render: (organType, record) => {
                if (!organType) return null
                return (
                    <span>{getUBKGName(organType)}</span>
                )
            }
        },
        {
            ... TABLE.columnOptions({
                field: 'intended_dataset_type',
                title: 'Intended Dataset Type',
                width: 230,  urlSortOrder, urlParamFilters, uniqueDataFilters}),
        },
        TABLE.reusableColumns(urlSortOrder, urlParamFilters, {}).assignedToGroupName(uniqueDataFilters['assigned_to_group_name']),
        {
            title: "Ingest Task",
            width: 200,
            dataIndex: "ingest_task",
            align: "left",
            defaultSortOrder: urlSortOrder["ingest_task"] || null,
            sorter: (a,b) => a.ingest_task.localeCompare(b.ingest_task),
            ellipsis: true,
            render: (task, record) => {
                return <ModalOver content={task} modal={modal} setModal={setModal} />
            }
        },
        {
            title: "Anticipated Completion Year/Month",
            width: 300,
            showSorterTooltip: {
                title: <>The year and month that this <code>Upload</code> will have all required data uploaded and be ready for reorganization into <code>Datasets</code>.</>
            },
            dataIndex: "anticipated_complete_upload_month",
            align: "left",
            defaultSortOrder: urlSortOrder["anticipated_complete_upload_month"] || '',
            sorter: (a,b) => new Date(a.anticipated_complete_upload_month + '-3') - new Date(b.anticipated_complete_upload_month + '-3'),
            ellipsis: true,
            render: (date, record) => <span>{date}</span>
        },
        {
            title: "Anticipated Number of Datasets",
            showSorterTooltip: {
                title: <>The total number of <code>Datasets</code> that this <code>Upload</code> will eventually contain.</>
            },
            width: 320,
            dataIndex: "anticipated_dataset_count",
            align: "left",
            defaultSortOrder: urlSortOrder["anticipated_dataset_count"] || 0,
            sorter: (a,b) => a.anticipated_dataset_count - b.anticipated_dataset_count,
            ellipsis: true,
        },
        {
            title: "Title",
            width: 320,
            dataIndex: "title",
            align: "left",
            defaultSortOrder: urlSortOrder["title"] || null,
            sorter: (a,b) => a.title.localeCompare(b.title),
            ellipsis: true,
        },
        {
            title: "UUID",
            width: 310,
            dataIndex: "uuid",
            align: "left",
            defaultSortOrder: urlSortOrder["uuid"] || null,
            sorter: (a,b) => a.uuid.localeCompare(b.uuid),
            ellipsis: true,
        },
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).priorityProjectList(uniquePriorityPList, filters),
    ];

    // Exclude named columns in .env from table
    const filteredUploadColumns = []
    for (let x = 0; x < uploadColumns.length; x++) {
        if (excludedColumns[uploadColumns[x].dataIndex] === undefined) {
            filteredUploadColumns.push(uploadColumns[x])
        }
    }

    const dataIndexList = filteredUploadColumns.map(column => column.dataIndex);

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
            TABLE.reusableColumns(urlSortOrder, {}).id(),
            TABLE.reusableColumns(urlSortOrder, {}).groupName(uniqueGroupNames),
            TABLE.reusableColumns(urlSortOrder, urlParamFilters).statusUpload,
            TABLE.reusableColumns(urlSortOrder, urlParamFilters).deleteAction(handleRemove)
        ]
        UI_BLOCKS.modalConfirm.showConfirmModalOfSelectedEntities({callback, afterTableComponent,
            columns, selectedEntities, setModal, entityName: 'Uploads'})
    }

    const handleMenuClick = (e) => {
        if (e.key === '1') {
            TABLE.handleCSVDownload({selectedEntities, countFilteredRecords, checkedModifiedData, filters, modifiedData, filename: 'uploads-data.csv'})
        }

        if (e.key === '1b') {
            TABLE.handleManifestDownload({selectedEntities, countFilteredRecords, checkedModifiedData, filters, modifiedData})
        }

        if (e.key === '3') {
            showConfirmModalOfSelectedUploads({callback: 'confirmBulkUploadEdit',
                afterTableComponent: <BulkEditForm statuses={TABLE.getStatusFilters(STATUS.uploads)}
                                                   dataProviderGroups={dataProviderGroups} setBulkEditValues={setBulkEditValues}
                                                   entityName={'uploads'} />})
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
                    <AppTableProvider context={'Upload'} baseColumns={filteredUploadColumns}>
                        <AppTable countFilteredRecords={countFilteredRecords}
                                  data={data}
                                  modifiedData={modifiedData}
                                  menuProps={menuProps}
                                  loading={loading}
                                  rowSelection={rowSelection}  />
                    </AppTableProvider>
                    <Modal
                        className={modal.className}
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
