/**
 * The 18 RAG techniques benchmarked in "Testing 18 RAG Techniques to Find the
 * Best" (Fareed Khan). Data powers the interactive `RagLab` learning graphic:
 * an animated RAG pipeline per technique + a score leaderboard.
 *
 * Scores are the evaluation values from the article (0–1, judged against one
 * complex test query). The baseline to beat is Simple RAG at 0.50. They are
 * teaching signals — relative ordering matters more than the absolute number.
 */

export type RagCategory = 'chunking' | 'query' | 'ranking' | 'adaptive' | 'structure';

export interface RagStage {
  label: string;
  /** base = standard pipeline stage · new = the technique's signature addition · decision = a branching judgement. */
  kind: 'base' | 'new' | 'decision';
}

export interface RagTechnique {
  id: string;
  num: number;
  title: string;
  category: RagCategory;
  /** Benchmark score from the article (0–1). */
  score: number;
  tagline: string;
  problem: string;
  technique: string;
  /** Left→right pipeline stages used for the animated diagram. */
  stages: RagStage[];
  /** Parallel paths or decision options drawn under the highlighted stage. */
  branches?: string[];
  takeaways: string[];
  whenToUse: string;
}

/** Simple RAG baseline that every other technique is measured against. */
export const BASELINE = 0.5;

export const RAG_CATEGORIES: Record<RagCategory, { label: string; blurb: string }> = {
  chunking: {
    label: 'Indexing & chunking',
    blurb: 'Prepare the knowledge base so the right context is even findable.',
  },
  query: {
    label: 'Query-side strategies',
    blurb: 'Reshape the question before it ever hits the index.',
  },
  ranking: {
    label: 'Retrieval & ranking',
    blurb: 'Refine, reorder and trim what comes back from search.',
  },
  adaptive: {
    label: 'Adaptive & self-correcting',
    blurb: 'Let the system reason about how (and whether) to retrieve.',
  },
  structure: {
    label: 'Knowledge structure & modality',
    blurb: 'Capture relationships and non-text information.',
  },
};

