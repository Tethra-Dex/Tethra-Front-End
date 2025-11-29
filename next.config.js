/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/trustwallet/assets/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/gmx/:network/:path*',
        destination: 'https://:network-api.gmxinfra.io/:path*',
      },
    ];
  },
};

module.exports = nextConfig;