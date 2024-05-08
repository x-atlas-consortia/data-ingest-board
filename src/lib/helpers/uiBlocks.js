import React from "react";
import { Button, Form, Input, Select } from 'antd';
import {CheckCircleOutlined, IssuesCloseOutlined} from "@ant-design/icons";
import {eq} from "./general";

const UI_BLOCKS = {
    modalResponse: {
      styling: (res) => {
          let className = 'alert alert-success'
          const isOk =  ['202', '200'].comprises(res.status.toString())
          if (!isOk) {
              className = 'alert alert-danger'
          }
          const preTitle = isOk ? 'SUCCESS' : 'FAIL'
          return {isOk, className, preTitle}
      },
      body: (res, mainTitle) => {
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
                  <div style={{maxHeight: '200px', overflowY: 'auto'}}><code>{eq(typeof res.data, 'object') ? JSON.stringify(res.data) : res.data.toString()}</code></div>
              </div>

          </div>)

          return {modalBody}
      }
    }
}

export default UI_BLOCKS