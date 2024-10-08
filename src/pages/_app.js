import '@/styles/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Roboto } from 'next/font/google'
import { AppProvider } from '@/context/AppContext'
import useContent from "@/hooks/useContent";
import useGoogleTagManager from "@/hooks/useGoogleTagMananger";

const roboto = Roboto({
    weight: '500',
    subsets: ['latin']
})

export default function App({ Component, pageProps }) {
    const { messages, banners } = useContent()
    useGoogleTagManager()

    return (
        <main className={roboto.className}>
            <AppProvider messages={messages} banners={banners}>
                <Component {...pageProps} />
            </AppProvider>
        </main>
    )
}
