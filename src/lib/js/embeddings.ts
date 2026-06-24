/**
 * Deterministic, offline "embeddings" for teaching semantic search.
 *
 * Real embedding models map text to dense vectors so that similar meanings sit
 * close together in vector space. We can't call a real model on GitHub Pages,
 * so we fake it with a *deterministic bag-of-words hashing vector*. It is NOT
 * semantically smart, but it is:
 *   - 100% offline and reproducible (same text -> same vector, always),
 *   - good enough to demonstrate cosine similarity and top-k retrieval,
 *   - tiny and dependency-free.
 *
 * The Python parity version (python/_shared/embeddings.py) uses the identical
 * algorithm so the two ecosystems produce matching results.
 */

const DIMS = 64;

/** Lowercase + split into word tokens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Stable string hash (FNV-1a) -> non-negative integer. */
function hashToken(token: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Map text to a fixed-length vector by hashing each token into a bucket and
 * counting occurrences, then L2-normalising.
 */
export function fakeEmbed(text: string): number[] {
  const vec = new Array<number>(DIMS).fill(0);
  for (const token of tokenize(text)) {
    const bucket = hashToken(token) % DIMS;
    vec[bucket] += 1;
  }
  // L2 normalise so cosine similarity reduces to a dot product.
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

/** Cosine similarity of two equal-length vectors (range roughly 0..1 here). */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

import type { Doc, RetrievalHit } from './types';

/**
 * Return the top-k most similar documents to `query` from `corpus`.
 * This is the retrieval ("R") in RAG.
 */
export function retrieve(query: string, corpus: Doc[], k = 3): RetrievalHit[] {
  const q = fakeEmbed(query);
  return corpus
    .map((doc) => ({ doc, score: cosineSimilarity(q, fakeEmbed(`${doc.title} ${doc.text}`)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
