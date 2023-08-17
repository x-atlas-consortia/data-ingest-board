export function eq(s1, s2, insensitive = true) {
    let res = s1 === s2
    if (insensitive && s1 !== undefined && s2 !== undefined) {
        res = s1.toLowerCase() === s2.toLowerCase()
    }
    return res
}

String.prototype.format = function() {
    let args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
    });
};

export const getRequestOptions = () => {
    return {
        headers: {
            'Content-Type': 'application/json'
        }
    };
}

export const getHeadersWith = (value, key = 'Authorization') => {
    const options = getRequestOptions()
    options.headers[key] = value
    return options
}

export const ENVS = {
    privsGroupReadName: () => process.env.NEXT_PUBLIC_PRIVS_READ_NAME,
    theme: () => {
        let themeConfig = JSON.parse(process.env.NEXT_PUBLIC_THEME)
        for (let t in themeConfig) {
            document.body.style.setProperty(
                `--${t}`,
                `${themeConfig[t]}`
            );
        }
    },
    locale: () => {
        return process.env.NEXT_PUBLIC_LOCALE || 'en/hubmap'
    },
    urlFormat: (path) => `${process.env.NEXT_PUBLIC_APP_BACKEND_URL}${path}`
}

export const URLS = {
    portal: {
      main: process.env.NEXT_PUBLIC_PORTAL_URL,
    },
    ingest: {
        main: () => process.env.NEXT_PUBLIC_INGEST_URL,
        auth: {
          login: () => ENVS.urlFormat('/data-ingest-board-login'),
          logout: () => ENVS.urlFormat('/data-ingest-board-logout')
        },
        privs: {
            hasRW: () => ENVS.urlFormat(process.env.NEXT_PUBLIC_PRIVS_HAS_RW_URL),
            userGroups: () => ENVS.urlFormat(process.env.NEXT_PUBLIC_PRIVS_GROUP_URL)
        }
    }
}

export const ensureTrailingSlash = (url) => url.endsWith('/') ? url : `${url}/`