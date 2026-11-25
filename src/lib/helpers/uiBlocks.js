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
            const isOk = ['202', '200'].comprises(statusTxt)
            if (!isOk) {
                className = 'alert alert-danger'
            }
            const preTitle = isOk
                ? eq(statusTxt, '200')
                    ? 'SUCCESS'
                    : 'ACCEPTED'
                : 'FAIL'
            return { isOk, className, preTitle }
        },
        body: (res, mainTitle, otherDetails) => {
            let { className, isOk, preTitle } =
                UI_BLOCKS.modalResponse.styling(res)
            const modalBody = (
                <div>
                    <center>
                        <h5>
                            {isOk && (
                                <CheckCircleOutlined
                                    style={{ color: '#52c41a' }}
                                />
                            )}
                            {!isOk && (
                                <IssuesCloseOutlined style={{ color: 'red' }} />
                            )}{' '}
                            {preTitle}: {mainTitle}
                        </h5>
                    </center>
                    <div>
                        <p className={'mt-4'}>RESPONSE:</p>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <code>
                                {eq(typeof res.data, 'object')
                                    ? JSON.stringify(res.data)
                                    : `${res.data}`}
                            </code>
                        </div>
                        {otherDetails && <div>{otherDetails}</div>}
                    </div>
                </div>
            )

            return { modalBody }
        }
    },
    modalConfirm: {
        showConfirmModalOfSelectedEntities: ({
            callback,
            afterTableComponent,
            columns,
            selectedEntities,
            setModal,
            entityName = 'Datasets',
            title = ''
        }) => {
            const modalBody = (
                <div>
                    <h5 className='text-center mb-5'>
                        Confirm selection {title}
                    </h5>
                    <p>
                        {selectedEntities.length} {entityName} selected
                    </p>
                    <Table
                        className='c-table--pDatasets'
                        rowKey={TABLE.cols.f('id')}
                        dataSource={selectedEntities}
                        columns={columns}
                    />
                    {afterTableComponent}
                </div>
            )

            setModal({
                key: 'bulkInitiateModal',
                okText: 'Submit',
                okCallback: callback,
                width: 1000,
                className: '',
                cancelCSS: 'initial',
                open: true,
                body: modalBody,
                okButtonProps: { disabled: selectedEntities.length <= 0 }
            })
        }
    },
    visualizations: {
        onBuildToolTip: (
            id,
            e,
            d,
            { subGroupLabels, row, formatter, title }
        ) => {
            const colors = e.colors

            if (!e.stacked) {
                return `<div class="c-visualizations__tooltipWrap">
                <span class="text-muted">${title}</span>
                <br> 
                <span>
                    <span class="c-visualizations__itemCol" style="background-color: ${colors[d.key].color};"></span>
                    <span>${subGroupLabels[d.key] || d.key}</span> <strong>${formatter(d.data[d.key])}</strong>
                </span>
            </div>`
            }

            let total = 0
            if (!row) return null
            return `<div class="c-visualizations__tooltipWrap">
                <span class="text-muted">${title}</span>
                <br>${Object.values(colors)
                    .map(({ color, label, key, value }) => {
                        total += row[key] || 0
                        return `<span><span class="c-visualizations__itemCol" style="background-color: ${color};"></span>
                        ${label}: <strong>${formatter(row[key])}</strong></span>`
                    })
                    .join('<br>')}
                    <br>Total: <strong>${formatter(total)}</strong>
                </div>`
        }
    }
}

export default UI_BLOCKS