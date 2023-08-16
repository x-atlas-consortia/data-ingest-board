import {Spin} from "antd";
import React from "react";

const Spinner = () => {
    return (
        <div className="c-spinner">
            <Spin size="large" tip="Loading...this may take a minute or two." />
        </div>
    )
}
export default Spinner