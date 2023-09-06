import {Spin, Space} from "antd";
import React from "react";

const Spinner = () => {
    return (
        <div className="c-spinner">
            <Space direction="vertical" style={{ width: '100%'}}>
                <Spin size="large" tip="Loading...this may take a minute or two.">
                    <span></span>
                </Spin>
            </Space>
        </div>
    )
}
export default Spinner