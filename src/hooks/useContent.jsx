import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import axios from "axios";
import {ENVS, getRequestOptions} from "../service/helper";

function useContent() {
    const [messages, setMessages] = useState({})
    const [ubkg, setUbkg] = useState({})

    const loadMessages = async () => {
        let res = await axios.get(
            `locale/${ENVS.locale()}.json`,
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
        loadUbkg().then((r) => setUbkg(r))
    }, [])

    return {messages, ubkg}
}



export default useContent