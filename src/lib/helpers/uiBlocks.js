import React from "react";
import {Table} from 'antd';
import {CheckCircleOutlined, IssuesCloseOutlined} from "@ant-design/icons";
import {eq} from "./general";
import TABLE from "./table";

const UI_BLOCKS = {
    modalResponse: {
      styling: (res) => {
          let className = 'alert alert-success'
          const statusTxt = `${res.status}`
          const isOk =  ['202', '200'].comprises(statusTxt)
          if (!isOk) {
              className = 'alert alert-danger'
          }
          const preTitle = isOk ? (eq(statusTxt, '200') ? 'SUCCESS' : 'ACCEPTED') : 'FAIL'
          return {isOk, className, preTitle}
      },
      body: (res, mainTitle, otherDetails) => {
          let {className, isOk, preTitle} = UI_BLOCKS.modalResponse.styling(res)
          const modalBody = (<div>
              <center>
                  <h5>
                      {isOk && <CheckCircleOutlined style={{color: '#52c41a'}} />}
                      {!isOk && <IssuesCloseOutlined style={{color: 'red'}} />} {preTitle}: {mainTitle}
                  </h5>
              </center>
              <div>
                  <p className={'mt-4'}>RESPONSE:</p>
                  <div style={{maxHeight: '200px', overflowY: 'auto'}}><code>{eq(typeof res.data, 'object') ? JSON.stringify(res.data) : `${res.data}`}</code></div>
                  {otherDetails && <div>{otherDetails}</div>}
              </div>

          </div>)

          return {modalBody}
      }
    },
    modalConfirm: {
        showConfirmModalOfSelectedEntities: ({callback, afterTableComponent, columns, selectedEntities, setModal, entityName = 'Datasets', title = ''}) => {
            const modalBody = (<div>
                <h5 className='text-center mb-5' data-gtm-info={title.toDashedCase()}>Confirm selection {title}</h5>
                <p>{selectedEntities.length} {entityName} selected</p>
                <Table className='c-table--pDatasets' rowKey={TABLE.cols.f('id')} dataSource={selectedEntities} columns={columns} />
                {afterTableComponent}
            </div>)

            setModal({key: 'bulkInitiateModal', okText: 'Submit', okCallback: callback,
                width: 1000, className: '', cancelCSS: 'initial', open: true, body:  modalBody, okButtonProps: {disabled: selectedEntities.length <= 0}})
        }
    }
}

export default UI_BLOCKS