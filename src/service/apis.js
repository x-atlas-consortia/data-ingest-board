import axios from "axios";
import {getHeadersWith, URLS} from "./helper";

const callService = (auth, url) => {
    const headers = getHeadersWith(auth)
    return axios.get(url,  headers).then(res => {
        return { status: res.status, results: res.data }
    })
    .catch(error => {
        console.debug('API Request failed with', error);
        return error.response ? { status: error.response.status, results: error.response.data } : {error}
    });
}

export const INGEST_API = {
    privs: {
        hasRW: (auth) => {
            return callService(auth, URLS.ingest.privs.hasRW())
        },
        userGroups: (auth) => {
            const res = callService(auth, URLS.ingest.privs.userGroups())
            return {...res, results: res.results.groups || res.results.user_write_groups}
        }
    }
}




