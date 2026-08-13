/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Shaders are authored as tagged template strings in src/shaders so
  // they type-check alongside the uniforms that feed them, rather than
  // needing a loader that has to be configured twice for two bundlers.
};

export default nextConfig;
