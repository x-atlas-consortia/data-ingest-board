import {useEffect} from 'react'
import PropTypes from 'prop-types'

function Legend({legend, setLegend}) {
    useEffect(() => {
    }, [])

    const buildLegend = () => {
        let res = []
        let _legend = Object.values(legend)
        _legend.sort((a, b) => a.label.localeCompare(b.label))
        for (let l of _legend) {
            res.push(
                <li className='c-legend__item' key={l.label}>
                    <span className={'c-legend__item__col mx-2'} style={{backgroundColor: l.color}}></span>
                    <span><span className='c-legend__item__label'>{l.label}</span> ({l.value})</span>
                </li>
            )
        }
        return res
    }

    return (
        <div className={`c-legend my-4`}>
            <h5>Legend</h5>
            <ul>
                {buildLegend()}
            </ul>
        </div>
    )
}

Legend.propTypes = {
    children: PropTypes.node
}

export default Legend