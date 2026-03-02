/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/images/buildmypark.svg", destination: "/images/buildmypark.png", permanent: true },
      { source: "/images/ratprice.svg", destination: "/images/ratprice.png", permanent: true },
      { source: "/images/paretohub.svg", destination: "/images/paretohub.png", permanent: true },
    ];
  },
};

export default nextConfig;
