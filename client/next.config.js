const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['shared'],
  webpack: (config) => {
    config.resolve.alias['shared'] = path.resolve(__dirname, '../shared');
    return config;
  },
};

module.exports = nextConfig;
