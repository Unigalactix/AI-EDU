/**
 * A deterministic "mock LLM".
 *
 * A real LLM predicts the next token from a prompt. We approximate the *shape*
 * of that behaviour without any network call or randomness:
 *   - it reads the prompt + any retrieved context,
 *   - it can decide to emit a structured tool call (for tool-using demos),
 *   - it produces a grounded, templated answer that quotes the context.
 *
 * The point is pedagogy: learners see how prompt + context -> answer, how
 * grounding reduces hallucination, and how a model can choose a tool. The
 * Python parity (python/_shared/mock_llm.py) mirrors this logic.
 */

import type { Message, ToolCall } from './types';

/** Pull the most recent user message text out of a message list. */
function lastUser(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content;
  }
  return '';
}

/**
 * Decide whether the "model" wants to call a tool. We use simple keyword
 * intent detection to mimic function-calling without a real model.
 */
export function decideToolCall(prompt: string): ToolCall | null {
  const p = prompt.toLowerCase();

  // arithmetic intent -> calculator
  const math = p.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/x])\s*(-?\d+(?:\.\d+)?)/);
  if (math) {
    return { tool: 'calculator', args: { expression: `${math[1]} ${math[2]} ${math[3]}` } };
  }

  // "look up / search / find" intent -> dataset search
  if (/\b(look ?up|search|find|retrieve|what is|who is|define)\b/.test(p)) {
    const query = prompt.replace(/.*\b(look ?up|search|find|retrieve|what is|who is|define)\b/i, '').trim();
    return { tool: 'datasetSearch', args: { query: query || prompt } };
  }

  return null;
}

export interface GenerateOptions {
  /** Retrieved context snippets to ground the answer in. */
  context?: string[];
  /** A persona/role instruction, e.g. "You are a terse research analyst." */
  system?: string;
  /** Max sentences to keep the answer compact. */
  maxSentences?: number;
}

/**
 * Generate a deterministic answer from a prompt and optional grounding context.
 * If context is supplied, the answer is built by extracting the sentences most
 * relevant to the prompt — demonstrating *grounded* generation.
 */
export function mockLLM(prompt: string, opts: GenerateOptions = {}): string {
  const { context = [], system = '', maxSentences = 3 } = opts;
  const promptTokens = new Set(
    prompt.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
  );

  const persona = system ? `${describePersona(system)} ` : '';

  if (context.length === 0) {
    // No grounding: respond honestly that it is reasoning without sources.
    return `${persona}Based on general reasoning (no sources retrieved), here is a concise take on "${prompt.trim()}": this looks like a request that would benefit from retrieving supporting context before answering.`;
  }

  // Rank sentences from the context by token overlap with the prompt.
  const sentences = context
    .flatMap((c) => c.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);

  const ranked = sentences
    .map((s) => {
      const tokens = s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
      const overlap = tokens.filter((t) => promptTokens.has(t)).length;
      return { s, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, maxSentences)
    .filter((r) => r.overlap > 0)
    .map((r) => r.s);

  const body = ranked.length > 0 ? ranked.join(' ') : sentences.slice(0, maxSentences).join(' ');
  return `${persona}${body}`;
}

/** Turn a system prompt into a short stylistic prefix so personas are visible. */
function describePersona(system: string): string {
  const s = system.toLowerCase();
  if (s.includes('terse') || s.includes('concise')) return '[concise]';
  if (s.includes('teacher') || s.includes('explain')) return '[explaining clearly]';
  if (s.includes('critic') || s.includes('review')) return '[reviewing critically]';
  if (s.includes('planner') || s.includes('plan')) return '[planning]';
  return '';
}

export { lastUser };
