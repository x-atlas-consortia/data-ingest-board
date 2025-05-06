import {CaretDownOutlined, CloseOutlined, DownloadOutlined, EditOutlined} from "@ant-design/icons";
import {Button, Dropdown, Space, Tooltip} from "antd";
import React from "react";
import {eq, toDateString} from "./general";
import ENVS from "./envs";
import URLS from "./urls";
import THEME from "./theme";
import {CSVLink} from "react-csv";
import {STATUS} from "../constants";

const TABLE = {
    cols: {
        n: (k, n) => {
            const cols = ENVS.tableColumns()
            return cols[k]?.name || n || k
        },
        f: (k) => {
            const cols = ENVS.tableColumns()
            return cols[k]?.field || k
        }
    },
    paginationOptions: {
        pageSizeOptions: [10,20,30,50,100,200], showSizeChanger: true, showQuickJumper: true, position: ["topRight", "bottomRight"],
    },
    getStatusDefinition: (status, entityType = 'Dataset') => {
        let msg
        if (status) {
            status = status.toUpperCase();
            switch(status) {
                case 'NEW':
                    msg = <span>The Globus directory is ready for data upload.</span>
                    break;
                case 'INCOMPLETE':
                    msg = <span>The data provider has begun to upload data but is not ready for validation or processing via the ingest pipeline.</span>
                    break;
                case 'INVALID':
                    msg = <span>The data did not pass validation prior to processing via the ingest pipeline.</span>
                    break;
                case 'QA':
                    msg = <span>The data has been successfully processed via the ingest pipeline and is awaiting data provider curation.</span>
                    break;
                case 'ERROR':
                    msg = <span>An error occurred during processing via the ingest pipeline.</span>
                    break;
                case 'PROCESSING':
                    msg = <span>The data is currently being processed via the ingest pipeline.</span>
                    break;
                case 'REORGANIZED':
                    msg = <span>Datasets included in this <code>Upload</code> have been registered and data has been reorganized on the Globus Research Management system.</span>
                    break;
                case 'SUBMITTED':
                    msg = <span>The data provider has finished uploading data and the data is ready for validation.</span>
                    break;
                case 'PUBLISHED':
                    msg = <span>The data has been successfully curated and released for public use.</span>
                    break;
                default:
                    msg = <span>The <code>{entityType}</code> has been {status}.</span>
                    break;
            }
        }
        return msg;
    },
    getStatusFilters: (entityTypeFilters) => {
        const filters = [
            {text: 'Error', value: 'error'},
            {text: 'Invalid', value: 'invalid'},
            {text: 'New', value: 'new'},
            {text: 'Processing', value: 'processing'},
            {text: 'Submitted', value: 'submitted'},
            {text: 'Incomplete', value: 'incomplete'},
        ]
        return filters.concat(entityTypeFilters)
    },
    countFilteredRecords: (data, filters, dataIndexList, special, filterGroupings = {}) => {
        const filteredData = data.filter(item => {
            for (const key in filters) {
                if (!dataIndexList.includes(key) || !filters[key]) {
                    continue;
                }
                const filterValuesRaw = filters[key].toLowerCase().split(",");
                let filterValues = [];
                for (let v of filterValuesRaw) {
                    // append either the values for a particular group or just the filter itself
                    filterValues = filterValues.concat(filterGroupings[v] || [v]);
                }
                if (filterValues.includes(special.case1)) {
                    if (eq(item[key], special.case2)) {
                        return false;
                    }
                } else if (item[key] && !filterValues.some(value => eq(item[key], value))) {
                    return false;
                } else if (!item[key]) {
                    return false;
                }
            }
            return true;
        });
        return filteredData;
    },
    flattenDataForCSV: (data) => {
        return data.map(item => {
            for (const key in item) {
                if (['last_touch', 'created_timestamp', 'published_timestamp'].comprises(key)) {
                    item[key] = toDateString(item[key])
                }

                if (['processed_datasets', 'descendant_datasets', 'descendants'].comprises(key)) {
                    delete item[key]
                }
                if (Array.isArray(item[key])) {
                    // Convert objects to string representations
                    item[key] = item[key].map(element => (typeof element === 'object' ? JSON.stringify(element).replace(/"/g, '""') : element));

                    // Convert other arrays to comma-delimited strings
                    if (Array.isArray(item[key])) {
                        item[key] = `${item[key].join(', ')}`;
                    }
                }
            }
            return item;
        })
    },
    bulkSelectionDropdown: (items = [], {hasDataAdminPrivs, disabledMenuItems}) => {
        let _items = [
            {
                label: 'Download CSV Data',
                key: '1',
                icon: <DownloadOutlined title="Export Selected Data as CSV" style={{ fontSize: '18px' }}/>,
            }
        ]
        if (hasDataAdminPrivs && ENVS.bulkEditEnabled()) {
            _items.push(
                {
                    label: 'Bulk Edit',
                    key: '3',
                    icon: <EditOutlined />,
                    disabled: disabledMenuItems['bulkEdit']
                }
            )
        }

        return _items.concat(items);
    },
    renderDropdownContent: (record) => {
        const items = [
            {
                key: '1',
                label: (
                    <a href={URLS.portal.view(record.uuid)} target="_blank" rel="noopener noreferrer">Data Portal</a>
                )
            }
        ]

        if (!eq(URLS.portal.main(), URLS.ingest.main())) {
            items.push(
                {
                    key: '2',
                    label: (
                        <a href={URLS.ingest.view(record.uuid)} target="_blank" rel="noopener noreferrer">Ingest Portal</a>
                    )
                }
            )
        }

        items.push(
            {
                key: '3',
                label: (
                    <a href={record.globus_url} target="_blank" rel="noopener noreferrer">Globus Directory</a>
                )
            }
        )

        return items
    },
    reusableColumns: (defaultSortOrder, urlParamFilters) => {
        return {
            id: (renderDropdownContent) => ({
                title: TABLE.cols.n('id'),
                width: 210,
                dataIndex: TABLE.cols.f('id'),
                align: "left",
                defaultSortOrder: defaultSortOrder[TABLE.cols.f('id')] || null,
                sorter: (a,b) => a[TABLE.cols.f('id')].localeCompare(b[TABLE.cols.f('id')]),
                ellipsis: true,
                render: (id, record) => {
                    const dropdownMethod = renderDropdownContent || TABLE.renderDropdownContent
                    return (
                        <Dropdown menu={{items: dropdownMethod(record)}} trigger={['click']}>
                            <a href="#" onClick={(e) => e.preventDefault()} data-gtm-info={record.uuid} className='lnk--ic js-gtm--btn-cta-entityDropdown'>{id} <CaretDownOutlined style={{verticalAlign: 'middle'}} /></a>
                        </Dropdown>
                    )
                }
            }),
            groupName: (uniqueGroupNames, width) => ({
                title: "Group Name",
                width: width || 300,
                dataIndex: "group_name",
                align: "left",
                defaultSortOrder: defaultSortOrder["group_name"] || null,
                sorter: (a,b) => a.group_name.localeCompare(b.group_name),
                filteredValue: urlParamFilters["group_name"] || null,
                filters: uniqueGroupNames.map(name => ({ text: name, value: name.toLowerCase() })),
                onFilter: (value, record) => eq(record.group_name, value),
                ellipsis: true,
                render: (groupName, record) => {
                    return (
                        <span className='txt-break-spaces'>{groupName}</span>
                    )
                }
            }),
            assignedToGroupName: (uniqueAssignedToGroupNames) =>({
                title: "Assigned To Group Name",
                width: 300,
                dataIndex: "assigned_to_group_name",
                align: "left",
                defaultSortOrder: defaultSortOrder["assigned_to_group_name"] || null,
                sorter: (a,b) => a.assigned_to_group_name.localeCompare(b.assigned_to_group_name),
                filteredValue: urlParamFilters["assigned_to_group_name"] || null,
                filters: uniqueAssignedToGroupNames.map(name => ({ text: name, value: name.toLowerCase() })),
                onFilter: (value, record) => eq(record.assigned_to_group_name, value),
                ellipsis: true,
                render: (groupName, record) => {
                    return (
                        <span className='txt-break-spaces'>{groupName}</span>
                    )
                }
            }),
            status: {
                title: "Status",
                width: 150,
                dataIndex: "status",
                align: "left",
                defaultSortOrder: defaultSortOrder["status"] || null,
                sorter: (a,b) => a.status.localeCompare(b.status),
                filteredValue: urlParamFilters["status"] || null,
                ellipsis: true,
                filters: TABLE.getStatusFilters(STATUS.datasets),
                onFilter: (value, record) => {
                    if (eq(value, 'Unpublished')) {
                        return !eq(record.status, 'published');
                    }
                    return eq(record.status, value);
                },
                render: (status) => (
                    <Tooltip title={TABLE.getStatusDefinition(status)}>
                    <span className={`c-badge c-badge--${status.toLowerCase()}`} style={{backgroundColor: THEME.getStatusColor(status).bg, color: THEME.getStatusColor(status).text}}>
                        {status}
                    </span>
                    </Tooltip>

                )
            },
            statusUpload: {
                title: "Status",
                width: 150,
                dataIndex: "status",
                align: "left",
                defaultSortOrder: defaultSortOrder["status"] || null,
                sorter: (a,b) => a.status.localeCompare(b.status),
                filteredValue: urlParamFilters["status"] || null,
                ellipsis: true,
                filters: TABLE.getStatusFilters(STATUS.uploads),
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
            deleteAction: (handleRemove) => {
                return {
                    title: 'Delete',
                    width: 100,
                    render: (date, record) => <span className={'mx-4'} aria-label={`Delete ${TABLE.cols.f('id')} from selection`} onClick={()=> handleRemove(record)}><CloseOutlined style={{color: 'red', cursor: 'pointer'}} /></span>
                }
            }
        }
    },
    handleCSVDownload: () => {
        const $el = document.querySelector('.js-csvDownload')
        $el.style.display = 'block'
        document.querySelector('.ic--download').click()
        $el.style.display = 'none'
    },
    csvDownloadButton: ({selectedEntities, countFilteredRecords, checkedModifiedData, filters, modifiedData, filename}) => {
        return <span className='js-csvDownload' style={{display: 'none', opacity: 0}}>
            <CSVLink data={selectedEntities.length ? countFilteredRecords(checkedModifiedData, []) : countFilteredRecords(modifiedData, filters)} filename={filename} className="ic--download js-gtm--btn-cta-csvDownload">
                <DownloadOutlined title="Export Selected Data as CSV" style={{ fontSize: '24px' }}/>
            </CSVLink>
        </span>
    },
    rowSelectionDropdown: ({menuProps, selectedEntities, countFilteredRecords, modifiedData, filters, entity = 'Dataset'}) => {
        return <Space wrap>
            <Dropdown.Button menu={menuProps}>
                {selectedEntities.length ? 'Selected': 'Showing'} {selectedEntities.length ? selectedEntities.length : countFilteredRecords(modifiedData, filters).length} {entity}(s)
            </Dropdown.Button>
        </Space>
    },
    viewSankeyButton: ({filters}) => {
        let queryString = ''
        if (Object.keys(filters).length > 0) {
            queryString = '?' + Object.entries(filters)
                .map(([key, values]) => `${key}=${values}`)
                .join('&');
        }

        return <Button
            href={`/sankey${queryString}`}
            target="_blank"
            rel="noopener noreferrer"
            type="primary"
            className="text-decoration-none ms-2">
            View Sankey Diagram
        </Button>
    },
    getSelectedRows: (selectedEntities) => {
        return selectedEntities.map((item) => item[TABLE.cols.f('id')])
    },
    updateSelectionStates: (selected, setSelectedEntities, setCheckedModifiedData) => {
        setSelectedEntities(selected)
        setCheckedModifiedData(TABLE.flattenDataForCSV(JSON.parse(JSON.stringify(selected))))
    },
    removeFromSelection: (record, selectedEntities, setSelectedEntities, setCheckedModifiedData, update = true) => {
        let selected = selectedEntities.filter(x => x.uuid !== record.uuid)
        if (update) {
            TABLE.updateSelectionStates(selected, setSelectedEntities, setCheckedModifiedData)
        }
        return selected
    },
    addToSelection: (record, selectedEntities, setSelectedEntities, setCheckedModifiedData, update = true) => {
        let selectedRowKeys = TABLE.getSelectedRows(selectedEntities)
        let selected = Array.from(selectedEntities)
        if (selectedRowKeys.indexOf(record[TABLE.cols.f('id')]) === -1) {
            selected.push(record)
        }
        if (update) {
            TABLE.updateSelectionStates(selected, setSelectedEntities, setCheckedModifiedData)
        }
        return selected
    },
    rowSelection: ({setDisabledMenuItems, disabledMenuItems, selectedEntities,
                       setSelectedEntities, setCheckedModifiedData, disabledRows = ['']}) => {
        return {
            selectedRowKeys: TABLE.getSelectedRows(selectedEntities),
            onSelect: (record, hasSelected, selectedRows, nativeEvent) => {
                const method = hasSelected ? TABLE.addToSelection : TABLE.removeFromSelection
                method(record, selectedEntities, setSelectedEntities, setCheckedModifiedData)
            },
            onSelectAll: (hasSelected, selectedRows, changeRows) => {
                const method = hasSelected ? TABLE.addToSelection : TABLE.removeFromSelection
                let i = 0
                let selected = Array.from(selectedEntities)
                for (let record of changeRows) {
                    selected = method(record, selected, setSelectedEntities, setCheckedModifiedData, false)
                    if (i === changeRows.length - 1) {
                        TABLE.updateSelectionStates(selected, setSelectedEntities, setCheckedModifiedData)
                    }
                    i++
                }
            },
            onChange: (newSelectedRowKeys, selectedRows, e, a) => {
                const hasPublished = selectedRows.some(r => r.status === "Published");
                if (!selectedRows.length) { // If noithing is selected
                    setDisabledMenuItems({...disabledMenuItems, bulkEdit: true, bulkSubmit:true, submitForPipelineTesting: true})
                } else { // at least one thing is selected
                    setDisabledMenuItems({...disabledMenuItems, bulkEdit: hasPublished, bulkSubmit: hasPublished, submitForPipelineTesting: false })
                }
            },
            getCheckboxProps: (record) => ({
                disabled: disabledRows.comprises(record.status),
            })
        }
    }
}

export default TABLE
