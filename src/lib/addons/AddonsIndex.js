function AddonsIndex(source, globusInfo) {
    if (!Addon) return;
    Addon.log(`Addons started ... ${source}`, {color: 'white'})

    window.addons = window.addons || {}
    if (window.addons[source] !== undefined) {
        return
    }
    window.addons[source] = globusInfo

    let apps = {
        gtm: GoogleTagManager,
    }

    globusInfo = globusInfo || window.addons.init
    Addon.observeMutations(apps, globusInfo)

    setTimeout(() => {
        try {
            // Default: Capture all link clicks.
            new GoogleTagManager(null, {app: 'links', ...globusInfo})
        } catch (e) {
            console.error(e)
        }
    }, 1200)
}

export default AddonsIndex