/**
 * Knowledge-check questions, keyed by project slug. Each project page renders
 * its quiz at the bottom. Keep questions short and concept-focused — they
 * reinforce the "why", not trivia.
 */

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // index into options
  explain: string;
}

export const QUIZZES: Record<string, QuizQuestion[]> = {
  '01-prompting': [
    {
      q: 'What is the role of the system prompt?',
      options: [
        'It stores the model weights',
        'It sets persona, rules and tone for the whole conversation',
        'It is the user’s literal question',
        'It caches previous answers',
      ],
      answer: 1,
      explain:
        'The system prompt frames behaviour — persona, constraints, format — and applies across the whole exchange.',
    },
    {
      q: 'Why add grounding context to a prompt?',
      options: [
        'To make the model respond faster',
        'To reduce hallucination by giving the model real facts to answer from',
        'To bypass the context window limit',
        'To translate the prompt',
      ],
      answer: 1,
      explain: 'Grounding gives the model source material, so it answers from facts instead of guessing.',
    },
  ],
  '02-embeddings': [
    {
      q: 'What does cosine similarity measure here?',
      options: [
        'The number of shared characters',
        'The angle between two vectors — how aligned their meanings are',
        'The file size of a document',
        'The reading time of text',
      ],
      answer: 1,
      explain: 'Embeddings place text in vector space; cosine similarity scores how close two vectors point.',
    },
    {
      q: 'What does "top-k retrieval" return?',
      options: [
        'The k longest documents',
        'The k most similar documents to the query',
        'k random documents',
        'The first k documents in the file',
      ],
      answer: 1,
      explain: 'Retrieval ranks every doc by similarity and keeps the k highest — the candidates to read.',
    },
  ],
  '03-tools': [
    {
      q: 'In tool/function calling, who decides when to call a tool?',
      options: ['The user', 'A fixed cron job', 'The model', 'The database'],
      answer: 2,
      explain: 'The model inspects the request and emits a structured tool call when it needs external help.',
    },
    {
      q: 'What turns a single tool call into an "agent"?',
      options: [
        'A bigger model',
        'A loop: call a tool, read the result, decide the next step',
        'A faster GPU',
        'More training data',
      ],
      answer: 1,
      explain: 'Agency comes from the observe→decide→act loop, not from any single call.',
    },
  ],
  '04-rag': [
    {
      q: 'What are the three core steps of RAG?',
      options: [
        'Retrieve, augment, generate',
        'Compress, encrypt, send',
        'Train, validate, test',
        'Parse, compile, run',
      ],
      answer: 0,
      explain: 'RAG retrieves relevant chunks, augments the prompt with them, then generates a grounded answer.',
    },
    {
      q: 'Why does RAG make answers "updatable"?',
      options: [
        'You retrain the model nightly',
        'You change the documents, not the model weights',
        'It uses a faster sampler',
        'It ignores the context window',
      ],
      answer: 1,
      explain: 'Knowledge lives in the corpus, so updating docs updates answers — no retraining required.',
    },
  ],
  '05-agentic-rag': [
    {
      q: 'How does Agentic RAG differ from plain RAG?',
      options: [
        'It never retrieves',
        'It adds a reasoning loop: judge relevance, rewrite, retrieve again',
        'It only works offline',
        'It removes the generator',
      ],
      answer: 1,
      explain: 'Agentic RAG wraps retrieval in a loop that can critique and retry before answering.',
    },
  ],
  '06-multi-agent': [
    {
      q: 'What is the main benefit of splitting work across specialised agents?',
      options: [
        'It uses less memory',
        'Each agent focuses on one role, and they hand off for a better result',
        'It removes the need for prompts',
        'It guarantees correctness',
      ],
      answer: 1,
      explain: 'Specialisation + handoffs (researcher → analyst → writer) tackle complex tasks in focused steps.',
    },
  ],
  '07-agent-teams': [
    {
      q: 'What does an orchestrator/manager agent typically do?',
      options: [
        'Stores embeddings',
        'Plans the task and delegates sub-tasks to worker agents',
        'Replaces the retriever',
        'Renders the UI',
      ],
      answer: 1,
      explain: 'A manager decomposes the goal and coordinates workers, then assembles their outputs.',
    },
  ],
};
