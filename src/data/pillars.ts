/**
 * The 14 pillars of Agentic AI — concept data that drives the interactive
 * `PillarsExplorer` learning graphic. Each pillar maps to one of four animation
 * archetypes (fanout / pipeline / hub / speculative) and carries a headline
 * "before vs after" stat sourced from the real-world benchmarks in the article.
 *
 * Numbers are illustrative teaching values drawn from the reference write-up;
 * they exist to make the trade-off *visible*, not to be exact measurements.
 */

export type Archetype = 'fanout' | 'pipeline' | 'hub' | 'speculative';
export type Category = 'parallel' | 'orchestration' | 'retrieval';

export interface Branch {
  /** Short label shown inside the node (keep ≤ 12 chars). */
  label: string;
  /** Relative work duration in sim-seconds — only used for the flow animation. */
  t: number;
}

export interface Stat {
  /** Naïve / baseline value. */
  before: number;
  /** Value after applying the pattern. */
  after: number;
  unit: string;
  /** True when a *smaller* number is better (latency, tokens). */
  lowerIsBetter: boolean;
  /** What the number measures, e.g. "Wall-clock time". */
  label: string;
  /** One-line summary of the win, e.g. "≈80% faster". */
  improvement: string;
}

export interface Pillar {
  id: string;
  num: number;
  title: string;
  category: Category;
  tagline: string;
  problem: string;
  solution: string;
  archetype: Archetype;

  // fanout
  source?: string;
  sink?: string;
  branches?: Branch[];
  /** Index of the winning / best branch (branching, ensemble, redundant). */
  winner?: number;
  /** Redundant execution: the slower branch is shown cancelled once one wins. */
  race?: boolean;

  // pipeline
  stages?: string[];
  itemCount?: number;

  // hub
  hub?: string;
  satellites?: string[];

  // speculative
  spec?: { think: number; tool: number; synth: number };

  stat: Stat;
  takeaways: string[];
  realWorld: string;
}

export const CATEGORIES: Record<Category, { label: string; blurb: string }> = {
  parallel: {
    label: 'Parallel execution & resilience',
    blurb: 'Hide I/O latency and survive failures by doing work concurrently.',
  },
  orchestration: {
    label: 'Multi-agent orchestration',
    blurb: 'Coordinate specialised agents to raise quality and throughput.',
  },
  retrieval: {
    label: 'Advanced retrieval (RAG)',
    blurb: 'Find more of the right context with parallel search strategies.',
  },
};

