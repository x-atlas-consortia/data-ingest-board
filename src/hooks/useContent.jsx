import {useEffect, useState} from 'react'
import axios from "axios";
import {getRequestOptions} from "../lib/helpers/general";
import ENVS from "../lib/helpers/envs";
import {getCookie, setCookie} from "cookies-next";

function useContent() {
    const [messages, setMessages] = useState({})
    const [ubkg, setUbkg] = useState({})
    const [banners, setBanners] = useState({})

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

    const loadCss = () => {
        const key = 'loadedCss'
        if (!getCookie(key)) {
            const style = document.createElement('link')
            style.href = '/css/xac-sankey.css'
            document.head.append(style)
            setTimeout(()=>{
                style.remove()
            }, 3000)
            setCookie(key, true, {maxAge: 60 * 60 * 24})
        }
    }

    useEffect(() => {
        loadMessages().then((r) => setMessages(r))
        loadBanners().then((r) => setBanners(r))
        loadUbkg().then((r) => setUbkg(r))
        loadCss()
    }, [])

    return {messages, ubkg, banners}
}



export default useContent
