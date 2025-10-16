import React, {useState} from 'react'
import {Tooltip} from 'antd'

function AppTooltip({children, title}) {
  const [open, setOpen] = useState(false)
  const handleOpen = () => {
    setOpen(true)
    setTimeout(() => {
      setOpen(false)
    }, 700)
  }
  return (
    <Tooltip title={title} open={open}><span onClick={handleOpen}>{children}</span></Tooltip>
  )
}

export default AppTooltip