import React, {  useEffect, useState } from 'react'
import Legend from "@/components/Visualizations/Legend";

function WithChart({ children, legend, data }) {
    const [_, setRefresh] = useState(null)

    useEffect(() =>{
        setRefresh(new Date().getTime())
    }, [data])

    return (
        <div className='row'>
            <div className='pe-4 col-12 col-md-3'>
                <Legend legend={legend} sortLegend={false} />
            </div>
            <div className='col-12 col-md-9' style={{overflowX: 'auto'}}>
                {children}
            </div>
        </div>
    )
}

export default WithChart