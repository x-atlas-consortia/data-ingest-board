import PropTypes from 'prop-types'
import {Popover, Table} from "antd";
import {TABLE, URLS} from "../lib/helper";
import React from "react";
import {ExportOutlined} from "@ant-design/icons";

function ModalOverData({content, cols, setModalBody, setModalOpen, popoverText, args}) {
    if (!content.length || !Array.isArray(content)) {
        return <span>0</span>
    }

    const getColumns = () => {
        if (cols.length) return cols;
        return [
            TABLE.reusableColumns(args.defaultSortOrder, args.defaultFilteredValue).id,
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
                    <h5 className='text-center mb-5'>{content.length} Derived Dataset{content.length > 1 ? 's': ''}</h5>
                    <Table rowKey={TABLE.cols.f('id')} dataSource={content} columns={getColumns()} />
                </div>)
                setModalOpen(true)
            }
            }>{content.length}</span></Popover>
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