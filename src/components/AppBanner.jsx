import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Alert} from 'react-bootstrap'
import {ENVS, storageKey} from "../lib/helper";

function AppBanner({name}) {
    const [banner, setBanner] = useState(null)
    const [showBanner, setShowBanner] = useState(true)
    const [dismissed, setDismissed] = useState(false)
    const STORE_KEY = storageKey(`banner.${name}.dismissed`)

    const handleCloseBanner = () => {
        if (banner.dismissible) {
            setShowBanner(false)
            if (banner.keepDismissed) {
                localStorage.setItem(STORE_KEY, true)
            }
        }
    }

    useEffect(() => {
        const _banner = ENVS.getBanner(name)
        setBanner(_banner)
        if (_banner.keepDismissed && localStorage.getItem(STORE_KEY)) {
            setDismissed(true)
        }
    }, [])

    return (
        <>
            {banner && !dismissed && <div className={`c-AppBanner ${banner.sectionClassName || ''}`} role='section' aria-label={banner.ariaLabel}>
                {banner.beforeBanner && <div className={banner.beforeBannerClassName} dangerouslySetInnerHTML={{__html: banner.beforeBanner}}></div>}
                <div className={banner.outerWrapperClassName}>
                    <Alert variant={banner.theme || 'info'} show={showBanner} onClose={handleCloseBanner} dismissible={banner.dismissible} className={banner.className}>
                        <div className={banner.innerClassName}>
                            {banner.title && <Alert.Heading><span dangerouslySetInnerHTML={{__html: banner.title}}></span></Alert.Heading>}
                            <div dangerouslySetInnerHTML={{__html: banner.content}}></div>
                        </div>
                    </Alert>
                </div>
                {banner.afterBanner && <div className={banner.afterBannerClassName}  dangerouslySetInnerHTML={{__html: banner.afterBanner}}></div>}
            </div>}
        </>
    )
}

AppBanner.defaultProps = {
    name: 'login'
}

AppBanner.propTypes = {
    name: PropTypes.string.isRequired
}

export default AppBanner