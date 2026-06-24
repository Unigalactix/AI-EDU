/**
 * PipelineDemo — drives the RAG / Agentic RAG / Multi-Agent / Agent-Teams demos.
 * Loads a static corpus, runs the chosen pipeline on a question, and shows the
 * grounded answer plus the full reasoning trace.
 */
import { useEffect, useState } from 'preact/hooks';
import {
  loadCorpus,
  ragPipeline,
  agenticRagPipeline,
  multiAgentPipeline,
  agentTeamsPipeline,
  type Doc,
  type RunResult,
} from '@lib/js';
import { DemoShell, Field } from './DemoShell';
import TraceView from './TraceView';

type Pipeline = 'rag' | 'agentic-rag' | 'multi-agent' | 'agent-teams';

const RUNNERS: Record<Pipeline, (q: string, c: Doc[]) => RunResult> = {
  rag: (q, c) => ragPipeline(q, c),
  'agentic-rag': (q, c) => agenticRagPipeline(q, c),
  'multi-agent': (q, c) => multiAgentPipeline(q, c),
  'agent-teams': (q, c) => agentTeamsPipeline(q, c),
};

const TITLES: Record<Pipeline, string> = {
  rag: 'RAG pipeline',
  'agentic-rag': 'Agentic RAG pipeline',
  'multi-agent': 'Multi-agent pipeline',
  'agent-teams': 'Agent teams pipeline',
};

interface Props {
  pipeline: Pipeline;
  dataset: string;
  base: string;
  examples?: string[];
}

export default function PipelineDemo({ pipeline, dataset, base, examples = [] }: Props) {
  const [corpus, setCorpus] = useState<Doc[]>([]);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState(examples[0] ?? 'What is retrieval augmented generation?');
  const [result, setResult] = useState<RunResult | null>(null);

  useEffect(() => {
    loadCorpus(dataset, base)
      .then(setCorpus)
      .catch((e) => setError(String(e)));
  }, [dataset, base]);

  function run(q: string = question) {
    if (!corpus.length) return;
    setResult(RUNNERS[pipeline](q, corpus));
  }

  return (
    <DemoShell title={TITLES[pipeline]}>
      {error && <p style="color: var(--warn)">{error}</p>}
      <Field label="Ask a question (answered only from the static corpus)">
        <textarea
          value={question}
          onInput={(e) => setQuestion((e.target as HTMLTextAreaElement).value)}
        />
      </Field>
      <div class="row">
        <button class="btn" onClick={() => run()} disabled={!corpus.length}>
          Run pipeline
        </button>
        <span class="chip">{corpus.length} docs loaded</span>
      </div>
      {examples.length > 0 && (
        <div class="examples">
          {examples.map((ex) => (
            <button
              onClick={() => {
                setQuestion(ex);
                run(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {result && (
        <>
          <div class="answer">
            <h5>Final answer</h5>
            <div>{result.answer}</div>
          </div>
          <h5 style="margin:1.2rem 0 0; color:var(--text-dim); font-size:0.78rem; text-transform:uppercase; letter-spacing:0.04em;">
            Reasoning trace
          </h5>
          <TraceView trace={result.trace} />
        </>
      )}
    </DemoShell>
  );
}
