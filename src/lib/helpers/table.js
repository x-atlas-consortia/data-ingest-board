import {CaretDownOutlined, DownloadOutlined} from "@ant-design/icons";
import {Dropdown, Space, Tooltip} from "antd";
import React from "react";
import {eq, toDateString} from "./general";
import ENVS from "./envs";
import URLS from "./urls";
import THEME from "./theme";
import {CSVLink} from "react-csv";

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
    countFilteredRecords: (data, filters, dataIndexList, special) => {
        const filteredData = data.filter(item => {
            for (const key in filters) {
                if (!dataIndexList.includes(key) || !filters[key]) {
                    continue;
                }
                const filterValue = filters[key].toLowerCase();
                const filterValues = filterValue.split(",");
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
    bulkSelectionDropdown: (items = []) => {
        let _items = [
            {
                label: 'Download CSV Data',
                key: '1',
                icon: <DownloadOutlined title="Export Selected Data as CSV" style={{ fontSize: '18px' }}/>,
            }
        ]
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
    reusableColumns: (defaultSortOrder, defaultFilteredValue) => {
        return {
            id: (renderDropdownContent) => ({
                title: TABLE.cols.n('id'),
                width: 190,
                dataIndex: TABLE.cols.f('id'),
                align: "left",
                defaultSortOrder: defaultSortOrder[TABLE.cols.f('id')] || null,
                sorter: (a,b) => a[TABLE.cols.f('id')].localeCompare(b[TABLE.cols.f('id')]),
                ellipsis: true,
                render: (id, record) => {
                    const dropdownMethod = renderDropdownContent || TABLE.renderDropdownContent
                    return (
                        <Dropdown menu={{items: dropdownMethod(record)}} trigger={['click']}>
                            <a href="#" onClick={(e) => e.preventDefault()} className='lnk--ic'>{id} <CaretDownOutlined style={{verticalAlign: 'middle'}} /></a>
                        </Dropdown>
                    )
                }
            }),
            groupName: (uniqueGroupNames) => ({
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
            }),
            assignedToGroupName: (uniqueAssignedToGroupNames) =>({
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
            }),
            status: {
                title: "Status",
                width: 150,
                dataIndex: "status",
                align: "left",
                defaultSortOrder: defaultSortOrder["status"] || null,
                sorter: (a,b) => a.status.localeCompare(b.status),
                defaultFilteredValue: defaultFilteredValue["status"] || null,
                ellipsis: true,
                filters: TABLE.getStatusFilters( [
                    {text: 'Unpublished', value: 'unpublished'},
                    {text: 'Published', value: 'published'},
                    {text: 'QA', value: 'qa'}
                ]),
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
            <CSVLink data={selectedEntities.current.size ? countFilteredRecords(checkedModifiedData, filters) : countFilteredRecords(modifiedData, filters)} filename={filename} className="ic--download">
                <DownloadOutlined title="Export Selected Data as CSV" style={{ fontSize: '24px' }}/>
            </CSVLink>
        </span>
    },
    rowSelectionDropdown: ({menuProps, selectedEntities, countFilteredRecords, modifiedData, filters, entity = 'Dataset'}) => {
      return <Space wrap>
          <Dropdown.Button menu={menuProps}>
              {selectedEntities.current.size ? 'Selected': 'Showing'} {selectedEntities.current.size ? selectedEntities.current.size : countFilteredRecords(modifiedData, filters).length} {entity}(s)
          </Dropdown.Button>
      </Space>
    },
    rowSelection: ({setDisabledMenuItems, disabledMenuItems, selectedEntities, setCheckedModifiedData, disabledRows = ['Published']}) => {
        return {
            preserveSelectedRowKeys: true,
            onSelect: (record, selected, selectedRows, nativeEvent) => {
                if (!selected) {
                    selectedEntities.current.forEach(x => x.uuid === record.uuid ? selectedEntities.current.delete(x) : x)
                }
            },
            onSelectAll: (selected, selectedRows, changeRows) => {
                if (!selected) {
                    for (let record of changeRows) {
                        selectedEntities.current.forEach(x => x.uuid === record.uuid ? selectedEntities.current.delete(x) : x)
                    }
                }
            },
            onChange: (selectedRowKeys, selectedRows, e, a) => {
                if (!selectedRows.length) {
                    setDisabledMenuItems({...disabledMenuItems, bulkSubmit: true})
                } else {
                    setDisabledMenuItems({...disabledMenuItems, bulkSubmit: false})
                }
                selectedRows.forEach(item => selectedEntities.current.add(item))
                setCheckedModifiedData(TABLE.flattenDataForCSV(JSON.parse(JSON.stringify(Array.from(selectedEntities.current)))))
            },
            getCheckboxProps: (record) => ({
                disabled: disabledRows.comprises(record.status),
            })
        }
    }
}

export default TABLE