export const PILLARS: Pillar[] = [
  {
    id: 'parallel-tool-use',
    num: 1,
    title: 'Parallel Tool Use',
    category: 'parallel',
    tagline: 'Hide I/O latency',
    problem:
      'The bottleneck in agents is rarely the model thinking — it is waiting on networks, databases and APIs. Calling independent tools one after another wastes that wait time.',
    solution:
      'When the agent plans several independent tool calls, fire them all at once. Total time collapses to the slowest single call instead of the sum of all of them.',
    archetype: 'fanout',
    source: 'Agent',
    sink: 'Answer',
    branches: [
      { label: 'Stock API', t: 2 },
      { label: 'News API', t: 2 },
    ],
    stat: {
      before: 15,
      after: 3,
      unit: 's',
      lowerIsBetter: true,
      label: 'Wall-clock (≈10 tools)',
      improvement: '≈80% faster',
    },
    takeaways: [
      'Independent calls have no reason to run sequentially.',
      'Wall-clock time ≈ the single slowest call, not the sum.',
      'The gain grows with the number of tools.',
    ],
    realWorld: 'A trading assistant fetches price + news + filings simultaneously.',
  },
  {
    id: 'speculative-execution',
    num: 4,
    title: 'Speculative Execution',
    category: 'parallel',
    tagline: 'Guess ahead while thinking',
    problem:
      'A normal turn is think → act → wait. The user sits idle through both the LLM call and the slow tool call that follows it.',
    solution:
      'Start the most likely tool call in the background while the LLM is still reasoning. If the guess was right, the tool latency is hidden behind the thinking time.',
    archetype: 'speculative',
    spec: { think: 4.2, tool: 3, synth: 3.5 },
    stat: {
      before: 10.8,
      after: 7.8,
      unit: 's',
      lowerIsBetter: true,
      label: 'Time to answer',
      improvement: '28% faster',
    },
    takeaways: [
      'Overlap the LLM call with a predictable tool pre-fetch.',
      'A correct guess hides the entire tool latency.',
      'A wrong guess just falls back to the normal path.',
    ],
    realWorld: 'A support bot pre-loads your order history while drafting its reply.',
  },
  {
    id: 'redundant-execution',
    num: 9,
    title: 'Redundant Execution',
    category: 'parallel',
    tagline: 'Survive flaky steps',
    problem:
      'Real services time out, models crash and networks drop. A single attempt at a critical step is a single point of failure with unpredictable latency.',
    solution:
      'Run two or more identical agents in parallel for the risky step. Use the first one that succeeds and cancel the rest — defeating both failures and long-tail latency.',
    archetype: 'fanout',
    race: true,
    source: 'Request',
    sink: 'First win',
    winner: 0,
    branches: [
      { label: 'Agent A', t: 3 },
      { label: 'Agent B', t: 6 },
    ],
    stat: {
      before: 60,
      after: 80,
      unit: '%',
      lowerIsBetter: false,
      label: 'Success rate',
      improvement: '+33% reliability',
    },
    takeaways: [
      'First success wins; the slower copy is cancelled.',
      'Eliminates long-tail latency spikes.',
      'Cheap insurance for mission-critical steps.',
    ],
    realWorld: 'A payment agent runs duplicate calls so one timeout never blocks checkout.',
  },
  {
    id: 'hypothesis-generation',
    num: 2,
    title: 'Hypothesis Generation',
    category: 'orchestration',
    tagline: 'Explore many ideas',
    problem:
      'A single line of reasoning is fragile. If the first idea is weak, the whole result is compromised — especially on creative tasks.',
    solution:
      'A planner branches into several diverse strategies, workers explore each in parallel, and a judge picks the best. More robust, more creative, harder to get stuck.',
    archetype: 'fanout',
    source: 'Planner',
    sink: 'Judge',
    winner: 1,
    branches: [
      { label: 'Angle A', t: 5 },
      { label: 'Angle B', t: 5 },
      { label: 'Angle C', t: 5 },
    ],
    stat: {
      before: 15.4,
      after: 5.3,
      unit: 's',
      lowerIsBetter: true,
      label: 'Exploration time',
      improvement: '66% faster + better idea',
    },
    takeaways: [
      'Generate diverse hypotheses, not one guess.',
      'Explore every branch in parallel.',
      'A judge selects the strongest result.',
    ],
    realWorld: 'A marketing agent drafts three slogan angles, then keeps the winner.',
  },
  {
    id: 'parallel-evaluation',
    num: 3,
    title: 'Parallel Evaluation',
    category: 'orchestration',
    tagline: 'A panel of critics',
    problem:
      'One judge gives one perspective. Complex decisions about safety, brand and facts need to be checked from several expert angles at once.',
    solution:
      'Send the content to a panel of specialist critics simultaneously, then have an editor synthesise their structured feedback into one holistic decision.',
    archetype: 'fanout',
    source: 'Draft',
    sink: 'Editor',
    branches: [
      { label: 'Fact-Check', t: 5 },
      { label: 'Brand Voice', t: 5 },
      { label: 'Risk', t: 5 },
    ],
    stat: {
      before: 19.2,
      after: 9.2,
      unit: 's',
      lowerIsBetter: true,
      label: 'Review stage',
      improvement: '>52% faster, 3 expert views',
    },
    takeaways: [
      'Multiple critics, each with one specialty.',
      'They all review at the same time.',
      'An editor merges verdicts into one decision.',
    ],
    realWorld: 'Content governance: fact-checker, risk and brand critics review a post together.',
  },
  {
    id: 'hierarchical-teams',
    num: 5,
    title: 'Hierarchical Agent Teams',
    category: 'orchestration',
    tagline: 'Decompose & delegate',
    problem:
      'A single monolithic agent doing a complex job produces shallow, unstructured output and is hard to steer.',
    solution:
      'A manager decomposes the task, delegates focused sub-tasks to specialist workers running in parallel, then synthesises their structured results into one report.',
    archetype: 'fanout',
    source: 'Manager',
    sink: 'Report',
    branches: [
      { label: 'Financials', t: 7 },
      { label: 'News/Market', t: 8 },
    ],
    stat: {
      before: 18.3,
      after: 13.6,
      unit: 's',
      lowerIsBetter: true,
      label: 'Report time',
      improvement: '26% faster + richer report',
    },
    takeaways: [
      'Narrow prompts make each worker reliable.',
      'Workers run in parallel where possible.',
      'Structured outputs glue the team together.',
    ],
    realWorld: 'An investment report built by a financial analyst + market analyst + chief analyst.',
  },
  {
    id: 'competitive-ensembles',
    num: 6,
    title: 'Competitive Agent Ensembles',
    category: 'orchestration',
    tagline: 'Get a second opinion',
    problem:
      'Every model has its own biases and blind spots. Relying on one agent risks a single suboptimal answer.',
    solution:
      'Run a diverse ensemble of agents (different models or personas) on the same task in parallel, then let a judge reason over their outputs and pick the best.',
    archetype: 'fanout',
    source: 'Brief',
    sink: 'Judge',
    winner: 0,
    branches: [
      { label: 'Creative', t: 7 },
      { label: 'Direct', t: 6 },
      { label: 'Luxury', t: 6 },
    ],
    stat: {
      before: 19.9,
      after: 7.3,
      unit: 's',
      lowerIsBetter: true,
      label: 'Generation stage',
      improvement: '63% faster + best-of-3',
    },
    takeaways: [
      'Diversity of members drives quality.',
      'Quality comes from competition + judging.',
      'Parallelism costs only the slowest agent.',
    ],
    realWorld: 'Three copywriter personas compete; a judge ships the strongest description.',
  },
  {
    id: 'agent-assembly-line',
    num: 7,
    title: 'Agent Assembly Line',
    category: 'orchestration',
    tagline: 'Maximise throughput',
    problem:
      'Sometimes the challenge is not one slow task but a huge *stream* of tasks. Processing items one-by-one end-to-end caps your throughput.',
    solution:
      'Break the job into specialised stations. As soon as station A finishes item 1 it passes it to B and starts item 2. Every station works in parallel on different items.',
    archetype: 'pipeline',
    stages: ['Triage', 'Summarize', 'Extract'],
    itemCount: 5,
    stat: {
      before: 0.16,
      after: 0.49,
      unit: ' rev/s',
      lowerIsBetter: false,
      label: 'Throughput',
      improvement: '+206% throughput',
    },
    takeaways: [
      'Optimise throughput, not single-item latency.',
      'Stations stay busy on different items.',
      'Ideal for high-volume batch processing.',
    ],
    realWorld: 'A pipeline triages → summarises → extracts thousands of product reviews.',
  },
  {
    id: 'decentralized-blackboard',
    num: 8,
    title: 'Decentralized Blackboard',
    category: 'orchestration',
    tagline: 'Emergent collaboration',
    problem:
      'Some problems have no fixed solution path. A rigid, pre-wired workflow cannot adapt to what the data reveals along the way.',
    solution:
      'Agents share a blackboard. A router activates whichever specialist the current state needs; it reads, contributes, and steps back — building the solution opportunistically.',
    archetype: 'hub',
    hub: 'Blackboard',
    satellites: ['Analyzer', 'Retriever', 'Draftsman'],
    stat: {
      before: 1,
      after: 3,
      unit: ' artifacts',
      lowerIsBetter: false,
      label: 'Auditable steps',
      improvement: 'Traceable & modular',
    },
    takeaways: [
      'Agents self-activate from the shared state.',
      'The workflow emerges instead of being fixed.',
      'Each contribution is an auditable artifact.',
    ],
    realWorld: 'A support ticket flows: analyse → retrieve KB → draft, driven by a router.',
  },
  {
    id: 'query-expansion',
    num: 10,
    title: 'Parallel Query Expansion',
    category: 'retrieval',
    tagline: 'Maximise recall',
    problem:
      'Users rarely use the exact jargon in your knowledge base. "Make models bigger and faster" misses docs about "Mixture of Experts" and "FlashAttention".',
    solution:
      'Before searching, an LLM rewrites the query into a portfolio: a hypothetical answer, sub-questions and keywords. Search them all in parallel and fuse the results.',
    archetype: 'fanout',
    source: 'Query',
    sink: 'Fuse',
    branches: [
      { label: 'HyDE', t: 3 },
      { label: 'Sub-Qs', t: 3 },
      { label: 'Keywords', t: 3 },
    ],
    stat: {
      before: 1,
      after: 3,
      unit: ' docs',
      lowerIsBetter: false,
      label: 'Relevant docs found',
      improvement: '3× recall',
    },
    takeaways: [
      'Bridge the user-vs-corpus vocabulary gap.',
      'Search semantic + lexical variants together.',
      'Fuse and de-duplicate for richer context.',
    ],
    realWorld: 'A vague question retrieves the exact technical docs it never named.',
  },
  {
    id: 'sharded-retrieval',
    num: 11,
    title: 'Sharded & Scattered Retrieval',
    category: 'retrieval',
    tagline: 'Scale the index',
    problem:
      'One giant vector store becomes a bottleneck as the corpus grows to millions of docs — slow to search and unwieldy to update.',
    solution:
      'Partition the knowledge base into smaller domain shards. Scatter the query to all shards in parallel and gather the results — precise and stable as you scale.',
    archetype: 'fanout',
    source: 'Query',
    sink: 'Gather',
    branches: [
      { label: 'Eng Shard', t: 3 },
      { label: 'Mkt Shard', t: 3 },
    ],
    stat: {
      before: 6.9,
      after: 5,
      unit: 's',
      lowerIsBetter: true,
      label: 'Retrieval time',
      improvement: '28% faster + more precise',
    },
    takeaways: [
      'Smaller indexes search faster.',
      'Domain isolation prevents context pollution.',
      'Latency stays flat as the corpus grows.',
    ],
    realWorld: 'Engineering and marketing shards each answer the half they own.',
  },
  {
    id: 'hybrid-search',
    num: 12,
    title: 'Parallel Hybrid Search',
    category: 'retrieval',
    tagline: 'Best of both searches',
    problem:
      'Vector search understands meaning but misses exact terms; keyword search nails identifiers but ignores concepts. Either one alone leaves gaps.',
    solution:
      'Run vector search and keyword search at the same time and fuse their unique hits, so the context covers both the concept and the exact code.',
    archetype: 'fanout',
    source: 'Query',
    sink: 'Fuse',
    branches: [
      { label: 'Vector', t: 3 },
      { label: 'Keyword', t: 3 },
    ],
    stat: {
      before: 50,
      after: 100,
      unit: '%',
      lowerIsBetter: false,
      label: 'Answer coverage',
      improvement: 'Both halves answered',
    },
    takeaways: [
      'Semantic + lexical search are complementary.',
      'Run them in parallel and fuse the hits.',
      'Great for prose mixed with codes / IDs.',
    ],
    realWorld: 'Answers "our power-saving strategy" *and* error code ERR_THROTTLE_900.',
  },
  {
    id: 'context-preprocessing',
    num: 13,
    title: 'Parallel Context Pre-processing',
    category: 'retrieval',
    tagline: 'Distill the context',
    problem:
      'Stuffing many retrieved docs into the prompt is slow, expensive and hurts accuracy — the model gets "lost in the middle" of noisy context.',
    solution:
      'After a high-recall retrieval, run a small parallel LLM filter on each document. Keep only the relevant ones, sending a tiny, focused context to the generator.',
    archetype: 'fanout',
    source: 'Retrieve',
    sink: 'Generate',
    branches: [
      { label: 'Filter 1', t: 2 },
      { label: 'Filter 2', t: 2 },
      { label: 'Filter 3', t: 2 },
      { label: 'Filter 4', t: 2 },
    ],
    stat: {
      before: 284,
      after: 29,
      unit: ' tokens',
      lowerIsBetter: true,
      label: 'Context size',
      improvement: '-90% tokens, -73% latency',
    },
    takeaways: [
      'Filter each doc in parallel for relevance.',
      'Distilling 10 docs ≈ the time to check one.',
      'Less noise → cheaper, faster, more accurate.',
    ],
    realWorld: 'Drops the older-product doc so the answer stays precise and cheap.',
  },
  {
    id: 'multi-hop-retrieval',
    num: 14,
    title: 'Multi-Hop Retrieval',
    category: 'retrieval',
    tagline: 'Deep, comparative reasoning',
    problem:
      'Comparative questions ("compare A and B") cannot be answered by one search — the evidence lives in separate documents.',
    solution:
      'A meta-agent decomposes the query into independent sub-questions, dispatches a parallel RAG agent for each, then synthesises the gathered answers into one.',
    archetype: 'fanout',
    source: 'Decompose',
    sink: 'Synthesize',
    branches: [
      { label: 'Sub-Q A', t: 4 },
      { label: 'Sub-Q B', t: 4 },
    ],
    stat: {
      before: 50,
      after: 100,
      unit: '%',
      lowerIsBetter: false,
      label: 'Question coverage',
      improvement: 'Full comparison answered',
    },
    takeaways: [
      'Decompose complex queries into sub-questions.',
      'Answer each with its own parallel RAG agent.',
      'Synthesise the pieces into one answer.',
    ],
    realWorld: 'Compares two chips by researching each one independently, then merging.',
  },
];
