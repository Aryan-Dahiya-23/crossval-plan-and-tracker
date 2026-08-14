import type { NextConfig } from 'next';

const apiUpstream = (process.env.API_UPSTREAM_URL ?? 'http://localhost:4000').replace(/\/$/, '');

const nextConfig: NextConfig = {
  agentRules: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUpstream}/:path*`,
      },
    ];
  },
};

export default nextConfig;
