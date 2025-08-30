/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone output mode for Netlify compatibility
  // distDir defaults to .next which works with Netlify's Next.js plugin
  typescript: {
    ignoreBuildErrors: true
  },
  // Enable experimental features that work well with Netlify
  experimental: {
    // This helps with serverless functions on Netlify
    outputFileTracingRoot: process.cwd(),
  },
};
export default nextConfig;
