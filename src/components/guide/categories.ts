import type { CollectionEntry } from 'astro:content';

type Category = CollectionEntry<'guides'>['data']['category'];

/** Guide categories shown on /eat/ (食べる・買う) instead of /guide/. */
export const EAT_CATEGORIES: readonly Category[] = ['food', 'shopping'];
