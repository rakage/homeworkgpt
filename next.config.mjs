/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable filesystem cache to avoid permission issues
  generateBuildId: async () => "build",
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    outputFileTracingIgnores: ["./generated/client/**/*"],
  },
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ignored: [
        "**/node_modules/**",
        "**/Application Data/**",
        "**/.next/**",
        "**/AppData/**",
        "**/.*//**",
      ],
    };
    return config;
  },
};

export default nextConfig;
