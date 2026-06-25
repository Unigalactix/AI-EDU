/**
 * ParamSandbox — a hands-on retrieval tuner. Type a query and adjust k and the
 * similarity threshold to watch which documents get retrieved in real time.
 * Teaches the recall-vs-noise trade-off behind the "R" in RAG. Fully offline:
 * uses the same deterministic embeddings as the rest of the site.
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { loadCorpus, fakeEmbed, cosineSimilarity, type Doc } from '@lib/js';

interface Props {
  dataset: string;
  base: string;
}

export default function ParamSandbox({ dataset, base }: Props) {
  const [corpus, setCorpus] = useState<Doc[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('how does retrieval grounding work');
  const [k, setK] = useState(3);
  const [threshold, setThreshold] = useState(0.0);

  useEffect(() => {
    loadCorpus(dataset, base).then(setCorpus).catch((e) => setError(String(e)));
  }, [dataset, base]);

  const scored = useMemo(() => {
    const q = fakeEmbed(query);
    return corpus
      .map((doc) => ({ doc, score: cosineSimilarity(q, fakeEmbed(`${doc.title} ${doc.text}`)) }))
      .sort((a, b) => b.score - a.score);
  }, [corpus, query]);

  const max = scored[0]?.score || 1;
  // A doc is "retrieved" if it's in the top-k AND clears the threshold.
  const retrievedCount = scored.slice(0, k).filter((s) => s.score >= threshold).length;

  return (
    <div class="sb">
      {error && <p style="color: var(--warn)">{error}</p>}

      <label class="sb-field">
        <span>Query</span>
        <input
          type="text"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        />
      </label>

      <div class="sb-controls">
        <label class="sb-slider">
          <span>top-k: <strong>{k}</strong></span>
          <input type="range" min={1} max={Math.max(1, scored.length)} value={k} onInput={(e) => setK(Number((e.target as HTMLInputElement).value))} />
          <small>How many chunks to keep. Higher = more recall, more noise.</small>
        </label>
        <label class="sb-slider">
          <span>threshold: <strong>{threshold.toFixed(2)}</strong></span>
          <input type="range" min={0} max={1} step={0.01} value={threshold} onInput={(e) => setThreshold(Number((e.target as HTMLInputElement).value))} />
          <small>Drop chunks below this similarity. Higher = stricter, less noise.</small>
        </label>
      </div>

      <p class="sb-summary">
        Retrieving <strong>{retrievedCount}</strong> of {scored.length} documents
        {retrievedCount === 0 && <span class="sb-warn"> — nothing clears your filters; the model would have no context!</span>}
      </p>

      <ul class="sb-list">
        {scored.map(({ doc, score }, i) => {
          const inTopK = i < k;
          const passes = inTopK && score >= threshold;
          return (
            <li class={`sb-row ${passes ? 'on' : 'off'}`}>
              <div class="sb-rowtop">
                <span><strong>{i + 1}.</strong> {doc.title}</span>
                <span class="sb-score">{score.toFixed(3)}</span>
              </div>
              <div class="sb-bar">
                <span style={`width:${Math.max(2, (score / max) * 100)}%`} />
              </div>
              <span class={`sb-tag ${passes ? 'kept' : !inTopK ? 'cut-k' : 'cut-t'}`}>
                {passes ? 'retrieved' : !inTopK ? `below top-${k}` : 'below threshold'}
              </span>
            </li>
          );
        })}
      </ul>

      <style>{`
        .sb { border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-elev); padding: 1.25rem; }
        .sb-field { display: block; margin-bottom: 1rem; }
        .sb-field span { display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.3rem; }
        .sb-field input { width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 0.55rem 0.7rem; font-size: 0.95rem; }
        .sb-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1rem; }
        @media (max-width: 560px) { .sb-controls { grid-template-columns: 1fr; } }
        .sb-slider span { font-size: 0.9rem; }
        .sb-slider input[type=range] { width: 100%; accent-color: var(--accent); margin: 0.35rem 0; }
        .sb-slider small { display: block; color: var(--text-dim); font-size: 0.78rem; }
        .sb-summary { font-size: 0.95rem; margin: 0 0 0.75rem; }
        .sb-warn { color: var(--warn); }
        .sb-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.6rem; }
        .sb-row { border: 1px solid var(--border); border-radius: 8px; padding: 0.6rem 0.75rem; background: var(--bg); transition: opacity 0.2s; }
        .sb-row.off { opacity: 0.5; }
        .sb-row.on { border-color: var(--good); }
        .sb-rowtop { display: flex; justify-content: space-between; font-size: 0.92rem; }
        .sb-score { font-family: var(--mono); color: var(--accent); }
        .sb-bar { height: 7px; border-radius: 999px; background: var(--bg-elev-2); overflow: hidden; margin: 0.4rem 0; }
        .sb-bar span { display: block; height: 100%; background: var(--accent); }
        .sb-tag { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
        .sb-tag.kept { color: var(--good); }
        .sb-tag.cut-k { color: var(--text-dim); }
        .sb-tag.cut-t { color: var(--warn); }
      `}</style>
    </div>
  );
}
