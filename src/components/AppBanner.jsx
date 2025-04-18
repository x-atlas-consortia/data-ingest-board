import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Alert} from 'react-bootstrap'
import {storageKey} from "../lib/helpers/general";
import AppContext from "../context/AppContext";

function AppBanner({name = 'login'}) {
    const {banners} = useContext(AppContext)
    const [banner, setBanner] = useState(null)
    const [showBanner, setShowBanner] = useState(true)
    const [dismissed, setDismissed] = useState(false)
    const STORE_KEY = storageKey(`banner.${name}.dismissed`)

    const handleCloseBanner = () => {
        if (banner?.dismissible) {
            setShowBanner(false)
            if (banner.keepDismissed) {
                localStorage.setItem(STORE_KEY, true)
            }
        }
    }

    useEffect(() => {
        const defaultBanner = banners.default || {}
        let _banner = banners[name] || defaultBanner
        _banner = Object.assign(_banner, defaultBanner)
        setBanner(_banner)
        if (_banner?.keepDismissed && localStorage.getItem(STORE_KEY)) {
            setDismissed(true)
        }
    }, [banners])

    return (
        <>
            {banner && (banner?.content?.length > 0) && !dismissed && <div className={`c-AppBanner ${banner.sectionClassName || 'container'}`} role='section' aria-label={banner.ariaLabel}>
                {banner.beforeBanner && <div className={banner.beforeBannerClassName || ''} dangerouslySetInnerHTML={{__html: banner.beforeBanner}}></div>}
                <div className={banner.outerWrapperClassName || ''}>
                    <Alert variant={banner.theme || 'warning'} show={showBanner} onClose={handleCloseBanner} dismissible={banner.dismissible} className={banner.className || 'mt-4'}>
                        <div className={banner.innerClassName}>
                            {banner.title && <Alert.Heading><span dangerouslySetInnerHTML={{__html: banner.title}}></span></Alert.Heading>}
                            <div dangerouslySetInnerHTML={{__html: banner.content}}></div>
                        </div>
                    </Alert>
                </div>
                {banner.afterBanner && <div className={banner.afterBannerClassName || ''}  dangerouslySetInnerHTML={{__html: banner.afterBanner}}></div>}
            </div>}
        </>
    )
}

AppBanner.propTypes = {
    name: PropTypes.string
}

export default AppBanner