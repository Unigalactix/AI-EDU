/**
 * Reference pipelines for each teaching project.
 *
 * Every function returns a RunResult: a final `answer` plus a `trace` of
 * TraceSteps. The UI renders the trace as a timeline so the *mechanics* of
 * each architecture are visible, not hidden. All logic is deterministic and
 * offline. Mirrored by the Python files under python/04..07.
 */

import type { Doc, RunResult, TraceStep } from './types';
import { retrieve } from './embeddings';
import { mockLLM, decideToolCall } from './mockLLM';
import { runTool } from './tools';

/** Small helper to build a trace incrementally. */
class Trace {
  private steps: TraceStep[] = [];
  add(actor: string, kind: TraceStep['kind'], detail: string, data?: unknown): void {
    this.steps.push({ step: this.steps.length + 1, actor, kind, detail, data });
  }
  get(): TraceStep[] {
    return this.steps;
  }
}

/* ------------------------------------------------------------------ */
/* 04 — Classic RAG: retrieve once, then generate a grounded answer.   */
/* ------------------------------------------------------------------ */
export function ragPipeline(question: string, corpus: Doc[], k = 3): RunResult {
  const t = new Trace();
  t.add('user', 'think', `Question received: "${question}"`);

  const hits = retrieve(question, corpus, k);
  t.add('retriever', 'retrieve', `Retrieved top ${hits.length} chunks by cosine similarity.`, hits);

  const context = hits.map((h) => h.doc.text);
  const answer = mockLLM(question, { context });
  t.add('generator', 'answer', 'Generated an answer grounded in the retrieved context.', { answer });

  return { answer, trace: t.get() };
}

/* ------------------------------------------------------------------ */
/* 05 — Agentic RAG: the agent can rewrite the query and retrieve      */
/* again if the first pass looks weak (self-correction loop).          */
/* ------------------------------------------------------------------ */
export function agenticRagPipeline(question: string, corpus: Doc[], k = 3): RunResult {
  const t = new Trace();
  const SCORE_THRESHOLD = 0.15;
  let query = question;

  t.add('agent', 'plan', `Plan: retrieve, judge relevance, rewrite query if weak, then answer.`);

  let hits = retrieve(query, corpus, k);
  t.add('retriever', 'retrieve', `Pass 1 retrieval for "${query}".`, hits);

  const best = hits[0]?.score ?? 0;
  t.add('agent', 'critique', `Top similarity = ${best.toFixed(3)} (threshold ${SCORE_THRESHOLD}).`);

  if (best < SCORE_THRESHOLD) {
    // Rewrite: expand the query with the title words of the best weak hit.
    const expansion = hits[0]?.doc.title ?? '';
    query = `${question} ${expansion}`.trim();
    t.add('agent', 'think', `Relevance low — rewriting query to: "${query}".`);
    hits = retrieve(query, corpus, k);
    t.add('retriever', 'retrieve', `Pass 2 retrieval after query rewrite.`, hits);
  } else {
    t.add('agent', 'think', 'Relevance sufficient — no rewrite needed.');
  }

  const context = hits.map((h) => h.doc.text);
  const answer = mockLLM(question, { context });
  t.add('generator', 'answer', 'Generated grounded answer from the best available context.', { answer });

  return { answer, trace: t.get() };
}

/* ------------------------------------------------------------------ */
/* 06 — Multi-Agent: specialised agents run in sequence and hand off.  */
/* Researcher -> Analyst -> Writer.                                    */
/* ------------------------------------------------------------------ */
export function multiAgentPipeline(question: string, corpus: Doc[]): RunResult {
  const t = new Trace();

  // Researcher gathers evidence.
  const hits = retrieve(question, corpus, 3);
  t.add('researcher', 'retrieve', 'Researcher gathered supporting evidence.', hits);
  const evidence = hits.map((h) => h.doc.text);

  // Analyst extracts the key point, optionally using a tool.
  const toolCall = decideToolCall(question);
  let analystNote: string;
  if (toolCall) {
    const result = runTool(toolCall.tool, toolCall.args, corpus);
    t.add('analyst', 'tool', `Analyst called ${toolCall.tool}.`, { toolCall, result });
    analystNote = `Tool ${toolCall.tool} returned: ${result.output}.`;
  } else {
    analystNote = mockLLM(question, { context: evidence, system: 'concise analyst', maxSentences: 2 });
    t.add('analyst', 'think', 'Analyst summarised the evidence.', { analystNote });
  }

  // Writer composes the final answer using both evidence and analysis.
  const answer = mockLLM(question, {
    context: [...evidence, analystNote],
    system: 'explain clearly',
  });
  t.add('writer', 'answer', 'Writer composed the final response from evidence + analysis.', { answer });

  return { answer, trace: t.get() };
}

/* ------------------------------------------------------------------ */
/* 07 — Agent Teams: a supervisor routes the task to the right team,   */
/* each team is a mini multi-agent pipeline, results are merged.       */
/* ------------------------------------------------------------------ */
export function agentTeamsPipeline(question: string, corpus: Doc[]): RunResult {
  const t = new Trace();
  const p = question.toLowerCase();

  // Supervisor routing decision: a real arithmetic expression (e.g. "144 / 12")
  // or an explicit compute keyword routes to the quant team; everything else
  // goes to the research team.
  const isMath =
    /-?\d+(?:\.\d+)?\s*[+\-*/x]\s*-?\d+/.test(p) ||
    /\b(calculate|compute|divide|multiply)\b/.test(p);
  const route = isMath ? 'quant-team' : 'research-team';
  t.add('supervisor', 'route', `Supervisor routed the task to the "${route}".`);

  let answer: string;
  if (route === 'quant-team') {
    const toolCall = decideToolCall(question) ?? { tool: 'calculator', args: { expression: question } };
    const result = runTool(toolCall.tool, toolCall.args, corpus);
    t.add('quant-team', 'tool', `Quant team computed the result with ${toolCall.tool}.`, { result });
    answer = `The quant team computed: ${result.output}.`;
  } else {
    // Delegate to the multi-agent research team and fold its trace in.
    const sub = multiAgentPipeline(question, corpus);
    for (const s of sub.trace) {
      t.add(`research-team/${s.actor}`, s.kind, s.detail, s.data);
    }
    answer = sub.answer;
  }

  t.add('supervisor', 'answer', 'Supervisor reviewed the team output and returned the final answer.', { answer });
  return { answer, trace: t.get() };
}
