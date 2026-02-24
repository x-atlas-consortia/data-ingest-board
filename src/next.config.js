const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    turbopack: {
        root: path.join(__dirname, '..'),
        resolveAlias: {
            "@": path.resolve(__dirname)
        }
    },
    transpilePackages: [
        'antd',
        '@ant-design',
        'rc-util',
        'rc-tree',
        'rc-table',
        'rc-pagination',
        'rc-picker',
        'rc-notification',
        'rc-tooltip',
        'rc-input'
    ]
}

module.exports = nextConfig
