import { MetadataRoute } from 'next'

// Mirrors public/robots.txt — keep both in sync. The dynamic version is the source of truth
// for build-time generation when Next.js picks it.
const SHARED_DISALLOW = ['/admin/', '/api/', '/checkout', '/cart', '/order-success/']
// Search/answer crawlers (OAI-SearchBot, Claude-SearchBot, …) decide whether the store
// can be cited in AI answers; the *-User agents fetch pages a user asked about.
const AI_CRAWLERS = [
  'OAI-SearchBot', 'ChatGPT-User', 'GPTBot',
  'PerplexityBot', 'Perplexity-User',
  'Claude-SearchBot', 'Claude-User', 'ClaudeBot', 'anthropic-ai',
  'Google-Extended', 'Applebot-Extended',
]

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
