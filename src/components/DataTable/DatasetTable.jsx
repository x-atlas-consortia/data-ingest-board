import {Modal, Table} from "antd";
import {ExportOutlined, ThunderboltOutlined, CloudUploadOutlined} from "@ant-design/icons";
import React, {useContext, useEffect, useState} from "react";
import Spinner from "../Spinner";
import axios from "axios";
import ENVS from "../../lib/helpers/envs";
import TABLE from "../../lib/helpers/table";
import URLS from "../../lib/helpers/urls";
import {callService, eq, getHeadersWith, getUBKGName} from "@/lib/helpers/general";
import ModalOver from "../ModalOver";
import ModalOverData from "../ModalOverData";
import AppContext from "../../context/AppContext";
import UI_BLOCKS from "../../lib/helpers/uiBlocks";
import {STATUS} from "@/lib/constants";
import BulkEditForm from "../BulkEditForm";
import Visualizations from "@/components/Visualizations";
import {ChartProvider} from "@/context/ChartContext";

const DatasetTable = ({
    data,
    loading,
    handleTableChange,
    page,
    pageSize,
    sortField,
    sortOrder,
    filters,
}) => {
    const {globusToken, hasDataAdminPrivs, hasPipelineTestingPrivs, selectedEntities, setSelectedEntities, dataProviderGroups, confirmBulkEdit} = useContext(AppContext)
    const [rawData, setRawData] = useState([])
    const [modifiedData, setModifiedData] = useState([])
    const [checkedModifiedData, setCheckedModifiedData] = useState([])
    const [disabledMenuItems, setDisabledMenuItems] = useState({bulkEdit: true, bulkSubmit: true, submitForPipelineTesting:true})
    const [bulkEditValues, setBulkEditValues] = useState({})
    const [confirmModalArgs, setConfirmModalArgs] = useState({})
    const hierarchyGroupings = {}
    const uniqueDataFilters = {}
    let urlParamFilters = {}
    let urlSortOrder = {}

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
        return TABLE.filterField(data, f, excludedColumns)
    }

    // Build unique filter dropdown for listed fields based on their respective data
    const datasetFilterFields = [...ENVS.datasetFilterFields(), ...ENVS.sharedFilterFields()]
    for (let f of datasetFilterFields) {
        uniqueDataFilters[f] = filterField(f)
    }

    const uniqueOrganType = TABLE.makeHierarchyFilters(uniqueDataFilters['organ'], hierarchyGroupings)
    const uniquePriorityPList = [...new Set(filterField('priority_project_list').flat())]

    // This is important to show visual indicator selections on filter drop down menu when there are valid url filters
    TABLE.handleUrlParams({filters, urlParamFilters, fields: datasetFilterFields, hierarchyGroupings})

    TABLE.handleSortOrder({sortOrder, sortField, urlSortOrder, filterFields: datasetFilterFields})


    const datasetColumns = [
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).id(),
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).groupName(uniqueDataFilters['group_name']),
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).status,
        {
            ... TABLE.columnOptions({
                field: "dataset_type",
                title: "Dataset Type",
                width: 170,  urlSortOrder, urlParamFilters, uniqueDataFilters})
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
            ... TABLE.columnOptions({
                field: "source_type",
                title: "Source Type",
                width: 150,  urlSortOrder, urlParamFilters, uniqueDataFilters})
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
                    <span className='js-cell__organType'>{getUBKGName(organType)}</span>
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
            sorter: (a,b) => a.provider_experiment_id?.localeCompare(b.provider_experiment_id),
            ellipsis: true,
            render: (experimentId, record) => {
                return (
                    <span className='txt-break-spaces'>{experimentId}</span>
                )
            }
        },
        TABLE.reusableColumns(urlSortOrder, urlParamFilters).priorityProjectList(uniquePriorityPList, filters),
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
            sorter: (a,b) => b.has_contacts?.localeCompare(a.has_contacts),
            ellipsis: true,
        },
        {
            title: "Has Contributors",
            width: 175,
            dataIndex: "has_contributors",
            align: "left",
            defaultSortOrder: urlSortOrder["has_contributors"] || null,
            sorter: (a,b) => b.has_contributors?.localeCompare(a.has_contributors),
            ellipsis: true,
        },
        {
            title: TABLE.cols.n('donor_id'),
            width: 175,
            dataIndex: TABLE.cols.f('donor_id'),
            align: "left",
            defaultSortOrder: urlSortOrder[TABLE.cols.f('donor_id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('donor_id')]?.localeCompare(b[TABLE.cols.f('donor_id')]),
            ellipsis: true,
        },{
            title: TABLE.cols.n('donor_submission_id'),
            width: 200,
            dataIndex: TABLE.cols.f('donor_submission_id'),
            align: "left",
            defaultSortOrder: urlSortOrder[TABLE.cols.f('donor_submission_id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('donor_submission_id')]?.localeCompare(b[TABLE.cols.f('donor_submission_id')]),
            ellipsis: true,
        },
        {
            title: TABLE.cols.n('donor_lab_id'),
            width: 150,
            dataIndex: TABLE.cols.f('donor_lab_id'),
            align: "left",
            defaultSortOrder: urlSortOrder[TABLE.cols.f('donor_lab_id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('donor_lab_id')]?.localeCompare(b[TABLE.cols.f('donor_lab_id')]),
            ellipsis: true,
        },
        {
            ... TABLE.columnOptions({
                field: "has_donor_metadata",
                width: 200,  urlSortOrder, urlParamFilters, uniqueDataFilters})

        },
        {
            ... TABLE.columnOptions({
                field: "has_source_sample_metadata",
                title: "Has Source Sample Metadata",
                width: 250,  urlSortOrder, urlParamFilters, uniqueDataFilters})
        },
        {
            ... TABLE.columnOptions({
                field: "has_dataset_metadata",
                title: "Has Dataset Metadata",
                width: 250,  urlSortOrder, urlParamFilters, uniqueDataFilters})
        },
        {
            title: "Upload",
            width: 175,
            dataIndex: "upload",
            align: "left",
            defaultSortOrder: urlSortOrder["upload"] || null,
            sorter: (a,b) => a.upload?.localeCompare(b.upload),
            ellipsis: true,
        },
        {
            ... TABLE.columnOptions({
                field: "has_rui_info",
                title: "Has Rui Info",
                width: 150,  urlSortOrder, urlParamFilters, uniqueDataFilters
            })
        },
        {
            ... TABLE.columnOptions({
                field: "has_data",
                title: "Has Data",
                width: 125,  urlSortOrder, urlParamFilters, uniqueDataFilters
            })
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
            TABLE.reusableColumns(urlSortOrder, {}).groupName(uniqueDataFilters['group_name']),
            TABLE.reusableColumns(urlSortOrder, {}).status,
            TABLE.reusableColumns(urlSortOrder, {}).deleteAction(handleRemove)
        ]
        UI_BLOCKS.modalConfirm.showConfirmModalOfSelectedEntities({callback, afterTableComponent,
        columns, selectedEntities, setModal})
    }

    const handleMenuClick = (e) => {
        if (e.key === '1') {
            TABLE.handleCSVDownload({selectedEntities, countFilteredRecords, checkedModifiedData, filters, modifiedData, filename: 'datasets-data.csv'})
        }

        if (e.key === '1b') {
            TABLE.handleManifestDownload({selectedEntities, countFilteredRecords, checkedModifiedData, filters, modifiedData})
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
        
        if (e.key === '4') {
            submitForPipelineTesting();
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

    const handleExposedActions = () => {
        let selections = []
        if(hasDataAdminPrivs){
            selections.push({
                label: 'Submit For Processing',
                key: '2',
                icon: <ThunderboltOutlined style={{ fontSize: '18px' }} />,
                disabled: disabledMenuItems['bulkSubmit']
            },)
        }
        if( (hasPipelineTestingPrivs || hasDataAdminPrivs) && ENVS.submissionTestingEnabled()){
            selections.push({
                label: 'Submit For Testing',
                key: '4',
                icon: <CloudUploadOutlined style={{ fontSize: '18px' }} />,
                disabled: disabledMenuItems['submitForPipelineTesting']
            },)
        }
        return selections
    }

    const submitForPipelineTesting = async () => {
        const options = getHeadersWith(globusToken);
        const selectedEntityUUIDs = [...selectedEntities.map((e) => e.uuid)];
        try {
            const response = await axios.post(URLS.ingest.data.pipelineTesting(), selectedEntityUUIDs, options);
            handlePipelineResponse(response);
        } catch (error) {
            handlePipelineResponse(error.response);
        }
    };
    
    const handlePipelineResponse = (response) => {
        const { className } = UI_BLOCKS.modalResponse.styling(response);
        const mainTitle = 'Dataset(s) Submitted For Pipeline Testing';
        const { modalBody } = UI_BLOCKS.modalResponse.body(response, mainTitle);
        setModal({ body: modalBody, width: 1000, className, open: true, cancelCSS: 'none', okCallback: null });
    };

    
    const items = TABLE.bulkSelectionDropdown((
        handleExposedActions()
        ),{hasDataAdminPrivs, disabledMenuItems});

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
                    <ChartProvider>
                        <Visualizations data={countFilteredRecords(rawData, filters)} filters={filters} applyFilters={handleTableChange} />
                    </ChartProvider>
                    <div className="count c-table--header">
                        {TABLE.rowSelectionDropdown({menuProps, selectedEntities, countFilteredRecords, modifiedData, filters})}
                        {TABLE.viewSankeyButton({filters})}
                    </div>

                    <Table className={`c-table--main ${countFilteredRecords(data, filters).length > 0 ? '' : 'no-data'}`}
                           columns={filteredDatasetColumns}
                           dataSource={countFilteredRecords(rawData, filters)}
                           showHeader={!loading}
                           bordered={false}
                           loading={loading}
                           pagination={{ ...TABLE.paginationOptions, current: page, defaultPageSize: pageSize}}
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
