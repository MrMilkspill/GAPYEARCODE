/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/founder",
        destination: "/contact",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
