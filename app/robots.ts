import { MetadataRoute } from 'next'

// Mirrors public/robots.txt — keep both in sync. The dynamic version is the source of truth
// for build-time generation when Next.js picks it.
const SHARED_DISALLOW = ['/admin/', '/api/', '/checkout', '/cart', '/order-success/']
const AI_CRAWLERS = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'anthropic-ai', 'Applebot-Extended']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: SHARED_DISALLOW,
      },
      // Explicitly allow major AI crawlers (with same admin/api carve-outs) so the brand is citable in AI answers
      ...AI_CRAWLERS.map(ua => ({
        userAgent: ua,
        allow: '/',
        disallow: ['/admin/', '/api/'],
      })),
    ],
    sitemap: 'https://www.kzora.co/sitemap.xml',
  }
}
