/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,          // optional but recommended
  output: 'standalone',           // packs all server files into .next/standalone
  env: {                          // pass API URL through at build-time
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
