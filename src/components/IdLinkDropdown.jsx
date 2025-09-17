import {Dropdown} from "antd";
import PropTypes from 'prop-types'
import TABLE from "@/lib/helpers/table";
import {CaretDownOutlined} from "@ant-design/icons";

function IdLinkDropdown({data}) {
    return (
        <Dropdown menu={{items: TABLE.renderDropdownContent(data)}} trigger={['click']}>
            <span className={'txt-lnk'}>{data[TABLE.cols.f('id')]}<CaretDownOutlined style={{verticalAlign: 'middle'}} /></span>
        </Dropdown>
    )
}

IdLinkDropdown.propTypes = {
    data: PropTypes.object.isRequired
}

export default IdLinkDropdown