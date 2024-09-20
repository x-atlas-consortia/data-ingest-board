import {Form, Modal, Table} from "antd";
import {ExportOutlined, ThunderboltOutlined} from "@ant-design/icons";
import React, {useContext, useEffect, useState} from "react";
import Spinner from "../Spinner";
import ENVS from "../../lib/helpers/envs";
import TABLE from "../../lib/helpers/table";
import URLS from "../../lib/helpers/urls";
import {callService, eq, getHeadersWith, getUBKGName} from "../../lib/helpers/general";
import ModalOver from "../ModalOver";
import ModalOverData from "../ModalOverData";
import AppContext from "../../context/AppContext";
import UI_BLOCKS from "../../lib/helpers/uiBlocks";
import {STATUS} from "../../lib/constants";
import BulkEditForm from "../BulkEditForm";
import Visualizations from "@/components/Visualizations";

const DatasetTable = ({ data, loading, handleTableChange, page, pageSize, sortField, sortOrder, filters, className}) => {
    const {globusToken, hasDataAdminPrivs, selectedEntities, setSelectedEntities, dataProviderGroups, confirmBulkEdit} = useContext(AppContext)
    const [rawData, setRawData] = useState([])
    const [modifiedData, setModifiedData] = useState([])
    const [checkedModifiedData, setCheckedModifiedData] = useState([])
    const [disabledMenuItems, setDisabledMenuItems] = useState({bulkSubmit: true})
    const [bulkEditValues, setBulkEditValues] = useState({})
    const [confirmModalArgs, setConfirmModalArgs] = useState({})
    const hierarchyGroupings = {}

    useEffect(() => {
        setRawData(JSON.parse(JSON.stringify(data)))
        setModifiedData(TABLE.flattenDataForCSV(JSON.parse(JSON.stringify(data))))
    }, [data])

    const [modal, setModal] = useState({cancelCSS: 'none', okText: 'OK'})

    useEffect(() => {
        if (modal.open && eq(modal.key, 'bulkProcess')) {
            showConfirmModalOfSelectedDatasets(confirmModalArgs)
        }
    }, [selectedEntities])

    const excludedColumns = ENVS.excludeTableColumns()
    const filterField = (f) => {
        if (excludedColumns[f]) return []
        return [...new Set(data.map(item => item[f]))]
    }

    const getHierarchy = (str) => {
        const r = new RegExp(/.+?(?=\()/)
        let res = str.match(r)
        return (res && res.length) ? res[0].trim() : str
    }

    const makeHierarchyFilters = (items) => {
        const hierarchyNames = new Set()
        for (let i of items) {
            let groupName = getHierarchy(i)
            if (!eq(i, groupName)) {
                const normalized = groupName.toLowerCase()
                if (hierarchyGroupings[normalized] === undefined) {
                    hierarchyGroupings[normalized] = []
                }
                hierarchyGroupings[normalized].push(i)
            }
            hierarchyNames.add(groupName)
        }
        return Array.from(hierarchyNames)
    }
    const uniqueGroupNames = filterField('group_name')
    const uniqueAssignedToGroupNames = filterField('assigned_to_group_name')
    const unfilteredOrganTypes = makeHierarchyFilters(filterField('organ'))
    const uniqueOrganType = unfilteredOrganTypes.filter(name => name !== "" && name !== " ");
    const uniqueDatasetType = filterField('dataset_type')
    const uniqueSourceTypes = filterField('source_type')
    const uniqueHasRuiStates = filterField('has_rui_info')

    let order = sortOrder;
    let field = sortField;
    if (typeof sortOrder === "object"){
        order = order[0];
    }
    if (typeof sortField === "object"){
        field = field[0];
    }
    let urlParamFilters = {};
    let urlSortOrder = {};
    if (order && field && (eq(order, "ascend") || eq(order, "descend"))){
        if (ENVS.filterFields().includes(field)) {
            urlSortOrder[field] = order;
        }
    }

    for (let _field of ENVS.defaultFilterFields()) {
        if (filters.hasOwnProperty(_field)) {
            let values = filters[_field].toLowerCase().split(",")
            for (let v of values) {
                if (urlParamFilters[_field] === undefined) {
                    urlParamFilters[_field] = []
                }
                // append either the values for a particular group or just the filter itself
                urlParamFilters[_field] = urlParamFilters[_field].concat(hierarchyGroupings[v.toLowerCase()] || [v]);
            }
        }
    }

    const datasetColumns = [
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).id(),
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).groupName(uniqueGroupNames),
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).status,
        {
            title: "Dataset Type",
            width: 170,
            dataIndex: "dataset_type",
            align: "left",
            defaultSortOrder: urlSortOrder["dataset_type"] || null,
            sorter: (a,b) => a.dataset_type.localeCompare(b.dataset_type),
            filteredValue: urlParamFilters["dataset_type"] || null,
            filters: uniqueDatasetType.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => eq(record.dataset_type, value),
            ellipsis: true,
        },
        {
            title: "Processed Datasets",
            width: 180,
            dataIndex: "processed_datasets",
            align: "left",
            defaultSortOrder: urlSortOrder["processed_datasets"] || null,
            sorter: (a,b) => {
                let a1 = Array.isArray(a.processed_datasets) ? a.processed_datasets.length : 0
                let b1 = Array.isArray(b.processed_datasets) ? b.processed_datasets.length : 0
                return a1 - b1
            },
            filteredValue: urlParamFilters["processed_datasets"] || null,
            ellipsis: true,
            render: (processed_datasets, record) => {
                return <ModalOverData args={{urlParamFilters, urlSortOrder, record}} content={Array.isArray(processed_datasets) ? processed_datasets : []}
                                      modal={modal} setModal={setModal} />
            }
        },
        TABLE.reusableColumns(urlSortOrder, urlParamFilters, {}).assignedToGroupName(uniqueAssignedToGroupNames),
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
            title: TABLE.cols.n('source_type', 'Source Type'),
            width: 150,
            dataIndex: TABLE.cols.f('source_type'),
            align: "left",
            defaultSortOrder: urlSortOrder[TABLE.cols.f('source_type')] || null,
            sorter: (a,b) => a[TABLE.cols.f('source_type')].localeCompare(b[TABLE.cols.f('source_type')]),
            filteredValue: urlParamFilters[TABLE.cols.f('source_type')] || null,
            filters: uniqueSourceTypes.map(name => ({ text: name, value: name?.toLowerCase() })),
            onFilter: (value, record) => eq(record[TABLE.cols.f('source_type')], value),
            ellipsis: true,
        },
        {
            title: "Organ Type",
            width: 180,
            dataIndex: "organ",
            align: "left",
            defaultSortOrder: urlSortOrder["organ"] || null,
            sorter: (a,b) => a.organ.localeCompare(b.organ),
            filteredValue: urlParamFilters["organ"] ? filters['organ'].toLowerCase().split(",") : null,
            filters: uniqueOrganType.map(name => ({ text: getUBKGName(name), value: name.toLowerCase() })),
            onFilter: (value, record) => eq(record.organ, value) || hierarchyGroupings[value]?.includes(record.organ),
            ellipsis: true,
            render: (organType, record) => {
                if (!organType) return null
                return (
                    <span className='txt-break-spaces'>{getUBKGName(organType)}</span>
                )
            }
        },
        {
            title: TABLE.cols.n('organ_id'),
            width: 180,
            dataIndex: TABLE.cols.f('organ_id'),
            align: "left",
            defaultSortOrder: urlSortOrder[TABLE.cols.f('organ_id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('organ_id')].localeCompare(b[TABLE.cols.f('organ_id')]),
            ellipsis: true,
            render: (organId, record) => {
                if (!organId?.trim()) {
                    return null;
                }
                return (
                    <a href={URLS.portal.view(record.organ_uuid, 'sample')} target="_blank" rel="noopener noreferrer" className='lnk--ic'>
                        {organId} <ExportOutlined style={{verticalAlign: 'middle'}}/>
                    </a>

                );
            }
        },
        {
            title: "Provider Experiment ID",
            width: 250,
            dataIndex: "provider_experiment_id",
            align: "left",
            defaultSortOrder: urlSortOrder["provider_experiment_id"] || null,
            sorter: (a,b) => a.provider_experiment_id.localeCompare(b.provider_experiment_id),
            ellipsis: true,
            render: (experimentId, record) => {
                return (
                    <span className='txt-break-spaces'>{experimentId}</span>
                )
            }
        },
        {
            title: "Last Touch",
            width: 225,
            showSorterTooltip: {
                title: <span>If the <code>Dataset</code> is published <i>Last Touch</i> returns the date/time that the <code>Dataset</code> was published, otherwise it returns the date/time that the <code>Dataset</code> record was last updated. <small className={'text-muted'}>NOTE: This does not include updates to data via Globus (or otherwise), only updates to metadata stored in the {ENVS.appContext()} provenance database.</small></span>
            },
            dataIndex: "last_touch",
            align: "left",
            defaultSortOrder: urlSortOrder["last_touch"] || null,
            sorter: (a,b) => new Date(a.last_touch) - new Date(b.last_touch),
            ellipsis: true,
            render: (date, record) => <span>{(new Date(date).toLocaleString())}</span>
        },
        {
            title: "Has Contacts",
            width: 150,
            dataIndex: "has_contacts",
            align: "left",
            defaultSortOrder: urlSortOrder["has_contacts"] || null,
            sorter: (a,b) => b.has_contacts.localeCompare(a.has_contacts),
            ellipsis: true,
        },
        {
            title: "Has Contributors",
            width: 175,
            dataIndex: "has_contributors",
            align: "left",
            defaultSortOrder: urlSortOrder["has_contributors"] || null,
            sorter: (a,b) => b.has_contributors.localeCompare(a.has_contributors),
            ellipsis: true,
        },
        {
            title: TABLE.cols.n('donor_id'),
            width: 175,
            dataIndex: TABLE.cols.f('donor_id'),
            align: "left",
            defaultSortOrder: urlSortOrder[TABLE.cols.f('donor_id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('donor_id')].localeCompare(b[TABLE.cols.f('donor_id')]),
            ellipsis: true,
        },{
            title: TABLE.cols.n('donor_submission_id'),
            width: 200,
            dataIndex: TABLE.cols.f('donor_submission_id'),
            align: "left",
            defaultSortOrder: urlSortOrder[TABLE.cols.f('donor_submission_id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('donor_submission_id')].localeCompare(b[TABLE.cols.f('donor_submission_id')]),
            ellipsis: true,
        },
        {
            title: TABLE.cols.n('donor_lab_id'),
            width: 150,
            dataIndex: TABLE.cols.f('donor_lab_id'),
            align: "left",
            defaultSortOrder: urlSortOrder[TABLE.cols.f('donor_lab_id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('donor_lab_id')].localeCompare(b[TABLE.cols.f('donor_lab_id')]),
            ellipsis: true,
        },
        {
            title: "Has Donor Metadata",
            width: 200,
            dataIndex: "has_donor_metadata",
            align: "left",
            defaultSortOrder: urlSortOrder["has_donor_metadata"] || null,
            sorter: (a,b) => b.has_donor_metadata.localeCompare(a.has_donor_metadata),
            ellipsis: true,
        },
        {
            title: "Has Dataset Metadata",
            width: 200,
            dataIndex: "has_dataset_metadata",
            align: "left",
            defaultSortOrder: urlSortOrder["has_data_metadata"] || null,
            sorter: (a,b) => b.has_data_metadata.localeCompare(a.has_data_metadata),
            ellipsis: true,
        },
        {
            title: "Upload",
            width: 175,
            dataIndex: "upload",
            align: "left",
            defaultSortOrder: urlSortOrder["upload"] || null,
            sorter: (a,b) => a.upload.localeCompare(b.upload),
            ellipsis: true,
        },
        {
            title: "Has Rui Info",
            width: 150,
            dataIndex: "has_rui_info",
            align: "left",
            defaultSortOrder: urlSortOrder["has_rui_info"] || null,
            sorter: (a,b) => b.has_rui_info.localeCompare(a.has_rui_info),
            ellipsis: true,
            filteredValue: urlParamFilters[TABLE.cols.f('has_rui_info')] || null,
            filters: uniqueHasRuiStates.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => eq(record[TABLE.cols.f('has_rui_info')], value),
        },
        {
            title: "Has Data",
            width: 125,
            dataIndex: "has_data",
            align: "left",
            defaultSortOrder: urlSortOrder["has_data"] || null,
            sorter: (a,b) => b.has_data.localeCompare(a.has_data),
            ellipsis: true,
        },
    ]

    // Exclude named columns in .env from table
    const filteredDatasetColumns = []
    for (let x = 0; x < datasetColumns.length; x++) {
        if (excludedColumns[datasetColumns[x].dataIndex] === undefined) {
            filteredDatasetColumns.push(datasetColumns[x])
        }
    }

    const dataIndexList = filteredDatasetColumns.map(column => column.dataIndex);

    function countFilteredRecords(data, filters) {
        return TABLE.countFilteredRecords(data, filters, dataIndexList, {case1: 'unpublished', case2: 'published'}, hierarchyGroupings)
    }

    const rowSelection =  TABLE.rowSelection({setDisabledMenuItems, disabledMenuItems, selectedEntities, setSelectedEntities, setCheckedModifiedData})

    const confirmBulkProcess = () => {
        const headers = getHeadersWith(globusToken)
        callService(URLS.ingest.bulk.submit(), headers.headers, selectedEntities.map(item => item.uuid)).then((res) => {
            const {className} = UI_BLOCKS.modalResponse.styling(res)
            let mainTitle = 'Dataset(s) Submitted For Processing'
            const {modalBody} = UI_BLOCKS.modalResponse.body(res, mainTitle)
            setModal({body: modalBody, width: 1000, className, open: true, cancelCSS: 'none', okCallback: null})
        })
    }

    const confirmBulkDatasetEdit = () => {
        confirmBulkEdit({url: URLS.ingest.bulk.edit.datasets(), setModal, bulkEditValues})
    }

    const modalCallbacks = {
        confirmBulkProcess,
        confirmBulkDatasetEdit
    }

    const handleRemove = (record) => {
        TABLE.removeFromSelection(record, selectedEntities, setSelectedEntities, setCheckedModifiedData)
    }

    const showConfirmModalOfSelectedDatasets  = ({callback, afterTableComponent}) => {
        setConfirmModalArgs({callback, afterTableComponent})
        let columns = [
            TABLE.reusableColumns(urlSortOrder, {}).id(),
            TABLE.reusableColumns(urlSortOrder, {}).groupName(uniqueGroupNames),
            TABLE.reusableColumns(urlSortOrder, {}).status,
            TABLE.reusableColumns(urlSortOrder, {}).deleteAction(handleRemove)
        ]
        UI_BLOCKS.modalConfirm.showConfirmModalOfSelectedEntities({callback, afterTableComponent,
        columns, selectedEntities, setModal})
    }

    const handleMenuClick = (e) => {
        if (e.key === '1') {
            TABLE.handleCSVDownload()
        }

        if (e.key === '2') {
            showConfirmModalOfSelectedDatasets({callback: 'confirmBulkProcess'})
        }

        if (e.key === '3') {
            showConfirmModalOfSelectedDatasets({callback: 'confirmBulkDatasetEdit',
                afterTableComponent: <BulkEditForm statuses={TABLE.getStatusFilters(STATUS.datasets)}
                                                       dataProviderGroups={dataProviderGroups} setBulkEditValues={setBulkEditValues}
                                                   />})
        }
    }

    const closeModal = () => {
        setModal({...modal, okText: 'OK', open: false})
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

    const items = TABLE.bulkSelectionDropdown((hasDataAdminPrivs ? [
        {
            label: 'Submit For Processing',
            key: '2',
            icon: <ThunderboltOutlined style={{ fontSize: '18px' }} />,
            disabled: disabledMenuItems['bulkSubmit']
        }
    ] : []), {hasDataAdminPrivs, disabledMenuItems});

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
                    <Visualizations data={countFilteredRecords(rawData, filters)} filters={filters} />
                    <div className="row">
                        <div className="col-12 col-md-3 count mt-md-3">
                            {TABLE.rowSelectionDropdown({menuProps, selectedEntities, countFilteredRecords, modifiedData, filters})}
                            {TABLE.csvDownloadButton({selectedEntities, countFilteredRecords, checkedModifiedData, filters, modifiedData, filename: 'datasets-data.csv'})}
                        </div>
                    </div>
                    <Table className={`m-4 c-table--main ${countFilteredRecords(data, filters).length > 0 ? '' : 'no-data'}`}
                           columns={filteredDatasetColumns}
                           dataSource={countFilteredRecords(rawData, filters)}
                           showHeader={!loading}
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
                        className={modal.className}
                        width={modal.width}
                        cancelButtonProps={{ style: { display: modal.cancelCSS } }}
                        closable={false}
                        open={modal.open}
                        okText={modal.okText}
                        onCancel={closeModal}
                        onOk={handleModalOk}
                        okButtonProps={modal.okButtonProps}
                    >
                        {modal.body}
                    </Modal>
                </>
            )}
        </div>
    );
};

export default DatasetTable