export const RAG_TECHNIQUES: RagTechnique[] = [
  {
    id: 'simple-rag',
    num: 1,
    title: 'Simple RAG',
    category: 'chunking',
    score: 0.5,
    tagline: 'The baseline',
    problem:
      'You need an LLM to answer from your own documents instead of its frozen training data.',
    technique:
      'Split the document into fixed-size overlapping chunks, embed them, retrieve the top-k most similar to the query, and stuff them into the prompt.',
    stages: [
      { label: 'Chunk', kind: 'base' },
      { label: 'Embed', kind: 'base' },
      { label: 'Retrieve', kind: 'base' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Every RAG system starts here.',
      'Fixed chunks are crude — they split mid-thought.',
      'A baseline to measure everything else against.',
    ],
    whenToUse: 'A first prototype, or small clean corpora where naïve chunks are good enough.',
  },
  {
    id: 'semantic-chunking',
    num: 2,
    title: 'Semantic Chunking',
    category: 'chunking',
    score: 0.1,
    tagline: 'Split on meaning',
    problem:
      'Fixed-size chunks cut sentences in half and glue unrelated ideas together.',
    technique:
      'Embed sentences, measure similarity between neighbours, and start a new chunk wherever similarity drops sharply — so each chunk is one coherent idea.',
    stages: [
      { label: 'Semantic split', kind: 'new' },
      { label: 'Embed', kind: 'base' },
      { label: 'Retrieve', kind: 'base' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Splits where the topic actually changes.',
      'Sounds smart, but scored *worst* here.',
      'Changing chunking alone is not a guaranteed win.',
    ],
    whenToUse: 'Documents with abrupt topic shifts — but always benchmark, it can backfire.',
  },
  {
    id: 'context-enriched',
    num: 3,
    title: 'Context-Enriched Retrieval',
    category: 'chunking',
    score: 0.2,
    tagline: 'Grab the neighbours',
    problem:
      'A single best-matching chunk is often too narrow and misses surrounding context.',
    technique:
      'After finding the top chunk, also include the chunks immediately before and after it, so the LLM sees a coherent window instead of an isolated fragment.',
    stages: [
      { label: 'Chunk', kind: 'base' },
      { label: 'Embed', kind: 'base' },
      { label: 'Retrieve + neighbours', kind: 'new' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Adds a window of context around the best hit.',
      'Neighbours can also add noise — tune the window.',
      'Cheap to implement on top of Simple RAG.',
    ],
    whenToUse: 'When answers depend on flow across adjacent passages.',
  },
  {
    id: 'contextual-chunk-headers',
    num: 4,
    title: 'Contextual Chunk Headers',
    category: 'chunking',
    score: 0.6,
    tagline: 'Prepend a summary',
    problem:
      'A chunk pulled out of context loses the section/topic it belonged to.',
    technique:
      'Before embedding, generate a short descriptive header for each chunk and prepend it. The retriever can now match on both the high-level topic and the detail.',
    stages: [
      { label: 'Chunk', kind: 'base' },
      { label: '+ Header', kind: 'new' },
      { label: 'Embed', kind: 'base' },
      { label: 'Retrieve', kind: 'base' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Each chunk carries a mini-summary of itself.',
      'Beat Simple RAG — context in the data pays off.',
      'Augment the data before it enters the index.',
    ],
    whenToUse: 'Structured docs with clear sections and headings.',
  },
  {
    id: 'document-augmentation',
    num: 5,
    title: 'Document Augmentation',
    category: 'chunking',
    score: 0.5,
    tagline: 'Index the questions',
    problem:
      'A chunk is phrased as a statement, but users search with questions — a vocabulary mismatch.',
    technique:
      'For each chunk, have an LLM generate the questions it could answer, embed those too, and add them to the index as alternative entry points.',
    stages: [
      { label: 'Chunk', kind: 'base' },
      { label: 'Gen questions', kind: 'new' },
      { label: 'Embed', kind: 'base' },
      { label: 'Retrieve', kind: 'base' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Sometimes a question matches intent better than the text.',
      'Grows the index but adds query-shaped anchors.',
      'A form of pre-computing likely searches.',
    ],
    whenToUse: 'FAQ-style knowledge bases and support content.',
  },
  {
    id: 'hierarchical-indices',
    num: 14,
    title: 'Hierarchical Indices',
    category: 'chunking',
    score: 0.84,
    tagline: 'Summaries then details',
    problem:
      'Small chunks are precise but lose context; large chunks keep context but retrieve loosely.',
    technique:
      'Build two indexes: section summaries and detailed chunks. Search summaries first to pick the right sections, then search detailed chunks only within them.',
    stages: [
      { label: 'Summaries', kind: 'new' },
      { label: 'Search summaries', kind: 'new' },
      { label: 'Search chunks', kind: 'base' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Speed of summaries + precision of small chunks.',
      'Knows which section each chunk came from.',
      'One of the top performers in the benchmark.',
    ],
    whenToUse: 'Large, well-structured documents and manuals.',
  },
  {
    id: 'query-transformation',
    num: 6,
    title: 'Query Transformation',
    category: 'query',
    score: 0.5,
    tagline: 'Rewrite the question',
    problem:
      'The way a user phrases a question is rarely the best way to search the index.',
    technique:
      'Reshape the query before searching: rewrite it to be more specific, step back to a broader question for background, or decompose it into simpler sub-queries.',
    stages: [
      { label: 'Query', kind: 'base' },
      { label: 'Transform', kind: 'new' },
      { label: 'Retrieve', kind: 'base' },
      { label: 'Generate', kind: 'base' },
    ],
    branches: ['Rewrite', 'Step-back', 'Sub-queries'],
    takeaways: [
      'Three flavours: rewrite, step-back, decompose.',
      'Powerful, but a well-formed query needs no fixing.',
      '"Improving" a good query can hurt.',
    ],
    whenToUse: 'Vague, broad or multi-part questions.',
  },
  {
    id: 'hyde',
    num: 15,
    title: 'HyDE',
    category: 'query',
    score: 0.5,
    tagline: 'Embed a fake answer',
    problem:
      'A short query is a thin semantic signal compared to the documents you search.',
    technique:
      'Ask the LLM to write a hypothetical document that *would* answer the query, embed that rich text, and retrieve real chunks similar to it.',
    stages: [
      { label: 'Query', kind: 'base' },
      { label: 'Gen fake doc', kind: 'new' },
      { label: 'Embed doc', kind: 'new' },
      { label: 'Retrieve', kind: 'base' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'A full document is a richer query than a sentence.',
      'Risk: the fake doc drifts from your real corpus.',
      'No single technique wins every query.',
    ],
    whenToUse: 'Short queries over rich, prose-heavy corpora.',
  },
  {
    id: 'reranker',
    num: 7,
    title: 'Re-Ranker',
    category: 'ranking',
    score: 0.7,
    tagline: 'Reorder the hits',
    problem:
      'Vector similarity returns a mix of relevant and irrelevant chunks in a so-so order.',
    technique:
      'Over-retrieve (e.g. top-10), then use an LLM to score each chunk for true relevance and reorder, keeping only the best few for generation.',
    stages: [
      { label: 'Retrieve k=10', kind: 'base' },
      { label: 'LLM rerank', kind: 'new' },
      { label: 'Top 3', kind: 'base' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'A precise second pass over a wide first pass.',
      'Puts the most useful chunk first.',
      'Reliable, general-purpose quality boost.',
    ],
    whenToUse: 'Almost always — a strong default upgrade.',
  },
  {
    id: 'rse',
    num: 8,
    title: 'Relevant Segment Extraction',
    category: 'ranking',
    score: 0.8,
    tagline: 'Extract whole segments',
    problem:
      'The answer is often spread across several consecutive chunks, not one.',
    technique:
      'Score chunks by relevance *and* position, then use an algorithm to find the best contiguous segments of text and feed those coherent runs to the LLM.',
    stages: [
      { label: 'Chunk', kind: 'base' },
      { label: 'Embed', kind: 'base' },
      { label: 'Best segments', kind: 'new' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Reconstructs continuous, coherent passages.',
      'How you present context matters as much as what.',
      'Strong score from better-structured context.',
    ],
    whenToUse: 'Narrative or explanatory docs where ideas span pages.',
  },
  {
    id: 'contextual-compression',
    num: 9,
    title: 'Contextual Compression',
    category: 'ranking',
    score: 0.7,
    tagline: 'Trim the noise',
    problem:
      'Stuffing the context window with loosely-relevant text dilutes the answer and costs tokens.',
    technique:
      'Retrieve broadly, then compress each chunk — keep only the sentences directly relevant to the query — before sending a tight context to the LLM.',
    stages: [
      { label: 'Retrieve k=10', kind: 'base' },
      { label: 'Compress', kind: 'new' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Broad recall, then ruthless focus.',
      'Less noise → cheaper and often more accurate.',
      'Avoids "lost in the middle" failures.',
    ],
    whenToUse: 'Long retrieved passages with low signal-to-noise.',
  },
  {
    id: 'fusion',
    num: 16,
    title: 'Fusion RAG',
    category: 'ranking',
    score: 0.83,
    tagline: 'Vector + keyword',
    problem:
      'Vector search nails meaning but misses exact terms; keyword search does the opposite.',
    technique:
      'Run semantic (vector) and lexical (BM25) search in parallel, normalise and combine their scores into one ranking that captures both meaning and exact matches.',
    stages: [
      { label: 'Query', kind: 'base' },
      { label: 'Vector + BM25', kind: 'new' },
      { label: 'Fuse scores', kind: 'new' },
      { label: 'Generate', kind: 'base' },
    ],
    branches: ['Vector', 'BM25'],
    takeaways: [
      'Two retrievers, one combined ranking.',
      'Great when prose mixes with codes / IDs.',
      'Consistently one of the top techniques.',
    ],
    whenToUse: 'Mixed content: natural language plus exact identifiers.',
  },
  {
    id: 'feedback-loop',
    num: 10,
    title: 'Feedback Loop',
    category: 'adaptive',
    score: 0.7,
    tagline: 'Learn from users',
    problem:
      'Static RAG never learns — it repeats the same retrieval mistakes forever.',
    technique:
      'Collect user ratings on answers, store them, and use that feedback to boost or demote documents in future retrievals — the system improves with use.',
    stages: [
      { label: 'Retrieve', kind: 'base' },
      { label: 'Generate', kind: 'base' },
      { label: 'Collect feedback', kind: 'new' },
      { label: 'Re-weight index', kind: 'new' },
    ],
    takeaways: [
      'Turns usage into a training signal.',
      'Gains compound over many interactions.',
      'Personalises to your real query mix.',
    ],
    whenToUse: 'Long-lived systems with repeat users and feedback.',
  },
  {
    id: 'adaptive-rag',
    num: 11,
    title: 'Adaptive RAG',
    category: 'adaptive',
    score: 0.86,
    tagline: 'Pick the strategy',
    problem:
      'No single retrieval strategy is best for every kind of question.',
    technique:
      'First classify the query (factual, analytical, opinion, contextual), then dispatch a specialised retrieval strategy tuned for that type.',
    stages: [
      { label: 'Query', kind: 'base' },
      { label: 'Classify', kind: 'decision' },
      { label: 'Strategy', kind: 'new' },
      { label: 'Retrieve', kind: 'base' },
      { label: 'Generate', kind: 'base' },
    ],
    branches: ['Factual', 'Analytical', 'Opinion', 'Contextual'],
    takeaways: [
      'Matches the method to the question type.',
      'The clear winner of the benchmark (0.86).',
      'Flexibility beats any one-size-fits-all pipeline.',
    ],
    whenToUse: 'Production systems facing diverse query types.',
  },
  {
    id: 'self-rag',
    num: 12,
    title: 'Self-RAG',
    category: 'adaptive',
    score: 0.65,
    tagline: 'Reflect & decide',
    problem:
      'Standard RAG always retrieves — even when it should not — and never checks the result.',
    technique:
      'The model emits reflection tokens to decide whether to retrieve, judge each document\u2019s relevance, and rate how well its answer is supported.',
    stages: [
      { label: 'Query', kind: 'base' },
      { label: 'Retrieve?', kind: 'decision' },
      { label: 'Retrieve', kind: 'base' },
      { label: 'Reflect', kind: 'new' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Can skip retrieval when it already knows.',
      'Filters irrelevant docs before answering.',
      'Powerful idea, complex to implement fully.',
    ],
    whenToUse: 'Mixed workloads of common-knowledge and niche queries.',
  },
  {
    id: 'crag',
    num: 18,
    title: 'Corrective RAG (CRAG)',
    category: 'adaptive',
    score: 0.824,
    tagline: 'Detect & recover',
    problem:
      'If retrieval returns irrelevant or incomplete docs, the answer is doomed.',
    technique:
      'After retrieval, grade relevance. High → use the docs; low → fall back to web search; medium → combine both. It actively corrects bad retrieval.',
    stages: [
      { label: 'Retrieve', kind: 'base' },
      { label: 'Grade relevance', kind: 'decision' },
      { label: 'Web fallback', kind: 'new' },
      { label: 'Generate', kind: 'base' },
    ],
    branches: ['Use docs', 'Web search', 'Combine'],
    takeaways: [
      'Checks its own retrieval before answering.',
      'Web fallback rescues weak local results.',
      'Self-correcting → robust and trustworthy.',
    ],
    whenToUse: 'Open-domain questions where the corpus may fall short.',
  },
  {
    id: 'knowledge-graph',
    num: 13,
    title: 'Knowledge Graph (Graph RAG)',
    category: 'structure',
    score: 0.78,
    tagline: 'Connect the concepts',
    problem:
      'Treating chunks as independent islands loses the relationships between ideas.',
    technique:
      'Build a graph where nodes are chunks/concepts and edges are shared concepts. Traverse it to pull in indirectly-related context, not just direct matches.',
    stages: [
      { label: 'Chunk', kind: 'base' },
      { label: 'Build graph', kind: 'new' },
      { label: 'Traverse', kind: 'new' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Finds context via relationships, not just similarity.',
      'Great for multi-concept, connected questions.',
      'Surfaces links a flat index would miss.',
    ],
    whenToUse: 'Interconnected domains: research, wikis, entity-rich data.',
  },
  {
    id: 'multi-modal',
    num: 17,
    title: 'Multi-Modal RAG',
    category: 'structure',
    score: 0.79,
    tagline: 'See the images',
    problem:
      'Crucial information often lives in charts, diagrams and images — invisible to text-only RAG.',
    technique:
      'Extract both text and images, caption the images with a vision model, embed both, and retrieve across text and visuals together.',
    stages: [
      { label: 'Extract text + images', kind: 'new' },
      { label: 'Caption images', kind: 'new' },
      { label: 'Embed both', kind: 'base' },
      { label: 'Retrieve', kind: 'base' },
      { label: 'Generate', kind: 'base' },
    ],
    takeaways: [
      'Unlocks information trapped in figures.',
      'Only as good as the image captions.',
      'Essential for diagram-heavy documents.',
    ],
    whenToUse: 'Papers, reports and manuals rich in figures and charts.',
  },
];
