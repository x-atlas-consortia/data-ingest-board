const InbarCell = ({ text, value, style, category = 'c1' }) => {
    return (
        <span className='c-inbar'>
            <span className='js-inbar c-inbar__fill' data-cat={category} data-value={value || text} style={style}></span>
            <span className='c-inbar__text'> {text}</span>
        </span>
    )
}

export default InbarCell