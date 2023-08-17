import '../styles/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Roboto } from 'next/font/google'
import { AppProvider } from '../context/AppContext'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { ENVS, getRequestOptions } from '../service/helper'
import useContent from "../hooks/useContent";

const roboto = Roboto({
    weight: '500',
    subsets: ['latin']
})

export default function App({ Component, pageProps }) {
    const { messages } = useContent()

    return (
        <main className={roboto.className}>
            <AppProvider messages={messages}>
                <Component {...pageProps} />
            </AppProvider>
        </main>
    )
}
