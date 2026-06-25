/**
 * Data for the "Build the RAG pipeline" drag-and-drop puzzle. `order` is the
 * correct position (0-based). The component shuffles these and asks the learner
 * to drag them into the right sequence.
 */

export interface PuzzleStep {
  id: string;
  label: string;
  hint: string;
  icon: string;
  order: number;
}

export const PIPELINE_STEPS: PuzzleStep[] = [
  { id: 'question', label: 'User question', hint: 'The query that starts everything.', icon: '❓', order: 0 },
  { id: 'embed', label: 'Embed the query', hint: 'Turn the question into a vector.', icon: '🔢', order: 1 },
  { id: 'retrieve', label: 'Retrieve top-k chunks', hint: 'Find the most similar documents.', icon: '🔍', order: 2 },
  { id: 'augment', label: 'Augment the prompt', hint: 'Insert retrieved context into the prompt.', icon: '➕', order: 3 },
  { id: 'generate', label: 'Generate grounded answer', hint: 'The model answers from the context.', icon: '✍️', order: 4 },
];
