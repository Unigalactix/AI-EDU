/**
 * Glossary terms — plain-language definitions of the vocabulary used across the
 * site. Surfaced on /glossary with live filtering. Keep definitions short and
 * jargon-light; link the deeper material from the relevant project/note.
 */

export interface Term {
  term: string;
  short: string;
  category: 'core' | 'retrieval' | 'agents' | 'models';
}

export const GLOSSARY: Term[] = [
  { term: 'LLM (Large Language Model)', short: 'A neural network trained to predict the next token, producing human-like text.', category: 'models' },
  { term: 'Token', short: 'A chunk of text (word piece) the model reads and generates one at a time.', category: 'models' },
  { term: 'Context window', short: 'The maximum number of tokens a model can consider at once — its working memory.', category: 'models' },
  { term: 'Temperature', short: 'A sampling knob: low = focused/deterministic, high = creative/varied output.', category: 'models' },
  { term: 'System prompt', short: 'Instructions that set persona, rules and tone for the whole conversation.', category: 'core' },
  { term: 'Prompt engineering', short: 'Designing inputs (instructions, examples, context) to steer model behaviour.', category: 'core' },
  { term: 'Few-shot prompting', short: 'Giving the model a handful of examples in the prompt to demonstrate the task.', category: 'core' },
  { term: 'Grounding', short: 'Answering from supplied source material instead of the model’s memory, to cut hallucination.', category: 'core' },
  { term: 'Hallucination', short: 'A confident but false or unsupported statement from the model.', category: 'core' },
  { term: 'Embedding', short: 'A vector representation of text where similar meanings sit close together.', category: 'retrieval' },
  { term: 'Cosine similarity', short: 'A score for how aligned two vectors are — used to rank documents by relevance.', category: 'retrieval' },
  { term: 'Vector database', short: 'A store that indexes embeddings for fast nearest-neighbour (similarity) search.', category: 'retrieval' },
  { term: 'Chunking', short: 'Splitting documents into passages so retrieval can return focused, relevant pieces.', category: 'retrieval' },
  { term: 'Top-k retrieval', short: 'Keeping the k most similar chunks to the query as candidate context.', category: 'retrieval' },
  { term: 'RAG', short: 'Retrieval-Augmented Generation: retrieve relevant chunks, then generate a grounded answer.', category: 'retrieval' },
  { term: 'Re-ranker', short: 'A second-stage model that re-orders retrieved chunks by true relevance.', category: 'retrieval' },
  { term: 'HyDE', short: 'Hypothetical Document Embeddings: embed a drafted answer to improve retrieval.', category: 'retrieval' },
  { term: 'Agent', short: 'An LLM in a loop that can use tools, observe results, and decide the next step.', category: 'agents' },
  { term: 'Tool / function calling', short: 'The model emitting a structured request to run external code or APIs.', category: 'agents' },
  { term: 'Agentic RAG', short: 'RAG wrapped in a reasoning loop that judges relevance and retries retrieval.', category: 'agents' },
  { term: 'Multi-agent system', short: 'Several specialised agents (e.g. researcher, writer) that hand off to each other.', category: 'agents' },
  { term: 'Orchestrator', short: 'A manager agent that plans a task and delegates sub-tasks to workers.', category: 'agents' },
];

export const GLOSSARY_CATEGORIES: Record<Term['category'], string> = {
  core: 'Core concepts',
  models: 'Models & generation',
  retrieval: 'Retrieval & RAG',
  agents: 'Agents',
};
