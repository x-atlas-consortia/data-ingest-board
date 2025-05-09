import { Html, Head, Main, NextScript } from 'next/document'
import ENVS from "../lib/helpers/envs";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
        <link className="favicon" rel="icon" href={`favicons/${ENVS.favicon()}`} />
      <body>
        <Main />
        <NextScript />
        <script defer src={'/js/jquery-3.7.1.min.js'} crossOrigin="anonymous" />
        <script defer src={'/js/addons.js'} crossOrigin="anonymous" />
      </body>
    </Html>
  )
}
