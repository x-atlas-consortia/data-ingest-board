import { useEffect } from 'react'
import ENVS from "../lib/helpers/envs";

function useGoogleTagManager() {
    let gtm
    let noscript

    const id = ENVS.getGoogleTagManagerId() || 'GTM-58VQTHT9'

    const className = 'js-gtm'

    useEffect(() => {
        // Double check that this hasn't been added already
        if (document.getElementsByClassName(className).length) return

        // GTM Tag
        gtm = document.createElement('script')
        gtm.classList.add(className)
        gtm.async = true

        gtm.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','${id}');`
        document.head.appendChild(gtm)

        // Add GTM No JavaScript
        noscript = document.createElement('noscript')
        noscript.async = true
        noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
        document.body.prepend(noscript)

        return () => {
            document.head.removeChild(gtm)
        }
    }, [gtm])
    return { gtm }
}

export default useGoogleTagManager
