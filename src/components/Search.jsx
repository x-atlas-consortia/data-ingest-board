import {ENVS, eq, TABLE} from "../service/helper";

function Search({ uploads, datasets, useDatasetApi, callbacks }) {
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
        prepareIndices(datasets, 'datasets')
        prepareIndices(uploads, 'uploads')
        let found = {}
        let results = []
        let data = useDatasetApi ? dict.datasets : dict.upload
        for (let k in data) {
            let idKey = data[k][TABLE.cols.f('id')]
            let val = document.getElementById('appSearch').value.toLowerCase()
            if (k.toLowerCase().includes(val) && found[idKey] === undefined) {
                results.push(data[k])
                found[idKey] = true
            }
        }
        if (useDatasetApi) {
            callbacks.applyDatasets({data: results})
        } else {
            callbacks.applyUploads({data: results})
        }
    }

    return (
        <div className={`c-search container`}>
            <div className={'row'}>
                <div className='col-lg-10'><input id='appSearch' className='form-control form-control-lg rounded-0' name={'search'} onKeyDown={(e) => {
                    if (eq(e.key, 'Enter')) {
                        onSearch(e)
                    }
                }} /></div>
                <div className='col-lg-2'><button className={'c-btn c-btn--outline'} type={'submit'} onClick={(e) => onSearch(e)}>Search</button></div>
            </div>
        </div>
    )
}

export default Search