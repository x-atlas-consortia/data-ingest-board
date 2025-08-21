import PropTypes from 'prop-types'
import {Dropdown, Popover, Table} from "antd";
import {getHeadersWith, toDateString} from "../lib/helpers/general";
import THEME from "../lib/helpers/theme";
import TABLE from "../lib/helpers/table";
import URLS from "../lib/helpers/urls";
import React, {useContext, useState} from "react";
import axios from "axios";
import AppContext from "../context/AppContext";
import {CaretDownOutlined, DownloadOutlined} from "@ant-design/icons";
import Spinner from "./Spinner";
import AppModal from "@/components/AppModal";
import {modalDefault} from "@/lib/constants";

function ModalOverData({content, cols = [],  popoverText = 'Click to view all processed datasets.', args}) {

    const {globusToken, revisionsData} = useContext(AppContext)
    const [modal, setModal] = useState(modalDefault)

    let usedColors = {}
    let dataIndices = {}
    let revisionsDict = {}
    let colorIndex = 0
    let levelColorIndex = THEME.colors().length - 1
    if (!content.length || !Array.isArray(content)) {
        return <span>0</span>
    }

    const getColumns = () => {
        if (cols.length) return cols;
        return [
            TABLE.reusableColumns(args.urlSortOrder, args.urlParamFilters).id(),
            TABLE.reusableColumns(args.urlSortOrder, args.urlParamFilters).status,
            {
                title: 'Creation Date',
                width: 170,
                dataIndex: 'created_timestamp',
                key: 'created_timestamp',
                sorter: (a,b) => new Date(a.created_timestamp) - new Date(b.created_timestamp),
                render: (date, record) => <span>{(new Date(date).toLocaleString())}</span>
            },
            // {
            //     title: 'Revision',
            //     width: 140,
            //     dataIndex: 'revision_number',
            //     key: 'revision_number',
            //     showSorterTooltip: {
            //         title: <span>Greyed revisions have no associated revisions. All other revisions of the same color belong to the same revision group. Multiple revisions of the same level are marked with the same border color.</span>
            //     },
            //     sorter: (a,b) => a.revision_number - b.revision_number,
            //     render: (revision, record) => {
            //         let style = {backgroundColor: `${record.group_color.color}`, color: record.group_color.light ? 'black': 'white',
            //             border: 'solid 2px transparent', borderColor: record.border_color?.color || 'transparent'}
            //         return <span className='revision-number'
            //                      style={style}>
            //                     {revision ? `Version ${revision}`: ''}
            //                </span>
            //     }
            // }
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
                }
            )
        }
        return results
    }

    const randomColor = () => {
        let col;
        do {
            col = THEME.randomColor()
            if (!usedColors[col.color]) {
                usedColors[col.color] = true;
            }
        } while (!usedColors[col.color])
        return col;
    }

    const getLevelColor = () => {
        let levelColor;
        if (levelColorIndex > -1) {
            let color = THEME.colors()[levelColorIndex]
            let light = levelColorIndex < THEME.lightColors().length
            levelColor = {color, light}
            levelColorIndex--;
        } else {
            levelColor = randomColor()
        }
        return levelColor;
    }

    const getGroupColor = (fromRandom = false) => {
        let groupColor;
        if (colorIndex < THEME.colors().length && !fromRandom) {
            let color = THEME.colors()[colorIndex]
            let light = colorIndex < THEME.lightColors().length
            groupColor = {color, light}
            colorIndex++;
        } else {
            groupColor = randomColor()
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
            let levelColor = getLevelColor()
            for (let m of r.uuids) {
                if (!revisionsDict[m]) {
                    revisionsDict[m] = r.revision_number
                    content[dataIndices[m]]['revision_number'] = r.revision_number
                    content[dataIndices[m]]['group_color'] = groupColor
                    if (r.uuids.length > 1) {
                        content[dataIndices[m]]['border_color'] = levelColor
                    }
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
            <Popover content={popoverText} placement={'left'}><span className='txt-lnk js-gtm--btn-cta-viewProcessed' data-gtm-info={args.record.uuid} onClick={async ()  => {
                setModal({width: 800, cancelCSS: 'none', className: '', body: <Spinner />, open: true})
                buildIndices()
                // await handleRevisions()

                const modalBody = (<div>
                    <h5 className='text-center mb-5'>
                        {content.length} Processed Dataset{content.length > 1 ? 's': ''} for &nbsp;
                        <Dropdown menu={{items: TABLE.renderDropdownContent(args.record)}} trigger={['click']}>
                            <span className={'txt-lnk'}>{args.record[TABLE.cols.f('id')]}<CaretDownOutlined style={{verticalAlign: 'middle'}} /></span>
                        </Dropdown>
                    </h5>
                    <a onClick={()=>TABLE.generateCSVFile(getCSVData(), 'processed-datasets-data.csv')} data-gtm-info={args.record.uuid} className="ic--download js-gtm--btn-cta-csvDownloadProcessed">
                         <DownloadOutlined title="Export Data as CSV" style={{ fontSize: '24px' }}/>
                    </a>
                    <Table className='c-table--pDatasets' rowKey={TABLE.cols.f('id')} dataSource={content} columns={getColumns()} />
                </div>)
                setModal({width: 1000, cancelCSS: 'none', className: '', open: true, body: modalBody})
            }
            }>{content.length}</span></Popover>
            <AppModal modal={modal} setModal={setModal} />
        </>
    )
}

ModalOverData.propTypes = {
    content: PropTypes.array.isRequired,
    cols: PropTypes.array,
    args: PropTypes.object.isRequired
}

export default ModalOverData