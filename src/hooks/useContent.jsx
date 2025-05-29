import {useEffect, useState} from 'react'
import axios from "axios";
import {getRequestOptions} from "../lib/helpers/general";
import ENVS from "../lib/helpers/envs";

function useContent() {
    const [messages, setMessages] = useState({})
    const [ubkg, setUbkg] = useState({})
    const [banners, setBanners] = useState({})
    const [colorPalettes, setColorPalettes] = useState({})

    const loadMessages = async () => {
        let res = await axios.get(
            `locale/${ENVS.locale()}.json`,
            getRequestOptions()
        )
        return res.data
    }

    const loadBanners = async () => {
        try {
            let res = await axios.get(
                `content/banners/index.json`,
                getRequestOptions()
            )
            return res.data
        } catch(e) {
            console.log(`%c No banners config file found.`, `background: #222; color: red`)
        }
        return {}
    }

    const loadColorPalettes = async () => {
        let colors = await axios.get(
            `https://x-atlas-consortia.github.io/ubkg-palettes/${ENVS.ubkg.sab().toLowerCase()}/palettes.json`,
            getRequestOptions()
        )
        return colors.data
    }

    const loadUbkg = async () => {
        let organTypes = await axios.get(
            `${ENVS.ubkg.base()}/organs?application_context=${ENVS.ubkg.sab()}`,
            getRequestOptions()
        )
        let organsDict = {}
        for (let o of organTypes.data) {
            organsDict[o.term.trim().toLowerCase()] = o.category?.term?.trim() || o.term?.trim()
        }
        window.UBKG = {organTypes: organTypes.data, organTypesGroups: organsDict}
        return window.UBKG
    }

    useEffect(() => {
        loadMessages().then((r) => setMessages(r))
        loadBanners().then((r) => setBanners(r))
        loadUbkg().then((r) => setUbkg(r))
        loadColorPalettes().then((r) => setColorPalettes(r))
    }, [])

    return {messages, ubkg, banners, colorPalettes}
}



export default useContent
