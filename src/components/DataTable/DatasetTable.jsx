import {Dropdown, Menu, Table} from "antd";
import {DownloadOutlined, ExportOutlined, CaretDownOutlined} from "@ant-design/icons";
import {CSVLink} from "react-csv";
import React from "react";
import Spinner from "../Spinner";
import {ENVS, eq, getUBKGName, TABLE, URLS} from "../../service/helper";

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
        if (ENVS.filterFields().includes(field)) {
            defaultSortOrder[field] = order;
        }
    }

    for (let _field of ENVS.defaultFilterFields()) {
        if (filters.hasOwnProperty(_field)) {
            defaultFilteredValue[_field] = filters[_field].split(",");
        }
    }

    const renderDropdownContent = (record) => (
        <Menu>
            <Menu.Item key="1">
                <a href={URLS.portal.view(record.uuid)} target="_blank" rel="noopener noreferrer">Data Portal</a>
            </Menu.Item>
            {!eq(URLS.portal.main(), URLS.ingest.main()) && <Menu.Item key="2">
                <a href={URLS.ingest.view(record.uuid)} target="_blank" rel="noopener noreferrer">Ingest Portal</a>
            </Menu.Item> }
            <Menu.Item key="3">
                <a href={record.globus_url} target="_blank" rel="noopener noreferrer">Globus Directory</a>
            </Menu.Item>
        </Menu>
    );

    const datasetColumns = [
        {
            title: TABLE.cols.n('id'),
            width: 180,
            dataIndex: TABLE.cols.f('id'),
            align: "left",
            defaultSortOrder: defaultSortOrder[TABLE.cols.f('id')] || null,
            sorter: (a,b) => a[TABLE.cols.f('id')].localeCompare(b[TABLE.cols.f('id')]),
            ellipsis: true,
            render: (id, record) => (
                <Dropdown overlay={renderDropdownContent(record)} trigger={['click']}>
                    <a href="#">{id} <CaretDownOutlined style={{verticalAlign: 'middle'}} /></a>
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
                <span style={{backgroundColor: getStatusColor(status).color, border: `1px solid ${getStatusColor(status).darkColor}`, fontSize: '0.85em', color: 'white', borderRadius: '0.375rem', padding: '0.35em 0.65em', fontWeight: 'bold'}}>
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
            onFilter: (value, record) => eq(record.data_types, value),
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
                    <><a href={URLS.portal.view(record.organ_uuid, 'sample')} target="_blank" rel="noopener noreferrer">
                        {organId} <ExportOutlined style={{verticalAlign: 'middle'}}/>
                    </a>
                        </>
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

    // Exclude named columns in .env from table
    const filteredDatasetColumns = []
    const excludedColumns = ENVS.excludeTableColumns()
    for (let x = 0; x < datasetColumns.length; x++) {
        if (excludedColumns[datasetColumns[x].dataIndex] === undefined) {
            filteredDatasetColumns.push(datasetColumns[x])
        }
    }

    const dataIndexList = filteredDatasetColumns.map(column => column.dataIndex);

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
                return { color: 'green', darkColor: 'green' };
            case 'qa':
                return { color: 'yellow', darkColor: 'darkyellow' };
            case 'error':
                return { color: '#dc3545', darkColor: '#dc3545' };
            case 'invalid':
                return { color: 'orange', darkColor: 'orange' };
            case 'new':
                return { color: '#20c997', darkColor: '#20c997' };
            case 'processing':
                return { color: 'blue', darkColor: 'darkblue' };
            case 'submitted':
                return { color: '#0dcaf0', darkColor: '#0dcaf0' };
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
                           columns={filteredDatasetColumns}
                           dataSource={data}
                           showHeader={!loading}
                           bordered={false}
                           loading={loading}
                           pagination={{ position: ["topRight", "bottomRight"], current: page, defaultPageSize: pageSize}}
                           scroll={{ x: 1500, y: 1500 }}
                           onChange={handleTableChange}
                           rowKey={TABLE.cols.f('id')}
                    />
                </>
            )}
        </div>
    );
};

export default DatasetTable