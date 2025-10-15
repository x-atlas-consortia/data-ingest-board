import React, {  useEffect, useState } from 'react'
import Legend from "@/components/Visualizations/Legend";

function WithChart({ children, legend, data }) {
    const [_, setRefresh] = useState(null)

    useEffect(() =>{
        setRefresh(new Date().getTime())
    }, [data])

    return (
        <div className='row p-4 p-lg-0'>
            <div className={'col-12 text-center'} style={{overflowX: 'auto', marginBottom: '2em'}}>
                {children}
            </div>
            <div class='c-legendWrap c-legendWrap--flex'><Legend legend={legend} sortLegend={false} /></div>
        </div>
    )
}

export default WithChart