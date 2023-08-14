export function eq(s1, s2, insensitive = true) {
    let res = s1 === s2
    if (insensitive && s1 !== undefined && s2 !== undefined) {
        res = s1.toLowerCase() === s2.toLowerCase()
    }
    return res
}

export const ENVS = {
    privsGroupReadName: () => process.env.NEXT_PUBLIC_PRIVS_READ_NAME
}

export const URLS = {
    portal: {
      main: process.env.NEXT_PUBLIC_PORTAL_URL,
    },
    ingest: {
        main: () => process.env.NEXT_PUBLIC_INGEST_URL,
        auth: {
          login: () => `${process.env.NEXT_PUBLIC_APP_BACKEND_URL}/data-ingest-board-login`,
          logout: () => `${process.env.NEXT_PUBLIC_APP_BACKEND_URL}/data-ingest-board-logout`
        },
        privs: {
            userGroups: () => `${process.env.NEXT_PUBLIC_APP_BACKEND_URL}${process.env.NEXT_PUBLIC_PRIVS_GROUP_URL}`
        }
    }
}

export const ensureTrailingSlash = (url) => url.endsWith('/') ? url : `${url}/`