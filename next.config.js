/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  images: {
    formats: ['image/avif', 'image/webp'],
    // These three hosts cover Discord's CDN. Note: src/components/ui/avatar.tsx
    // renders every avatar with next/image's `unoptimized`, which bypasses this
    // allowlist entirely (unoptimized skips the optimizer's loader/hostname
    // check). This list only matters if avatar rendering ever stops using
    // `unoptimized`, or for other, non-avatar Discord image usage.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'media.discordapp.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discord.com',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  httpAgentOptions: {
    keepAlive: true,
  },
}

module.exports = nextConfig
