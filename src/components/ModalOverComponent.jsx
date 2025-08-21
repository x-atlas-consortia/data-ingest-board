import PropTypes from 'prop-types'
import {Popover, Button, Modal} from "antd";
import { EllipsisOutlined } from '@ant-design/icons';
import {useState} from "react";
import AppModal from "@/components/AppModal";
import {modalDefault} from "@/lib/constants";

function ModalOverComponent({children, modalContent}) {
    const [modal, setModal] = useState(modalDefault)

    return (
        <>
            {children}
            <Popover content={'Click to view full content.'} placement={'left'}><div onClick={(e) => {
                e.preventDefault()
                setModal({width: 700, cancelCSS: 'none', className: '', body: modalContent, open: true})
            }
            }>
                <Button type="primary" shape="round" icon={<EllipsisOutlined />} size={'small'}>View all </Button>
            </div></Popover>

            <AppModal modal={modal} setModal={setModal} />
        </>
    )
}

ModalOverComponent.propTypes = {
    children: PropTypes.node,
    displayMax: PropTypes.number,
    setModal: PropTypes.func.isRequired
}

export default ModalOverComponent