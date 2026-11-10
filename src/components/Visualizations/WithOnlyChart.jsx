import React, { memo } from 'react'

const WithOnlyChart = memo(({ children }) => {
  
    return (
        <div className='row'>
            <div className='col-12' style={{overflowX: 'auto', marginBottom: '2em'}}>
                {children}
            </div>
        </div>
    )
})

export default WithOnlyChart