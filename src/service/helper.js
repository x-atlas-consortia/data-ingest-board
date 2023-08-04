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
    ingest: {
        privs: {
            userGroups: () => `${process.env.NEXT_PUBLIC_APP_BACKEND_URL}${process.env.NEXT_PUBLIC_PRIVS_GROUP_URL}`
        }
    }
}