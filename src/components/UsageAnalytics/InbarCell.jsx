const InbarCell = ({ text, value }) => {
    return (
        <span className='c-inbar'>
            <span className='js-inbar c-inbar__fill' data-value={value || text}></span>
            <span className='c-inbar__text'> {text}</span>
        </span>
    )
}

export default InbarCell