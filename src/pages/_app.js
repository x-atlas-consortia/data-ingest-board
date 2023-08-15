import '../styles/main.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Roboto } from 'next/font/google';
import { AppProvider } from '../context/AppContext'


const roboto = Roboto({
  weight: '500',
  subsets: ['latin'],
})

export default function App({ Component, pageProps }) {
  return (
    <main className={roboto.className}>
      <AppProvider>
        <Component {...pageProps} />
      </AppProvider>
    </main>
  );
}
