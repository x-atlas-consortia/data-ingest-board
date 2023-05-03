// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
// import styles from '@/styles/Home.module.css'
import DataTable from "@/components/DataTable";
import { useState } from "react";

function App({ entity_type, upload_id }) {
    const useDatasetApi = entity_type !== 'uploads';
    const [selectUploadId, setSelectUploadId] = useState(upload_id);
    return (
        <div className="App" style={{ padding: "0 80px" }}>
            <center>
                <h1>Dataset Publication Dashboard</h1>
            </center>
            <DataTable selectUploadId={selectUploadId} setSelectUploadId={setSelectUploadId} useDatasetApi={useDatasetApi} />
        </div>
    );
}

App.getInitialProps = ({ query }) => {
  const { entity_type, upload_id } = query;
  return { entity_type, upload_id };
};

export default App;