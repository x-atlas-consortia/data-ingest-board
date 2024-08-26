import PropTypes from 'prop-types'
import {Popover} from "antd";

function ModalOver({content, displayMax = 24, modal, setModal}) {
    if (content.length < displayMax) {
        return <span>{content}</span>
    }

    return (
        <>
            <Popover content={'Click to view full task content.'} placement={'left'}><span onClick={() => {
                setModal({width: 700, cancelCSS: 'none', className: '', body: content, open: true})
            }
            }>{content}</span></Popover>
        </>
    )
}

ModalOver.propTypes = {
    content: PropTypes.string.isRequired,
    displayMax: PropTypes.number,
    setModal: PropTypes.func.isRequired
}

export default ModalOver