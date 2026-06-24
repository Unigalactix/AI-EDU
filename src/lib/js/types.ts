/**
 * Shared types for the AI-EDU mock engine.
 *
 * These types are intentionally small and framework-free so the same mental
 * model maps 1:1 onto the Python parity code in /python.
 */

/** A single document in a static corpus. */
export interface Doc {
  id: string;
  title: string;
  text: string;
  /** Optional metadata used by some demos (tags, source, etc.). */
  meta?: Record<string, string | number | string[]>;
}

/** A retrieval hit: a document plus its similarity score to the query. */
export interface RetrievalHit {
  doc: Doc;
  score: number;
}

/** A chat-style message passed to the mock LLM. */
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

/** A structured tool call the mock LLM may "decide" to make. */
export interface ToolCall {
  tool: string;
  args: Record<string, string>;
}

/** Result returned by a tool. */
export interface ToolResult {
  tool: string;
  output: string;
}

/**
 * A single step in an agent/orchestrator run. The UI renders these as a
 * timeline so learners can *see* the reasoning, retrieval and tool usage.
 */
export interface TraceStep {
  /** Monotonic step index, starting at 1. */
  step: number;
  /** Which actor produced this step. */
  actor: string;
  /** Short machine label: think | retrieve | tool | answer | route | critique. */
  kind: 'think' | 'retrieve' | 'tool' | 'answer' | 'route' | 'critique' | 'plan';
  /** Human-readable explanation of what happened. */
  detail: string;
  /** Optional structured payload (hits, tool call, etc.). */
  data?: unknown;
}

/** Final result of running a project demo. */
export interface RunResult {
  answer: string;
  trace: TraceStep[];
}
