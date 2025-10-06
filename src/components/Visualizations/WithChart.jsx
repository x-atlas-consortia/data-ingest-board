import React, {  useEffect, useState } from 'react'
import Legend from "@/components/Visualizations/Legend";
import { Button } from "antd";
import {
    LeftOutlined, 
    RightOutlined,
} from "@ant-design/icons";

function WithChart({ children, legend, data }) {
    const [_, setRefresh] = useState(null)
    const [collapsed, setCollapsed] = useState(true)

    useEffect(() =>{
        setRefresh(new Date().getTime())
    }, [data])

    return (
        <div className='row'>
            <div className='pe-4 col-12 col-md-3' style={{display: collapsed ? 'none' : 'block'}}>
                <Legend legend={legend} sortLegend={false} />
            </div>
            <div className='col-md-1' style={{
                            alignContent: 'center'}}>
                <Button
                        type="text"
                        icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                            color: 'grey',
                        }}
                    />
            </div>
            <div className={`col-12 ${collapsed ? 'col-md-11' : 'col-md-8'}`} style={{overflowX: 'auto', marginBottom: '2em'}}>
                {children}
            </div>
        </div>
    )
}

export default WithChart