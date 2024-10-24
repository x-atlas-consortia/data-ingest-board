import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';

function Legend({legend, setLegend, selectedValues = [], onItemClick}) {
    const handleItemClick = (label) => {
        if (onItemClick) {
            onItemClick(label)
        }
    }

    const buildLegend = () => {
        let res = []
        let _legend = Object.values(legend)
        _legend.sort((a, b) => b.value - a.value)
        for (let l of _legend) {
            let className = 'c-legend__item'
            if (selectedValues.includes(l.label)) {
                className += ' c-legend__item__selected'
            }
            res.push(
                <li onClick={() => handleItemClick(l.label)} className={className} key={l.label}>
                    <span className='c-legend__item__col' style={{backgroundColor: l.color}}></span>
                    <span className='c-legend__item__label'>{l.label}</span>
                    <span className='c-legend__item__value'>({l.value})</span>
                </li>
            )
        }
        return res
    }

    return (
        <div className='c-legend mb-4'>
            <div className='c-legend__title'>
                <h5>Legend</h5>
                <Tooltip title='Click a legend item or graph section to filter results'>
                    <InfoCircleOutlined role='button' style={{ color: 'var(--bs-link-color)' }} />
                </Tooltip>
            </div>
            <ul className='c-legend__list'>
                {buildLegend()}
            </ul>
        </div>
    )
}

Legend.propTypes = {
    children: PropTypes.node
}

export default Legend
