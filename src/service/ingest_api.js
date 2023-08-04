import axios from "axios";
import {URLS} from "./helper";

/*
 * User Groups only those data provider groups are return
 *
 */
export function ingest_api_users_groups(auth) {
    const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };
    return axios.get(URLS.ingest.privs.userGroups(),  options).then(res => {
        console.debug('API USER GROUPs', res.data.groups);
        return {status: res.status, results: res.data.groups}
   })
    .catch(error => {
        console.debug("ingest_api_allowable_edit_states", error, error.response);
        if(error.response){
            return {status: error.response.status, results: error.response.data}
        }else{
        return {error}
        }
    });
}



