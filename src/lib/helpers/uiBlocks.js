import React from "react";
import { Button, Form, Input, Select } from 'antd';

const UI_BLOCKS = {
    getBulkEditForm: ({statuses, writeGroups, bulkEditValues, setBulkEditValues}) =>{
        let statusOptions = []
        for (let s of statuses) {
            statusOptions.push(<Option key={s.value} value={s.value}>{s.text}</Option>)
        }
        let groupOptions = []
        for (let w of writeGroups) {
            groupOptions.push(<Option key={w.uuid} value={w.uuid}>{w.displayname}</Option>)
        }
        return (
            <>
                <Form name="validateOnly" layout="vertical" autoComplete="off">
                    <Form.Item name="assigned_to_group_name" label="Assigned To Group Name">
                        <Select
                            allowClear
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
                            allowClear
                        >
                            {statusOptions}
                        </Select>
                    </Form.Item>
                </Form>
            </>
        )
    }
}

export default UI_BLOCKS