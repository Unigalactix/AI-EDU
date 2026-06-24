import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * `projects` — one MDX file per hands-on project. The frontmatter drives the
 * roadmap ordering, difficulty badges, and which interactive demo + dataset
 * the project page wires up.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    /** Short one-line summary shown on cards. */
    summary: z.string(),
    /** Ordering in the roadmap (1 = first). */
    order: z.number(),
    /** primer | core */
    track: z.enum(['primer', 'core']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    /** The technique taught, e.g. "RAG", "Agentic RAG". */
    technique: z.string(),
    /** Which demo component to mount: prompting | embeddings | tools | rag | agentic-rag | multi-agent | agent-teams. */
    demo: z.enum([
      'prompting',
      'embeddings',
      'tools',
      'rag',
      'agentic-rag',
      'multi-agent',
      'agent-teams',
    ]),
    /** Dataset file name under /public/datasets (without .json). */
    dataset: z.string().optional(),
    /** Estimated study time, e.g. "20 min". */
    duration: z.string().default('20 min'),
    /** Key concepts surfaced as chips. */
    concepts: z.array(z.string()).default([]),
  }),
});

/**
 * `notes` — standalone technical notes (LLM mechanics, prompting strategies,
 * architecture patterns) surfaced in the UI under /notes.
 */
const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().default(99),
    category: z.enum(['fundamentals', 'prompting', 'architecture']),
  }),
});

export const collections = { projects, notes };
