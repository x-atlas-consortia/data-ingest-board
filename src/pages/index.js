// import Head from 'next/head'
// import Image from 'next/image'
// import { Inter } from 'next/font/google'
// import styles from '@/styles/Home.module.css'
import DataTable from "@/components/DataTable";

function App() {
  return (
    <div className="App" style={{padding: '0 80px'}}>
        <center>
            <h1>Dataset Publication Dashboard</h1>
        </center>
        <DataTable />
    </div>
  )
}

export default App;
