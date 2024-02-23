import PropTypes from 'prop-types'
import {Popover, Table} from "antd";
import {getHeadersWith, getRequestOptions, TABLE, toDateString, URLS} from "../lib/helper";
import React, {useContext, useState} from "react";
import axios from "axios";
import AppContext from "../context/AppContext";
import {CSVLink} from "react-csv";
import {DownloadOutlined} from "@ant-design/icons";
import Spinner from "./Spinner";

function ModalOverData({content, cols, setModalBody, setModalOpen, setModalWidth, popoverText, args}) {

    const {globusToken, revisionsData} = useContext(AppContext)
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
            {
                title: 'Revision',
                width: 100,
                dataIndex: 'revision_number',
                key: 'revision_number',
                sorter: (a,b) => a.revision_number - b.revision_number,
                render: (revision, record) => <span>{revision ? `Version ${revision}`: ''}</span>
            }
        ]
    }

    const getCSVData = () => {
        const results = []
        for (let d of content) {
            results.push(
                {
                    [TABLE.cols.f('id')]: d[TABLE.cols.f('id')],
                    [`primary_dataset_${TABLE.cols.f('id')}`]: args.record[TABLE.cols.f('id')],
                    status: d.status,
                    created_timestamp: toDateString(d.created_timestamp),
                    revision_number: d.revision_number,
                }
            )
        }
        return results
    }

    return (
        <>
            <Popover content={popoverText} placement={'left'}><span onClick={async ()  => {
                setModalWidth(800)
                setModalBody(<Spinner />)
                setModalOpen(true)
                let res = revisionsData.current[content[0].uuid]
                let revisions = res
                if (res === undefined) {
                    res = await axios.get(
                        URLS.entity.revisions(content[0].uuid),
                        getHeadersWith(globusToken)
                    )
                    revisionsData.current[content[0].uuid] = res.data
                    revisions = res.data
                }

                let dict = {}
                for (let r of revisions) {
                    dict[r.uuid] = r.revision_number
                }

                for (let c of content) {
                    if (dict[c.uuid]) {
                        c['revision_number'] = dict[c.uuid]
                    }
                }
                setModalBody(<div>
                    <h5 className='text-center mb-5'>{content.length} Derived Dataset{content.length > 1 ? 's': ''}</h5>
                    <CSVLink data={getCSVData()} filename="derived-datasets-data.csv" className="ic--download">
                         <DownloadOutlined title="Export Data as CSV" style={{ fontSize: '24px' }}/>
                    </CSVLink>
                    <Table rowKey={TABLE.cols.f('id')} dataSource={content} columns={getColumns()} />
                </div>)
                setModalOpen(true)
            }
            }>{content.length}</span></Popover>
        </>
    )
}

ModalOverData.defaultProps = {
    popoverText: 'Click to view all processed datasets.',
    cols: []
}

ModalOverData.propTypes = {
    content: PropTypes.array.isRequired,
    cols: PropTypes.array,
    args: PropTypes.object.isRequired,
    setModalBody: PropTypes.func.isRequired,
    setModalOpen: PropTypes.func.isRequired,
    setModalWidth: PropTypes.func.isRequired,
}

export default ModalOverData