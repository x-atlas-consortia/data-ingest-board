import React, {useState, useEffect, useContext, useRef} from "react";
import axios from "axios";
import UploadTable from "./UploadTable";
import DatasetTable from "./DatasetTable";
import {deleteFromLocalStorage, eq, getHeadersWith, storageKey} from "@/lib/helpers/general";
import Search from "../Search";
import AppBanner from "../AppBanner";
import ENVS from "../../lib/helpers/envs";
import URLS from "../../lib/helpers/urls";
import TABLE from "../../lib/helpers/table";
import AppContext from "../../context/AppContext";
import Spinner from "../Spinner";
import {Alert} from "react-bootstrap";
import {MailOutlined} from "@ant-design/icons";
import {Spin} from "antd";
import RouterContext from "@/context/RouterContext";

const DataTable = () => {
    const {setSelectUploadId, selectUploadId, setUseDatasetApi, useDatasetApi, setFilters, setSortField, setSortOrder, setPage, setPageSize} = useContext(RouterContext)
    const {globusToken, setSelectedEntities, t} = useContext(AppContext)

    const [originalResponse, setOriginalResponse] = useState({})
    const [uploadData, setUploadData] = useState([])
    const [primaryData, setPrimaryData] = useState([])
    const [originalPrimaryData, setOriginalPrimaryData] = useState([])
    const [loading, setLoading] = useState(true);
    const [isCachingDatasets, setIsCachingDatasets] = useState(false)
    const [isCachingUploads, setIsCachingUploads] = useState(false)
    const [invalidUploadId, setInvalidUploadId] = useState(false)
    const [tableKey, setTableKey] = useState('initialKey')

    const cachingTimeout = useRef(null)

    const filterUploads = (uploadResponse, datasetResponse, uploadId) => {
        if (typeof uploadId !== 'undefined') {
            const matchingUpload = uploadResponse.find(upload => upload.uuid === uploadId || upload[TABLE.cols.f('id')] === uploadId);
            setSelectUploadId(uploadId)
            if (typeof matchingUpload !== 'undefined') {
                const datasetsInUpload = matchingUpload.datasets
                const listOfDatasets = datasetsInUpload.split(',').map(item => item.trim())
                const filteredDatasets = datasetResponse.filter((dataset) => listOfDatasets.includes(dataset.uuid))
                setPrimaryData(filteredDatasets)
                setUseDatasetApi(true)
                setInvalidUploadId(false)
                window.history.pushState(null, null, `/?upload_id=${uploadId}`)
            }
            else if (typeof matchingUpload === 'undefined') {
                setInvalidUploadId(true)
            }
        }
    }

    const getPrimaryDatasets = (dataResponse) => {
        return dataResponse?.filter(dataset => eq(dataset.is_primary, "true"));
    }

    const applyDatasets = (datasetResponse) => {
        const primaryDatasets = getPrimaryDatasets(datasetResponse?.data);
        setPrimaryData(primaryDatasets);
        setOriginalPrimaryData(primaryDatasets);
    }

    const applyUploads = (uploadResponse) => {
        setUploadData(uploadResponse?.data);
    }

    const handleCachingRefresh = (response) => {
        let isCaching = response.status === 202
        if (isCaching) {
            clearTimeout(cachingTimeout.current)
            cachingTimeout.current = setTimeout(() => {
                window.location.reload()
            }, 30000)
        }
        return isCaching
    }

    const loadData = async () => {
        setLoading(true);
        const options = getHeadersWith(globusToken)
        try {
            const datasetResponse = await axios.get(URLS.ingest.data.datasets(), options)
            setIsCachingDatasets(handleCachingRefresh(datasetResponse))

            let uploadData = []
            let uploadResponse
            if (ENVS.uploadsEnabled()) {
                uploadResponse = await axios.get(URLS.ingest.data.uploads(), options);
                setIsCachingUploads(handleCachingRefresh(uploadResponse))
                applyUploads(uploadResponse.data)
                uploadData = uploadResponse.data.data
            }
            applyDatasets(datasetResponse.data)
            setOriginalResponse({datasets: datasetResponse.data, uploads: uploadResponse.data})
            filterUploads(uploadData, datasetResponse.data.data, selectUploadId);
        } catch (error) {
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const toggleHistory = (condition, params = '') => {
        if (condition) {
            window.history.pushState(null, null, `/?entity_type=uploads${params}`)
        } else {
            window.history.pushState(null, null, `/${params}`)
        }
    }

    const clearBasicFilters = () => {
        setInvalidUploadId(false);
        if (ENVS.searchEnabled()) {
            applyDatasets(originalResponse.datasets)
            applyUploads(originalResponse.uploads)
            document.getElementById('appSearch').value = ''
        }
        deleteFromLocalStorage(storageKey('table'))
        setFilters({})
        setSortField(undefined)
        setSortOrder(undefined)
        setPage(1)
        setPageSize( 10)
    }

    const toggleApi = () => {
        setSelectedEntities([])
        setUseDatasetApi(!useDatasetApi)
        toggleHistory(useDatasetApi)
        clearBasicFilters()
    };

    const clearAll = () => {
        setSelectedEntities([])
        toggleHistory(!useDatasetApi)
        setPrimaryData(originalPrimaryData)
        clearBasicFilters()
        setTableKey(prevKey => prevKey === 'initialKey' ? 'updatedKey' : 'initialKey');
    };

    const uploadTable = ENVS.uploadsEnabled() ? (
        <UploadTable
            key={tableKey}
            data={uploadData}
            loading={loading}
            filterUploads={filterUploads}
            uploadData={uploadData}
            datasetData={originalPrimaryData}
            clearBasicFilters={clearBasicFilters}
        />
    ) : (<></>)

    const table = useDatasetApi ? (
        <DatasetTable
            key={tableKey}
            data={primaryData}
            loading={loading}
        />
    ) : uploadTable;

    const getLastUpdated = () => {
        let key = useDatasetApi ? 'datasets' : 'uploads'
        return (new Date(originalResponse[key].last_updated).toLocaleString())
    }

    const hasDataLoaded = () => {
        let key = useDatasetApi ? 'datasets' : 'uploads'
        return originalResponse[key]?.data !== undefined
    }

    return (
        <>
            <AppBanner name={'searchEntities'} />
            <div className="c-table c-table--data container">
                <div className='c-table__wrap'>
                    <div className="row">
                        <h2 className="c-table__title col text-center m-5">
                            {useDatasetApi ? "Datasets" : "Uploads"}
                            {hasDataLoaded() && <span className={'h6 txt-muted-light txt-sm-light d-block'}><small>Last refreshed: {getLastUpdated()}</small></span>}
                        </h2>
                    </div>
                    {invalidUploadId && <div className={'m-3'}><div className={'alert alert-warning'}>Upload ID <code>{selectUploadId}</code> not found.</div></div>}
                    <div className={`c-table__btns ${ENVS.uploadsEnabled() ? 'mx-auto text-center' : 'pull-right mx-3'}`}>
                        {ENVS.uploadsEnabled() && <button className="c-btn c-btn--primary col-md-6 col-lg-3 js-gtm--btn-cta-switch" onClick={toggleApi}>
                            {useDatasetApi ? "SWITCH TO UPLOADS" : 'SWITCH TO DATASETS'}
                        </button>}
                        <button className="c-btn c-btn--lgt col-md-6 col-lg-3 js-gtm--btn--cta-clearFilters" onClick={clearAll}>
                            {"CLEAR FILTERS"}
                        </button>
                    </div>
                    {ENVS.searchEnabled() && <Search useDatasetApi={useDatasetApi} originalResponse={originalResponse} callbacks={{applyDatasets, applyUploads, toggleHistory}}  />}
                    {!loading && (useDatasetApi && !isCachingDatasets) && table}
                    {!loading && (!useDatasetApi && !isCachingUploads) && table}
                    {(isCachingDatasets || isCachingUploads) && <div className={'c-contentBanner'}><Alert
                        variant={'warning'}>
                        <h3 className={'mb-3'}>Data initialization in progress ... <Spin size="large">
                            <span></span>
                        </Spin></h3>
                        <p>Currently initializing data. Please return later.</p>
                        <p>If you continue to have
                        issues accessing this site please contact the &nbsp;
                        <a href={`mailto:${t('help@hubmapconsortium.org')}`} className='lnk--ic'>{t('HuBMAP')} Help
                            Desk <MailOutlined/></a>.
                    </p>

                        </Alert></div>}
                    {loading && <Spinner/>}
                </div>
            </div>
        </>
    )
}

export default DataTable

