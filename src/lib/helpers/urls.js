import ENVS from "./envs";

const URLS = {
    portal: {
        main: () => process.env.NEXT_PUBLIC_PORTAL_BASE,
        view: (uuid, entity = 'dataset')  => {
            let path = process.env.NEXT_PUBLIC_PORTAL_VIEW_PATH.format(entity, uuid)
            return ENVS.urlFormat.portal(path)
        }
    },
    entity: {
        revisions: (uuid) => {
            let path = process.env.NEXT_PUBLIC_REVISIONS_PATH.format(uuid)
            return ENVS.urlFormat.entity(path)
        }
    },
    ingest: {
        data: {
            datasets: () => process.env.NEXT_PUBLIC_DATASET_URL,
            uploads: () => process.env.NEXT_PUBLIC_UPLOAD_URL
        },
        bulk: {
            submit: () =>  process.env.NEXT_PUBLIC_INGEST_BULK_SUBMIT_URL
        },
        main: () => process.env.NEXT_PUBLIC_INGEST_BASE,
        view: (uuid, entity = 'dataset') => {
            let path = process.env.NEXT_PUBLIC_INGEST_VIEW_PATH.format(entity, uuid)
            return ENVS.urlFormat.ingest.fe(path)
        },
        privs: {
            groups: () => process.env.NEXT_PUBLIC_PRIVS_GROUP_URL,
            admin: () =>  process.env.NEXT_PUBLIC_PRIVS_ADMIN_URL,
            writeGroups: () => process.env.NEXT_PUBLIC_PRIVS_WRITE_GROUPS
        },
        auth: {
            login: () => ENVS.urlFormat.ingest.be('/data-ingest-board-login'),
            logout: () => ENVS.urlFormat.ingest.be('/data-ingest-board-logout')
        }
    }
}

export default URLS