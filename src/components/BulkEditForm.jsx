import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Form, Input, Select} from "antd";

function BulkEditForm({statuses, writeGroups, setBulkEditValues}) {
    const [bulkEditForm] = Form.useForm()
    const updateBulk = (field, value) => {
        const update = {...values, [field]: value}
        setValues(update)
        setBulkEditValues(update)
        console.log(field, value)
    }
    const ingestTask = Form.useWatch((values) => {
        updateBulk('ingest_task', values.ingest_task)
    }, bulkEditForm)

    const [values, setValues] = useState({})

    let statusOptions = []
    for (let s of statuses) {
        statusOptions.push(<Select.Option key={`status__${s.value}`} value={s.value}>{s.text}</Select.Option>)
    }
    let groupOptions = []
    for (let w of writeGroups) {
        groupOptions.push(<Select.Option key={`assigned_to_group_name__${w.uuid}`} value={w.displayname}>{w.displayname}</Select.Option>)
    }
    const handleOptionsChange = (value, e) => {
        const field = e.key.split('__')[0]
        updateBulk(field, value)
    }

    return (
        <>
            <Form form={bulkEditForm} name="validateOnly" layout="vertical" autoComplete="off">
                <Form.Item name="assigned_to_group_name" label="Assigned To Group Name">
                    <Select
                        placeholder="Select a group to assign the task to"
                        allowClear
                        onChange={handleOptionsChange}
                    >
                        {groupOptions}
                    </Select>
                </Form.Item>
                <Form.Item name="ingest_task" label="Ingest Task">
                    <Input />
                </Form.Item>
                <Form.Item name="status" label="Status">
                    <Select
                        placeholder="Select a new dataset status"
                        onChange={handleOptionsChange}
                        allowClear
                    >
                        {statusOptions}
                    </Select>
                </Form.Item>
            </Form>
        </>
    )
}

BulkEditForm.defaultProps = {}

BulkEditForm.propTypes = {
    children: PropTypes.node
}

export default BulkEditForm