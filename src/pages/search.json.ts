import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * Static search index. Built at compile time into /search.json so the client
 * SearchBox can fetch a single small file and filter entirely in the browser —
 * no server, works on GitHub Pages.
 */
export const GET: APIRoute = async () => {
  const projects = await getCollection('projects');
  const notes = await getCollection('notes');

  const entries = [
    ...projects.map((p) => ({
      type: 'project',
      title: p.data.title,
      summary: p.data.summary,
      keywords: [p.data.technique, ...(p.data.concepts ?? [])].join(' '),
      url: `projects/${p.id}`,
    })),
    ...notes.map((n) => ({
      type: 'note',
      title: n.data.title,
      summary: n.data.summary,
      keywords: n.data.category,
      url: `notes/${n.id}`,
    })),
    // A few key destinations that aren't content collections.
    { type: 'page', title: '14 Pillars of Agentic AI', summary: 'Interactive explorer of core agent design patterns.', keywords: 'agents patterns orchestration', url: 'pillars' },
    { type: 'page', title: '18 RAG Techniques', summary: 'Benchmarked RAG techniques with animated pipelines.', keywords: 'rag retrieval reranking fusion hyde', url: 'rag-techniques' },
    { type: 'page', title: 'Playground', summary: 'Hands-on drag-and-drop pipeline puzzle and retrieval tuner.', keywords: 'exercise interactive sandbox drag drop', url: 'playground' },
    { type: 'page', title: 'Glossary', summary: 'Plain-language definitions of AI engineering terms.', keywords: 'definitions terms vocabulary', url: 'glossary' },
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json' },
  });
};
