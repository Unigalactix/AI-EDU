/**
 * EmbeddingsDemo — type a query and watch it get scored against every document
 * by cosine similarity, sorted best-first. Teaches vectors, similarity and
 * top-k retrieval (the "R" in RAG).
 */
import { useEffect, useState } from 'preact/hooks';
import { loadCorpus, fakeEmbed, cosineSimilarity, type Doc } from '@lib/js';
import { DemoShell, Field } from './DemoShell';

interface Props {
  dataset: string;
  base: string;
}

export default function EmbeddingsDemo({ dataset, base }: Props) {
  const [corpus, setCorpus] = useState<Doc[]>([]);
  const [query, setQuery] = useState('how does retrieval work');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCorpus(dataset, base).then(setCorpus).catch((e) => setError(String(e)));
  }, [dataset, base]);

  const q = fakeEmbed(query);
  const scored = corpus
    .map((doc) => ({ doc, score: cosineSimilarity(q, fakeEmbed(`${doc.title} ${doc.text}`)) }))
    .sort((a, b) => b.score - a.score);
  const max = scored[0]?.score || 1;

  return (
    <DemoShell title="Semantic search (vector similarity)">
      {error && <p style="color: var(--warn)">{error}</p>}
      <Field label="Query">
        <input type="text" value={query} onInput={(e) => setQuery((e.target as HTMLInputElement).value)} />
      </Field>
      <p style="font-size:0.85rem; color:var(--text-dim);">
        Each document is embedded into a {64}-dim vector; bars show cosine similarity to your query.
      </p>
      <ul style="list-style:none; padding:0; margin:0.5rem 0 0; display:grid; gap:0.6rem;">
        {scored.map(({ doc, score }, i) => (
          <li>
            <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
              <span><strong>{i + 1}.</strong> {doc.title}</span>
              <span style="font-family:var(--mono); color:var(--accent);">{score.toFixed(3)}</span>
            </div>
            <div class="sim-bar"><span style={`width:${Math.max(2, (score / max) * 100)}%`} /></div>
          </li>
        ))}
      </ul>
    </DemoShell>
  );
}
