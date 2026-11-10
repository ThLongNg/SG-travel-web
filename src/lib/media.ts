// Fixed public paths for the Saigon hero media. Files live in public/media/ (owner: B) and are
// produced by scripts/encode-video.sh (owner: C). Replace the files, keep the names.
export const heroMedia = {
  posterLandscape: '/media/hero-saigon-poster.webp', // 1920×1080
  posterPortrait: '/media/hero-saigon-poster-portrait.webp', // 720×1280
  /** Tiny pre-blurred poster used as the fixed background of every non-home page */
  background: '/media/hero-saigon-bg.webp',
  desktop: { mp4: '/media/hero-saigon-desktop.mp4', webm: '/media/hero-saigon-desktop.webm' },
  mobile: { mp4: '/media/hero-saigon-mobile.mp4', webm: '/media/hero-saigon-mobile.webm' },
} as const;
