/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  // Canonicalize the host: any request hitting kzora.co is permanently redirected to www.kzora.co.
  // permanent:true emits a 308 (Permanent), which Google treats identically to 301 — link equity transfers.
  // This is a safety net in case the hosting layer (Vercel/Cloudflare/DNS) ever serves a 307 Temporary.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'kzora.co' }],
        destination: 'https://www.kzora.co/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
