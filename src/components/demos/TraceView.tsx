/** Renders a pipeline trace as a readable timeline. */
import type { TraceStep, RetrievalHit } from '@lib/js';

const KIND_ICON: Record<string, string> = {
  think: '💭',
  plan: '🗺️',
  retrieve: '🔎',
  tool: '🛠️',
  answer: '✅',
  route: '🚦',
  critique: '⚖️',
};

function Hits({ hits }: { hits: RetrievalHit[] }) {
  return (
    <ul class="trace-hits">
      {hits.map((h) => (
        <li>
          <span class="score">{h.score.toFixed(3)}</span>
          <span class="title">{h.doc.title}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TraceView({ trace }: { trace: TraceStep[] }) {
  if (!trace.length) return null;
  return (
    <ol class="trace">
      {trace.map((s) => (
        <li class="trace-step">
          <span class="trace-icon" title={s.kind}>{KIND_ICON[s.kind] ?? '•'}</span>
          <div class="trace-body">
            <div class="trace-head">
              <strong>{s.actor}</strong>
              <span class="trace-kind">{s.kind}</span>
            </div>
            <div class="trace-detail">{s.detail}</div>
            {Array.isArray(s.data) && (s.data as RetrievalHit[])[0]?.doc && (
              <Hits hits={s.data as RetrievalHit[]} />
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
