// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
// import styles from '@/styles/Home.module.css'
import DataTable from "@/components/DataTable";
import { useState } from "react";

function App({ entity_type, upload_id, page, page_size, sort_field, sort_order, filters }) {
    //const useDatasetApi = entity_type !== 'uploads';
    const [entityType, setEntityType] = useState(entity_type);
    const [selectUploadId, setSelectUploadId] = useState(upload_id);
    const [page, setPage] = useState(page);
    const [pageSize, setPageSize] = useState(page_size);
    const [sortField, setSortField] = useState(sort_field);
    const [sortOrder, setSortOrder] = userState(sort_order);
    const [filters, setFilters] = userState(filters);
    return (
        <div className="App" style={{ padding: "0 80px" }}>
            <center>
                <h1>Dataset Publication Dashboard</h1>
            </center>
            <DataTable
                entityType={entityType}
                setEntityType={setEntityType}
                selectUploadId={selectUploadId}
                setSelectUploadId={setSelectUploadId}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                sortField={sortField}
                setSortField={setSortField}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                filters={filters}
                setFilters={setFilters}
            />
        </div>
    );
}

App.getInitialProps = ({ query }) => {
  const { entity_type, upload_id, page, page_size, sort_field, sort_order, ...filters } = query;
  return { entity_type, upload_id, filters };
};

export default App;