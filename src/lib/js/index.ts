/**
 * Public surface of the AI-EDU mock engine.
 * Import from '@lib/js' in components and demos.
 */
export * from './types';
export * from './embeddings';
export * from './mockLLM';
export * from './tools';
export * from './agents';

import type { Doc } from './types';

/**
 * Load a static JSON corpus shipped under /public/datasets at runtime.
 * `base` should be import.meta.env.BASE_URL so paths work under GitHub Pages.
 */
export async function loadCorpus(name: string, base = '/'): Promise<Doc[]> {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  const res = await fetch(`${prefix}datasets/${name}.json`);
  if (!res.ok) throw new Error(`Failed to load dataset "${name}" (${res.status})`);
  return (await res.json()) as Doc[];
}
