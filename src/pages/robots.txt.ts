// robots.txt with the sitemap URL taken from SITE_URL (astro.config site).
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: /dev/\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
