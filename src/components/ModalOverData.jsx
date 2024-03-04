import PropTypes from 'prop-types'
import {Dropdown, Popover, Table} from "antd";
import {ENVS, getHeadersWith, TABLE, THEME, toDateString, URLS} from "../lib/helper";
import React, {useContext} from "react";
import axios from "axios";
import AppContext from "../context/AppContext";
import {CSVLink} from "react-csv";
import {CaretDownOutlined, DownloadOutlined} from "@ant-design/icons";
import Spinner from "./Spinner";

function ModalOverData({content, cols, setModalBody, setModalOpen, setModalWidth, popoverText, args}) {

    const {globusToken, revisionsData} = useContext(AppContext)
    let usedColors = {}
    let dataIndices = {}
    let revisionsDict = {}
    let colorIndex = 0
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
                width: 170,
                dataIndex: 'created_timestamp',
                key: 'created_timestamp',
                sorter: (a,b) => new Date(a.created_timestamp) - new Date(b.created_timestamp),
                render: (date, record) => <span>{(new Date(date).toLocaleString())}</span>
            },
            {
                title: 'Revision',
                width: 140,
                dataIndex: 'revision_number',
                key: 'revision_number',
                showSorterTooltip: {
                    title: <span>Greyed revisions have no associated revisions. All other revisions of the same color belong to the same revision group.</span>
                },
                sorter: (a,b) => a.revision_number - b.revision_number,
                render: (revision, record) => {
                    let style = {backgroundColor: `${record.group_color.color}`, color: record.group_color.light ? 'black': 'white'}
                    return <span className='revision-number'
                                 style={style}>
                                {revision ? `Version ${revision}`: ''}
                           </span>
                }
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

    const getGroupColor = () => {
        let groupColor;
        if (colorIndex < THEME.colors().length) {
            let color = THEME.colors()[colorIndex]
            let light = colorIndex < THEME.lightColors().length
            groupColor = {color, light}
            colorIndex++;
        } else {
            do {
                groupColor = THEME.randomColor()
                if (!usedColors[groupColor.color]) {
                    usedColors[groupColor.color] = true;
                }
            } while (!usedColors[groupColor.color])
        }
        return groupColor;
    }

    const buildIndices = () => {
        for (let i = 0; i < content.length; i++) {
            dataIndices[content[i].uuid] = i;
        }
    }

    const getRevisions = async (record) => {

        let groupColor;
        let res = revisionsData.current[record.uuid]
        let revisions = res
        if (res === undefined) {
            res = await axios.get(
                URLS.entity.revisions(record.uuid),
                getHeadersWith(globusToken)
            )
            revisionsData.current[record.uuid] = res.data
            revisions = res.data
        }

        if (revisions.length === 1 && revisions[0].uuids.length === 1) {
            groupColor = {color: '#797b80', light: false}
        } else {
            groupColor = getGroupColor()
        }

        for (let r of revisions) {
            for (let m of r.uuids) {
                if (!revisionsDict[m]) {
                    revisionsDict[m] = r.revision_number
                    content[dataIndices[m]]['revision_number'] = r.revision_number
                    content[dataIndices[m]]['group_color'] = groupColor
                }
            }
        }
    }

    const handleRevisions = async () => {
        for (let i = 0; i < content.length; i++) {
            await getRevisions(content[i])
        }
    }

    return (
        <>
            <Popover content={popoverText} placement={'left'}><span className='txt-lnk' onClick={async ()  => {
                setModalWidth(800)
                setModalBody(<Spinner />)
                setModalOpen(true)
                buildIndices()
                await handleRevisions()
                setModalBody(<div>
                    <h5 className='text-center mb-5'>
                        {content.length} Processed Dataset{content.length > 1 ? 's': ''} for &nbsp;
                        <Dropdown menu={{items: TABLE.renderDropdownContent(args.record)}} trigger={['click']}>
                            <span className={'txt-lnk'}>{args.record[TABLE.cols.f('id')]}<CaretDownOutlined style={{verticalAlign: 'middle'}} /></span>
                        </Dropdown>
                    </h5>
                    <CSVLink data={getCSVData()} filename="derived-datasets-data.csv" className="ic--download">
                         <DownloadOutlined title="Export Data as CSV" style={{ fontSize: '24px' }}/>
                    </CSVLink>
                    <Table className='c-table--pDatasets' rowKey={TABLE.cols.f('id')} dataSource={content} columns={getColumns()} />
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