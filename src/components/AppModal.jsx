
import { Modal} from "antd";

function AppModal({modal, setModal, handleModalOk, id}) {

    const closeModal = () => {
        setModal({...modal, okText: 'OK', open: false})
    }

    return (
        <Modal
            id={id}
            className={modal.className}
            width={modal.width}
            cancelButtonProps={{ style: { display: modal.cancelCSS } }}
            closable={false}
            open={modal.open}
            okText={modal.okText}
            onCancel={closeModal}
            onOk={handleModalOk || closeModal}
            okButtonProps={modal.okButtonProps}
        >
            {modal.body}
        </Modal>
    )
}


export default AppModal