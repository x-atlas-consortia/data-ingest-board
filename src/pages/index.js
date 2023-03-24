// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
// import styles from '@/styles/Home.module.css'
import DataTable from "@/components/DataTable";

function App() {
  return (
    <div className="App">
        <center>
            <h1>Dataset Publication Dashboard</h1>
        </center>
        <div style={{textAlign: 'right'}}>
            <button>Dataset/Upload Toggle</button>
            <button>Export</button>
        </div>
        <DataTable />
    </div>
  )
}

export default App;
