import Addon from "./Addon";
import GoogleTagManager from "./GoogleTagManager";

function AddonsIndex(source, globusInfo) {
    Addon.log('Addons started ...', 'log',  'white')

    window.addons = window.addons || {}
    if (window.addons[source] !== undefined) {
        return
    }
    window.addons[source] = globusInfo

    const addons = [GoogleTagManager]
    $(document).ready(() => {
        for (let addon of addons) {
            console.log(addon.name)
            addon.constructor(globusInfo, addon.name)
        }

    })
}

export default AddonsIndex