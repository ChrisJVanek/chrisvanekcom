/** @type {import('next').NextConfig} */
const nextConfig = {
  // Single canonical redirect to avoid "too many redirects" from conflicting rules.
  // In Vercel Domains: set chrisvanek.com as primary; add www as alias and do not add a second redirect there.
  // If using Cloudflare: set SSL/TLS to "Full" (not "Flexible") so the origin receives HTTPS.
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://chrisvanek.com/:path*",
        permanent: true,
        has: [{ type: "host", value: "www.chrisvanek.com" }],
      },
    ];
  },
};

export default nextConfig;
