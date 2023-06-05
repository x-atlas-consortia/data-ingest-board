// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
import DataTable from "@/components/DataTable";
import Login from "@/components/Login";
import Image from 'next/image';
import { useState } from "react";

function App({ entity_type, upload_id, page, page_size, sort_field, sort_order, filters }) {
    const [entityType, setEntityType] = useState(entity_type);
    const [selectUploadId, setSelectUploadId] = useState(upload_id);
    const [initialPage, setInitialPage] = useState(page);
    const [pageSize, setPageSize] = useState(page_size);
    const [sortField, setSortField] = useState(sort_field);
    const [sortOrder, setSortOrder] = useState(sort_order);
    const [tableFilters, setTableFilters] = useState(filters);
    return (
        <div className="App">
            <div className="Banner">
                <Image className="Logo" src='/images/hubmap-type-white250.png' alt="HuBMAP Logo" width={150} height={37.5}/>
                <h1 className="Title">
                    Data Ingest Board
                </h1>
            </div>
            {/*<Login*/}
            {/*/>*/}
            <DataTable className="DataTable"
                entityType={entityType}
                setEntityType={setEntityType}
                selectUploadId={selectUploadId}
                setSelectUploadId={setSelectUploadId}
                initialPage={initialPage}
                setInitialPage={setInitialPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                sortField={sortField}
                setSortField={setSortField}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                tableFilters={tableFilters}
                setTableFilters={setTableFilters}
            />
        </div>
    );
}

App.getInitialProps = ({ query }) => {
  const { entity_type, upload_id, page, page_size, sort_field, sort_order, ...filters } = query;
  return { entity_type, upload_id, page, page_size, sort_field, sort_order, filters};
};

export default App;