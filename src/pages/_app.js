import '@/styles/globals.css'
import { Roboto } from '@next/font/google'

const roboto = Roboto({subsets: ['latin'], weight: "300"})


export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
