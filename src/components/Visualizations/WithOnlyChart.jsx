import React, {  useEffect, useState, memo } from 'react'
import Legend from "@/components/Visualizations/Legend";
import { Button } from "antd";
import {
    LeftOutlined, 
    RightOutlined,
} from "@ant-design/icons";

const WithOnlyChart = memo(({ children, legend, data }) => {
  

    return (
        <div className='row'>
            
            <div className='col-12' style={{overflowX: 'auto', marginBottom: '2em'}}>
                {children}
            </div>
        </div>
    )
})

export default WithOnlyChart