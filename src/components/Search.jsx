import {ENVS, eq, TABLE} from "../service/helper";

function Search({ useDatasetApi, callbacks, originalResponse }) {
    let dict = {}

    const prepareIndices = (data, entity) => {
        if (dict[entity]) return
        const keysToIndex = ENVS.searchIndices(entity)
        dict[entity] = {}
        for (let d of data) {
            for (let k of keysToIndex) {
                dict[entity][`${d[TABLE.cols.f('id')]}.${d[k]}`] = d
            }
        }
    }

    const onSearch = (e) => {
        let val = document.getElementById('appSearch').value.toLowerCase()
        const entity = useDatasetApi ? 'Datasets' : 'Uploads'
        const cb = `apply${entity}`

        if (!val) {
            callbacks[`${cb}`](originalResponse[entity.toLowerCase()])
            return
        }
        prepareIndices(originalResponse.datasets.data, 'datasets')
        prepareIndices(originalResponse.uploads.data, 'uploads')
        let found = {}
        let results = []
        let data = dict[entity.toLowerCase()]
        for (let k in data) {
            let idKey = data[k][TABLE.cols.f('id')]
            if (k.toLowerCase().includes(val) && found[idKey] === undefined) {
                results.push(data[k])
                found[idKey] = true
            }
        }
        callbacks[`${cb}`]({data: results})
    }

    return (
        <div className={`c-search`}>
            <div className='col col-lg-10 col-md-6'><input id='appSearch' className='form-control form-control-lg rounded-0' name={'search'} onKeyDown={(e) => {
                if (eq(e.key, 'Enter')) {
                    onSearch(e)
                }
            }} /></div>
            <div className='col col-lg-2 col-md-6'><button className={'c-btn c-btn--outline'} type={'submit'} onClick={(e) => onSearch(e)}>Search</button></div>
        </div>
    )
}

export default Search