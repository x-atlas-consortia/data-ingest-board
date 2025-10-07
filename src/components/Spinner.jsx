import {Spin, Space} from "antd";
import React from "react";

const Spinner = ({tip = 'Loading...this may take a minute or two.', size = 'large'}) => {
    return (
        <div className="c-spinner">
            <Space direction="vertical" style={{ width: '100%'}}>
                <Spin size={size} tip={tip}>
                    <span></span>
                </Spin>
            </Space>
        </div>
    )
}
export default Spinner