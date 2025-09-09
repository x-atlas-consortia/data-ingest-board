import PropTypes from 'prop-types'
import {Dropdown, Popover, Table} from "antd";
import {formatNum, getHeadersWith, toDateString} from "../lib/helpers/general";
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
import IdLinkDropdown from './IdLinkDropdown';

function ModalOverFiles({count, data, popoverText = 'Click to view file details.'}) {

    const {globusToken, revisionsData} = useContext(AppContext)
    const [modal, setModal] = useState(modalDefault)


    const getColumns = () => {
        if (cols.length) return cols;
        return [
            {
                title: 'File Size',
                width: 170,
                dataIndex: 'bytes_transferred',
                key: 'bytes_transferred',
                sorter: (a,b) => a.bytes_transferred - b.bytes_transferred,
                render: (val, record) => <span>{val}</span>
            },
            {
                title: 'File Size',
                width: 170,
                dataIndex: 'bytes_transferred',
                key: 'bytes_transferred',
                sorter: (a,b) => a.bytes_transferred - b.bytes_transferred,
                render: (val, record) => <span>{val}</span>
            },
           
        ]
    }


    return (
        <>
            <Popover content={popoverText} placement={'left'}><span className='txt-lnk js-gtm--btn-cta-viewFiles' data-gtm-info={data.uuid} onClick={async ()  => {
                setModal({width: 800, cancelCSS: 'none', className: '', body: <Spinner />, open: true})
                const modalBody = (<div>
                    <h5 className='text-center mb-5'>
                        {formatNum(count)} Downloaded File{count > 1 ? 's': ''} for &nbsp; <IdLinkDropdown data={data} />
                    </h5>
                </div>)
                setModal({width: 1000, cancelCSS: 'none', className: '', open: true, body: modalBody})
            }
            }>{formatNum(count)}</span></Popover>
            <AppModal modal={modal} setModal={setModal} />
        </>
    )
}

ModalOverFiles.propTypes = {
    content: PropTypes.array.isRequired,
    cols: PropTypes.array,
    args: PropTypes.object.isRequired
}

export default ModalOverFiles