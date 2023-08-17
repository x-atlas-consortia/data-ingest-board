import '../styles/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Roboto } from 'next/font/google'
import { AppProvider } from '../context/AppContext'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { ENVS, getRequestOptions } from '../service/helper'

const roboto = Roboto({
    weight: '500',
    subsets: ['latin']
})

export default function App({ Component, pageProps }) {
    const [messages, setMessages] = useState({})
    const loadMessages = async () => {
        let res = await axios.get(
            `locale/${ENVS.locale()}.json`,
            getRequestOptions()
        )
        console.log(res)
        return res.data
    }

    useEffect(() => {
        loadMessages().then((r) => setMessages(r))
    }, [])

    return (
        <main className={roboto.className}>
            <AppProvider messages={messages}>
                <Component {...pageProps} />
            </AppProvider>
        </main>
    )
}
