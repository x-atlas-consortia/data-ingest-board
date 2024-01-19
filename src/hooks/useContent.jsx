import {useEffect, useState} from 'react'
import axios from "axios";
import {ENVS, getRequestOptions} from "../lib/helper";

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
        let res = await axios.get(
            `content/banners/index.json`,
            getRequestOptions()
        )
        return res.data
    }

    const loadUbkg = async () => {
        let organTypes = await axios.get(
            `${ENVS.ubkg.base()}/organs?application_context=${ENVS.ubkg.sab()}`,
            getRequestOptions()
        )
        window.UBKG = {organTypes: organTypes.data}
        return window.UBKG
    }

    useEffect(() => {
        loadMessages().then((r) => setMessages(r))
        loadBanners().then((r) => setBanners(r))
        loadUbkg().then((r) => setUbkg(r))
    }, [])

    return {messages, ubkg, banners}
}



export default useContent