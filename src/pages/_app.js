import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css'
import { Roboto } from 'next/font/google';


const roboto = Roboto({
  weight: '500',
  subsets: ['latin'],
})

export default function App({ Component, pageProps }) {
  return (
    <main className={roboto.className}>
      <Component {...pageProps} />
    </main>
  );
}
