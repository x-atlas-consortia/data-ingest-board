/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
   transpilePackages: [ 'antd', '@ant-design', 'rc-util', 'rc-tree', 'rc-table', 'rc-pagination', 'rc-picker', 'rc-notification', 'rc-tooltip' ]
}

module.exports = nextConfig
