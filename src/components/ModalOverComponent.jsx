import PropTypes from 'prop-types'
import {Popover} from "antd";

function ModalOverComponent({children, cond = true, setModal}) {
    if (!cond) {
        return <div>{children}</div>
    }

    return (
        <>
            <Popover content={'Click to view full content.'} placement={'left'}><div onClick={() => {
                setModal({width: 700, cancelCSS: 'none', className: '', body: content, open: true})
            }
            }>{children}</div></Popover>
        </>
    )
}

ModalOverComponent.propTypes = {
    children: PropTypes.node,
    displayMax: PropTypes.number,
    setModal: PropTypes.func.isRequired
}

export default ModalOverComponent