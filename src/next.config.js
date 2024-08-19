const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, options) => {
        // Set the @ alias for the src directory
        config.resolve.alias['@'] = path.resolve(__dirname)
        return config
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
        'rc-tooltip'
    ]
}

module.exports = nextConfig
