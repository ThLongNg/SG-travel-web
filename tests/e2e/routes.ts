// Every built page, discovered from dist/ so new spots/courses are covered automatically.
import { existsSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

const dist = join(process.cwd(), 'dist');

export interface Route {
  path: string;
  /** Japanese (default-locale) page → gets a screenshot */
  ja: boolean;
  /** File-safe name for screenshots */
  name: string;
}

export function builtRoutes(): Route[] {
  if (!existsSync(dist))
    throw new Error('dist/ not found — run `npm run build` before `npm run test:e2e`.');
  return readdirSync(dist, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith(`${sep}index.html`) || f === 'index.html')
    .map((f) => `/${f.slice(0, -'index.html'.length).split(sep).join('/')}`)
    .filter((p) => !p.startsWith('/dev/'))
    .sort()
    .map((path) => ({
      path,
      ja: !/^\/(vi|en)(\/|$)/.test(path),
      name: path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replace(/\//g, '__'),
    }));
}

/** Pages with the hero video: WebKit can stall `load` on them, so wait for DOMContentLoaded. */
export const isVideoPage = (path: string) => /^\/((vi|en)\/)?$/.test(path);
