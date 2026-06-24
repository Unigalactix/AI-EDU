/**
 * A tiny tool registry for function-calling demos.
 *
 * Real agents call tools (APIs, calculators, search) and feed the result back
 * to the model. Here each tool is a pure, deterministic function so demos run
 * offline. Mirrored by python/_shared/tools.py.
 */

import type { Doc, ToolResult } from './types';
import { retrieve } from './embeddings';

export type Tool = (args: Record<string, string>, corpus?: Doc[]) => ToolResult;

/** Safely evaluate a single "a OP b" arithmetic expression. No eval(). */
function calculator(args: Record<string, string>): ToolResult {
  const expr = (args.expression ?? '').replace(/x/gi, '*');
  const m = expr.match(/(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return { tool: 'calculator', output: `Could not parse expression: "${expr}"` };
  const a = parseFloat(m[1]);
  const b = parseFloat(m[3]);
  let r: number;
  switch (m[2]) {
    case '+': r = a + b; break;
    case '-': r = a - b; break;
    case '*': r = a * b; break;
    case '/': r = b === 0 ? NaN : a / b; break;
    default: r = NaN;
  }
  return { tool: 'calculator', output: Number.isNaN(r) ? 'undefined' : String(r) };
}

/** Search the provided corpus and return the best matching snippet. */
function datasetSearch(args: Record<string, string>, corpus: Doc[] = []): ToolResult {
  const query = args.query ?? '';
  if (corpus.length === 0) return { tool: 'datasetSearch', output: 'No corpus available.' };
  const hits = retrieve(query, corpus, 1);
  const top = hits[0];
  return {
    tool: 'datasetSearch',
    output: top ? `${top.doc.title}: ${top.doc.text}` : 'No matching document found.',
  };
}

/** Word count of a piece of text — a trivial, easy-to-verify tool. */
function wordCount(args: Record<string, string>): ToolResult {
  const text = args.text ?? '';
  const n = text.split(/\s+/).filter(Boolean).length;
  return { tool: 'wordCount', output: String(n) };
}

export const toolRegistry: Record<string, Tool> = {
  calculator,
  datasetSearch,
  wordCount,
};

/** Execute a named tool by string, returning a friendly error if unknown. */
export function runTool(name: string, args: Record<string, string>, corpus?: Doc[]): ToolResult {
  const tool = toolRegistry[name];
  if (!tool) return { tool: name, output: `Unknown tool: ${name}` };
  return tool(args, corpus);
}
