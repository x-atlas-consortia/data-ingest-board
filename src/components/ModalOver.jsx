import PropTypes from 'prop-types'
import {Popover} from "antd";
import {useState} from "react";
import AppModal from "@/components/AppModal";
import {modalDefault} from "@/lib/constants";

function ModalOver({content, displayMax = 24}) {
    const [modal, setModal] = useState(modalDefault)

    if (content?.length < displayMax) {
        return <span>{content}</span>
    }

    return (
        <>
            <Popover content={'Click to view full content.'} placement={'left'}><span onClick={() => {
                setModal({width: 700, cancelCSS: 'none', className: '', body: content, open: true})
            }
            }>{content}</span></Popover>
            <AppModal modal={modal} setModal={setModal} />
        </>
    )
}

ModalOver.propTypes = {
    content: PropTypes.string.isRequired,
    displayMax: PropTypes.number
}

export default ModalOver