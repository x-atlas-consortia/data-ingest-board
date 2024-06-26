function AddonsIndex(source, globusInfo) {
    Addon.log('Addons started ...', {color: 'white'})

    window.addons = window.addons || {}
    if (window.addons[source] !== undefined) {
        return
    }
    window.addons[source] = globusInfo

    const addons = [GoogleTagManager]
    $(document).ready(() => {
        for (let addon of addons) {
            Addon.log(`Addons app: ${addon.name}`, {color: 'green'})
            new addon(globusInfo, addon.name)
        }

    })
}

export default AddonsIndex