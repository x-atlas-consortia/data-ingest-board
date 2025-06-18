import {createContext, useState} from "react";

const RouterContext = createContext()

export const RouterProvider = ({ children, props }) => {
    const [useDatasetApi, setUseDatasetApi] = useState(props.entity_type !== 'uploads')
    const [selectUploadId, setSelectUploadId] = useState(props.upload_id)
    const [page, setPage] = useState(Number(props.page || 1))
    const [pageSize, setPageSize] = useState(props.page_size !== undefined ? Number(props.page_size) : 10)
    const [sortField, setSortField] = useState(props.sort_field)
    const [sortOrder, setSortOrder] = useState(props.sort_order)
    const [filters, setFilters] = useState(props.filters)



return <RouterContext.Provider value={{
    props,
    useDatasetApi, setUseDatasetApi,
    selectUploadId, setSelectUploadId,
    page, setPage,
    pageSize, setPageSize,
    sortField, setSortField,
    sortOrder, setSortOrder,
    filters, setFilters
}}>{children}</RouterContext.Provider>
}

export default RouterContext