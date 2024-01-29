import PropTypes from 'prop-types'
import {Popover} from "antd";
import {ENVS} from "../lib/helper";

function ModalOver({content, displayMax, setModalBody, setModalOpen}) {
    if (content.length < displayMax) {
        return <span>{content}</span>
    }

    return (
        <>
            <Popover content={'Click to view full task content.'} placement={'left'}><span onClick={() => {
                setModalBody(content)
                setModalOpen(true)
            }
            }>{`${content.substring(0, displayMax)}...`}</span></Popover>
        </>
    )
}

ModalOver.defaultProps = {
    displayMax: ENVS.modalColMax()
}

ModalOver.propTypes = {
    content: PropTypes.string.isRequired,
    displayMax: PropTypes.number,
    setModalBody: PropTypes.func.isRequired,
    setModalOpen: PropTypes.func.isRequired
}

export default ModalOver