import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
        <script src={'/js/jquery-3.7.1.min.js'} crossOrigin="anonymous" />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
