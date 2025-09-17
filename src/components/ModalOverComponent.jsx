import PropTypes from 'prop-types'
import {Popover, Button} from "antd";
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
                <Button className='ant-btn-more' type="primary" shape="round" icon={<EllipsisOutlined style={{fontSize: '24px'}} />} size={'small'}>View all </Button>
            </div></Popover>

            <AppModal modal={modal} setModal={setModal} />
        </>
    )
}

ModalOverComponent.propTypes = {
    children: PropTypes.node,
    displayMax: PropTypes.number
}

export default ModalOverComponent