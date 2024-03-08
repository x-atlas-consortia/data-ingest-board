import {ENVS, eq, TABLE} from "../lib/helper";
import {useEffect} from "react";

function Search({ useDatasetApi, callbacks, originalResponse }) {
    let dict = {}

    const $searchInputField = () => document.getElementById('appSearch')

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const query = params.get('q')
        if (query && Object.keys(originalResponse).length) {
            $searchInputField().value = query
            onSearch(null)
        }
    }, [originalResponse])

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
        let val = $searchInputField().value.toLowerCase()
        const entity = useDatasetApi ? 'Datasets' : 'Uploads'
        const cb = `apply${entity}`

        if (!val) {
            callbacks[`${cb}`](originalResponse[entity.toLowerCase()])
            return
        }
        if (originalResponse.datasets) {
            prepareIndices(originalResponse.datasets.data, 'datasets')
        }
        if (originalResponse.uploads) {
            prepareIndices(originalResponse.uploads.data, 'uploads')
        }
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
        const pre = useDatasetApi ? `?` : `&`
        let query = `${pre}q=${val}`
        callbacks.toggleHistory(!useDatasetApi, query)
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