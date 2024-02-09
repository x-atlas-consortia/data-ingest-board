import PropTypes from 'prop-types'
import {Popover, Table} from "antd";
import {TABLE, URLS} from "../lib/helper";
import React from "react";
import {ExportOutlined} from "@ant-design/icons";

function ModalOverData({content, cols, setModalBody, setModalOpen, popoverText, args}) {
    if (!content.length || !Array.isArray(content)) {
        return <span>False</span>
    }

    const getColumns = () => {
        if (cols.length) return cols;
        return [
            {
                title: TABLE.cols.n('id'),
                dataIndex: TABLE.cols.f('id'),
                key: TABLE.cols.f('id'),
                defaultSortOrder: args.defaultSortOrder[TABLE.cols.f('id')] || null,
                sorter: (a,b) => a[TABLE.cols.f('id')].localeCompare(b[TABLE.cols.f('id')]),
                ellipsis: true,
                render: (id, record) => <a className={'lnk--ic'} href={URLS.ingest.view(record.uuid)} target="_blank" rel="noopener noreferrer">{id} <ExportOutlined /></a>
            },
            TABLE.reusableColumns(args.defaultSortOrder, args.defaultFilteredValue).status,
            {
                title: 'Creation Date',
                dataIndex: 'created_timestamp',
                key: 'created_timestamp',
                sorter: (a,b) => new Date(a.created_timestamp) - new Date(b.created_timestamp),
                render: (date, record) => <span>{(new Date(date).toLocaleString())}</span>
            },
        ]
    }

    return (
        <>
            <Popover content={popoverText} placement={'left'}><span onClick={() => {
                setModalBody(<div>
                    <h5 className='text-center mb-5'>Derived Datasets of {args.record[TABLE.cols.f('id')]}</h5>
                    <Table rowKey={TABLE.cols.f('id')} dataSource={content} columns={getColumns()} />
                </div>)
                setModalOpen(true)
            }
            }>{content[0][TABLE.cols.f('id')]}...({content.length})</span></Popover>
        </>
    )
}

ModalOverData.defaultProps = {
    popoverText: 'Click to view all derived datasets.',
    cols: []
}

ModalOverData.propTypes = {
    content: PropTypes.array.isRequired,
    cols: PropTypes.array,
    args: PropTypes.object.isRequired,
    setModalBody: PropTypes.func.isRequired,
    setModalOpen: PropTypes.func.isRequired
}

export default ModalOverData