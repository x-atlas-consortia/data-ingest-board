import PropTypes from 'prop-types'
import {Popover} from "antd";

function ModalOver({content, displayMax, setModalBody, setModalOpen, setModalWidth, setModalCancelCSS, setModalClassName}) {
    if (content.length < displayMax) {
        return <span>{content}</span>
    }

    return (
        <>
            <Popover content={'Click to view full task content.'} placement={'left'}><span onClick={() => {
                if (setModalWidth) {
                    setModalWidth(700)
                }
                if (setModalCancelCSS) {
                    setModalCancelCSS('none')
                }

                if (setModalClassName) {
                    setModalClassName('')
                }
                setModalBody(content)
                setModalOpen(true)
            }
            }>{content}</span></Popover>
        </>
    )
}

ModalOver.defaultProps = {
    displayMax: 24
}

ModalOver.propTypes = {
    content: PropTypes.string.isRequired,
    displayMax: PropTypes.number,
    setModalBody: PropTypes.func.isRequired,
    setModalOpen: PropTypes.func.isRequired,
    setModalWidth: PropTypes.func.isRequired
}

export default ModalOver