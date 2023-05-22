// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
// import styles from '@/styles/Home.module.css'
import styles from '@/styles/index.module.css'
import DataTable from "@/components/DataTable";
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
        <div className="App" style={{ padding: "0 80px" }}>
            <div className={styles.Banner}>
                <h1 className={styles.Logo}>
                    HuBMAP
                </h1>
                <h1 className={styles.Title}>
                    Dataset Publication Dashboard
                </h1>
            </div>
            <DataTable
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