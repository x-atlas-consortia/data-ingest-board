import {Dropdown, Menu, Modal, Popover, Table, Tooltip} from "antd";
import {DownloadOutlined, ExportOutlined, CaretDownOutlined} from "@ant-design/icons";
import {CSVLink} from "react-csv";
import React, {useEffect, useState} from "react";
import Spinner from "../Spinner";
import {ENVS, eq, getUBKGName, TABLE, URLS} from "../../lib/helper";
import ModalOver from "../ModalOver";
import ModalOverData from "../ModalOverData";

const DatasetTable = ({ data, loading, handleTableChange, page, pageSize, sortField, sortOrder, filters, className}) => {
    const [rawData, setRawData] = useState([])
    const [modifiedData, setModifiedData] = useState([])

    useEffect(() => {
        setRawData(JSON.parse(JSON.stringify(data)))
        setModifiedData(TABLE.flattenDataForCSV(JSON.parse(JSON.stringify(data))))
    }, [data])


    const [modalOpen, setModalOpen] = useState(false)
    const [modalBody, setModalBody] = useState(null)
    const [modalWidth, setModalWidth] = useState(700)
    const excludedColumns = ENVS.excludeTableColumns()
    const filterField = (f) => {
        if (excludedColumns[f]) return []
        return [...new Set(data.map(item => item[f]))]
    }
    const uniqueGroupNames = filterField('group_name')
    const uniqueAssignedToGroupNames = filterField('assigned_to_group_name')
    const unfilteredOrganTypes = filterField('organ')
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
    let defaultFilteredValue = {};
    let defaultSortOrder = {};
    if (order && field && (eq(order, "ascend") || eq(order, "descend"))){
        if (ENVS.filterFields().includes(field)) {
            defaultSortOrder[field] = order;
        }
    }

    for (let _field of ENVS.defaultFilterFields()) {
        if (filters.hasOwnProperty(_field)) {
            defaultFilteredValue[_field] = filters[_field].toLowerCase().split(",");
        }
    }


    const datasetColumns = [
        TABLE.reusableColumns(defaultSortOrder, defaultFilteredValue).id,
        {
            title: "Group Name",
            width: 300,
            dataIndex: "group_name",
            align: "left",
            defaultSortOrder: defaultSortOrder["group_name"] || null,
            sorter: (a,b) => a.group_name.localeCompare(b.group_name),
            defaultFilteredValue: defaultFilteredValue["group_name"] || null,
            filters: uniqueGroupNames.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => eq(record.group_name, value),
            ellipsis: true,
        },
        TABLE.reusableColumns(defaultSortOrder, defaultFilteredValue).status,
        {
            title: "Dataset Type",
            width: 170,
            dataIndex: "dataset_type",
            align: "left",
            defaultSortOrder: defaultSortOrder["dataset_type"] || null,
            sorter: (a,b) => a.dataset_type.localeCompare(b.dataset_type),
            defaultFilteredValue: defaultFilteredValue["dataset_type"] || null,
            filters: uniqueDatasetType.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => eq(record.dataset_type, value),
            ellipsis: true,
        },
        {
            title: "Processed Datasets",
            width: 180,
            dataIndex: "processed_datasets",
            align: "left",
            defaultSortOrder: defaultSortOrder["processed_datasets"] || null,
            sorter: (a,b) => {
                let a1 = Array.isArray(a.processed_datasets) ? a.processed_datasets.length : 0
                let b1 = Array.isArray(b.processed_datasets) ? b.processed_datasets.length : 0
                return a1 - b1
            },
            defaultFilteredValue: defaultFilteredValue["processed_datasets"] || null,
            ellipsis: true,
            render: (processed_datasets, record) => {
                return <ModalOverData args={{defaultFilteredValue, defaultSortOrder, record}} content={Array.isArray(processed_datasets) ? processed_datasets : []} setModalOpen={setModalOpen} setModalBody={setModalBody} setModalWidth={setModalWidth} />
            }
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
                return <ModalOver content={task} setModalOpen={setModalOpen} setModalBody={setModalBody} setModalWidth={setModalWidth} />
            }
        },
        {
            title: TABLE.cols.n('source_type', 'Source Type'),
            width: 150,
            dataIndex: TABLE.cols.f('source_type'),
            align: "left",
            defaultSortOrder: defaultSortOrder[TABLE.cols.f('source_type')] || null,
            sorter: (a,b) => a[TABLE.cols.f('source_type')].localeCompare(b[TABLE.cols.f('source_type')]),
            defaultFilteredValue: defaultFilteredValue[TABLE.cols.f('source_type')] || null,
            filters: uniqueSourceTypes.map(name => ({ text: name, value: name?.toLowerCase() })),
            onFilter: (value, record) => eq(record[TABLE.cols.f('source_type')], value),
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
            filters: uniqueOrganType.map(name => ({ text: getUBKGName(name), value: name.toLowerCase() })),
            onFilter: (value, record) => eq(record.organ, value),
            ellipsis: true,
            render: (organType, record) => {
                if (!organType) return null
                return (
                    <span>{getUBKGName(organType)}</span>
                )
            }
        },
        {
            title: TABLE.cols.n('organ_id'),
            width: 180,
            dataIndex: TABLE.cols.f('organ_id'),
            align: "left",
            defaultSortOrder: defaultSortOrder[TABLE.cols.f('organ_id')] || null,
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
            showSorterTooltip: {
                title: <span>If the <code>Dataset</code> is published <i>Last Touch</i> returns the date/time that the <code>Dataset</code> was published, otherwise it returns the date/time that the <code>Dataset</code> record was last updated. <small className={'text-muted'}>NOTE: This does not include updates to data via Globus (or otherwise), only updates to metadata stored in the {ENVS.appContext()} provenance database.</small></span>
            },
            dataIndex: "last_touch",
            align: "left",
            defaultSortOrder: defaultSortOrder["last_touch"] || null,
            sorter: (a,b) => new Date(a.last_touch) - new Date(b.last_touch),
            ellipsis: true,
            render: (date, record) => <span>{(new Date(date).toLocaleString())}</span>
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
            title: TABLE.cols.n('donor_id'),
            width: 175,
            dataIndex: TABLE.cols.f('donor_id'),
            align: "left",
            defaultSortOrder: defaultSortOrder[TABLE.cols.f('donor_id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('donor_id')].localeCompare(b[TABLE.cols.f('donor_id')]),
            ellipsis: true,
        },{
            title: TABLE.cols.n('donor_submission_id'),
            width: 200,
            dataIndex: TABLE.cols.f('donor_submission_id'),
            align: "left",
            defaultSortOrder: defaultSortOrder[TABLE.cols.f('donor_submission_id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('donor_submission_id')].localeCompare(b[TABLE.cols.f('donor_submission_id')]),
            ellipsis: true,
        },
        {
            title: TABLE.cols.n('donor_lab_id'),
            width: 150,
            dataIndex: TABLE.cols.f('donor_lab_id'),
            align: "left",
            defaultSortOrder: defaultSortOrder[TABLE.cols.f('donor_lab_id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('donor_lab_id')].localeCompare(b[TABLE.cols.f('donor_lab_id')]),
            ellipsis: true,
        },
        {
            title: "Has Donor Metadata",
            width: 200,
            dataIndex: "has_donor_metadata",
            align: "left",
            defaultSortOrder: defaultSortOrder["has_donor_metadata"] || null,
            sorter: (a,b) => b.has_donor_metadata.localeCompare(a.has_donor_metadata),
            ellipsis: true,
        },
        {
            title: "Has Dataset Metadata",
            width: 200,
            dataIndex: "has_dataset_metadata",
            align: "left",
            defaultSortOrder: defaultSortOrder["has_data_metadata"] || null,
            sorter: (a,b) => b.has_data_metadata.localeCompare(a.has_data_metadata),
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
            defaultFilteredValue: defaultFilteredValue[TABLE.cols.f('has_rui_info')] || null,
            filters: uniqueHasRuiStates.map(name => ({ text: name, value: name.toLowerCase() })),
            onFilter: (value, record) => eq(record[TABLE.cols.f('has_rui_info')], value),
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

    // Exclude named columns in .env from table
    const filteredDatasetColumns = []
    for (let x = 0; x < datasetColumns.length; x++) {
        if (excludedColumns[datasetColumns[x].dataIndex] === undefined) {
            filteredDatasetColumns.push(datasetColumns[x])
        }
    }

    const dataIndexList = filteredDatasetColumns.map(column => column.dataIndex);

    function countFilteredRecords(data, filters) {
        return TABLE.countFilteredRecords(data, filters, dataIndexList, {case1: 'unpublished', case2: 'published'})
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
                            <CSVLink data={countFilteredRecords(modifiedData, filters)} filename="datasets-data.csv" className="ic--download">
                                <DownloadOutlined title="Export Selected Data as CSV" style={{ fontSize: '24px' }}/>
                            </CSVLink>
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
                    />

                    <Modal
                        width={modalWidth}
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

export default DatasetTable