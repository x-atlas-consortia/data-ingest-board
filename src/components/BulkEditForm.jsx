import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Form, Input, Select, Checkbox} from "antd";
import AppContext from "../context/AppContext";

function BulkEditForm({statuses, writeGroups, setBulkEditValues, entityName = 'datasets'}) {
    const {selectedEntities} = useContext(AppContext)
    const [bulkEditForm] = Form.useForm()
    const [values, setValues] = useState({})
    const [resetValues, setResetValues] = useState({assigned_to_group_name_clear: false, ingest_task_clear: false})
    const [statusOptions, setStatusOptions] = useState([])

    const buildStatusOptions = () => {
        let options = []
        const selectedEntitiesStatuses = selectedEntities.map((e) => e.status)
        let notToIncludeStatues = selectedEntitiesStatuses.concat(['unpublished', 'published'])
        for (let s of statuses) {
            if (!notToIncludeStatues.comprises(s.value)) {
                options.push(<Select.Option key={`status__${s.value}`} value={s.value}>{s.text}</Select.Option>)
            }
        }
        setStatusOptions(options)
    }
    useEffect(() => {
        buildStatusOptions()
    }, [selectedEntities])

    const updateResetField = (field, checked) => {
        const resetField = `${field}_clear`
        setResetValues({...resetValues, [resetField]: checked})
    }
    const updateBulk = (field, value) => {
        const update = {...values, [field]: value}

        if (value !== '' && value !== undefined) {
            updateResetField(field, false)
        }
        setValues(update)
        setBulkEditValues(update)
    }
    const ingestTask = Form.useWatch((values) => {
        updateBulk('ingest_task', values.ingest_task)
    }, bulkEditForm)

    let groupOptions = []
    for (let w of writeGroups) {
        groupOptions.push(<Select.Option key={`assigned_to_group_name__${w.uuid}`} value={w.displayname}>{w.displayname}</Select.Option>)
    }
    const handleOptionsChange = (value, e) => {
        if (e.key) {
            const field = e.key.split('__')[0]
            updateBulk(field, value)
        }
    }

    const handleResetChecked = (field) => {
        bulkEditForm.setFieldValue(field, null)
        updateResetField(field, true)
        updateBulk(field, "")
    }

    return (
        <>
            <Form form={bulkEditForm} name="validateOnly" layout="vertical" autoComplete="off">
                <Form.Item name="assigned_to_group_name" label="Assigned To Group Name" className={'mb-0'}>
                    <Select
                        placeholder="Select a group to assign the task to"
                        allowClear
                        onChange={handleOptionsChange}
                    >
                        {groupOptions}
                    </Select>
                </Form.Item>
                <Checkbox checked={resetValues.assigned_to_group_name_clear} name="assigned_to_group_name_clear" onChange={()=>handleResetChecked('assigned_to_group_name')}>
                    Clear assigned to group name values on selected {entityName}
                </Checkbox>


                <Form.Item name="ingest_task" label="Ingest Task" className={'mt-3 mb-0'}>
                    <Input />
                </Form.Item>
                <Checkbox checked={resetValues.ingest_task_clear} onChange={()=>handleResetChecked('ingest_task')}>
                    Clear ingest task values on selected {entityName}
                </Checkbox>

                <Form.Item name="status" label="Status" className={'mt-3'}>
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