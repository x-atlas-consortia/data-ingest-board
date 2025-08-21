import PropTypes from 'prop-types'
import URLS from "@/lib/helpers/urls";
import TABLE from "@/lib/helpers/table";
import {ExportOutlined} from "@ant-design/icons";

function IdLink({data}) {
    return (
        <a className='text-decoration-none' target={'_blank'} href={URLS.ingest.view(data.uuid)}>{data[TABLE.cols.f('id')]} <ExportOutlined style={{verticalAlign: 'middle', fontSize: '14px'}}/></a>
    )
}

IdLink.propTypes = {
    data: PropTypes.object.isRequired
}

export default IdLink