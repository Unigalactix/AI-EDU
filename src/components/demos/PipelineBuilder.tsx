/**
 * PipelineBuilder — a drag-and-drop puzzle: reorder the shuffled RAG steps into
 * the correct sequence, then check your answer. Correct steps glow green; on a
 * perfect order the pipeline lights up end-to-end. Pure client-side.
 */
import { useMemo, useState } from 'preact/hooks';
import { PIPELINE_STEPS, type PuzzleStep } from '../../data/pipelinePuzzle';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PipelineBuilder() {
  const [items, setItems] = useState<PuzzleStep[]>(() => {
    // Ensure the initial shuffle isn't already correct.
    let s = shuffle(PIPELINE_STEPS);
    if (s.every((x, i) => x.order === i)) s = shuffle(PIPELINE_STEPS);
    return s;
  });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const solved = useMemo(() => items.every((x, i) => x.order === i), [items]);

  function move(from: number, to: number) {
    if (from === to) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setChecked(false);
  }

  function onDrop(target: number) {
    if (dragIndex !== null) move(dragIndex, target);
    setDragIndex(null);
    setOverIndex(null);
  }

  function nudge(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    move(index, to);
  }

  return (
    <div class="pb">
      <div class="pb-bar">
        <button class="btn" type="button" onClick={() => setChecked(true)}>
          Check order
        </button>
        <button class="btn secondary" type="button" onClick={() => { setItems(shuffle(PIPELINE_STEPS)); setChecked(false); }}>
          Shuffle
        </button>
        {checked && (
          <span class={`pb-result ${solved ? 'ok' : 'no'}`}>
            {solved ? '✓ Correct — that’s the RAG flow!' : '✕ Not quite — keep dragging.'}
          </span>
        )}
      </div>

      <ol class="pb-list">
        {items.map((step, i) => {
          const correctHere = checked && step.order === i;
          const wrongHere = checked && step.order !== i;
          return (
            <li
              class={`pb-item ${dragIndex === i ? 'dragging' : ''} ${overIndex === i ? 'over' : ''} ${correctHere ? 'correct' : ''} ${wrongHere ? 'wrong' : ''} ${solved ? 'solved' : ''}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnter={() => setOverIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
            >
              <span class="pb-grip" aria-hidden="true">⋮⋮</span>
              <span class="pb-num">{i + 1}</span>
              <span class="pb-icon" aria-hidden="true">{step.icon}</span>
              <span class="pb-text">
                <span class="pb-label">{step.label}</span>
                <span class="pb-hint">{step.hint}</span>
              </span>
              <span class="pb-arrows">
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => nudge(i, -1)}>▲</button>
                <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => nudge(i, 1)}>▼</button>
              </span>
            </li>
          );
        })}
      </ol>

      <p class="pb-tip">Drag the cards (or use ▲▼) so data flows top-to-bottom in the order a RAG system runs.</p>

      <style>{`
        .pb { border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-elev); padding: 1.25rem; }
        .pb-bar { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .pb-result { font-weight: 700; font-size: 0.92rem; }
        .pb-result.ok { color: var(--good); }
        .pb-result.no { color: var(--warn); }
        .pb-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
        .pb-item {
          display: flex; align-items: center; gap: 0.75rem;
          background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
          padding: 0.7rem 0.85rem; cursor: grab; user-select: none;
        }
        .pb-item.dragging { opacity: 0.45; }
        .pb-item.over { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent) inset; }
        .pb-item.correct { border-color: var(--good); background: color-mix(in srgb, var(--good) 10%, var(--bg)); }
        .pb-item.wrong { border-color: var(--warn); background: color-mix(in srgb, var(--warn) 9%, var(--bg)); }
        .pb-item.solved { border-color: var(--good); }
        .pb-grip { color: var(--text-dim); cursor: grab; letter-spacing: -2px; }
        .pb-num { flex: none; width: 24px; height: 24px; border-radius: 50%; background: var(--bg-elev-2); border: 1px solid var(--border); display: inline-flex; align-items: center; justify-content: center; font-family: var(--mono); font-weight: 700; font-size: 0.8rem; }
        .pb-icon { font-size: 1.15rem; }
        .pb-text { display: flex; flex-direction: column; flex: 1; }
        .pb-label { font-weight: 600; }
        .pb-hint { font-size: 0.82rem; color: var(--text-dim); }
        .pb-arrows { display: flex; flex-direction: column; gap: 2px; }
        .pb-arrows button {
          background: var(--bg-elev-2); border: 1px solid var(--border); color: var(--text-dim);
          width: 24px; height: 18px; line-height: 1; border-radius: 4px; cursor: pointer; font-size: 0.6rem;
        }
        .pb-arrows button:disabled { opacity: 0.35; cursor: default; }
        .pb-tip { color: var(--text-dim); font-size: 0.85rem; margin: 1rem 0 0; }
      `}</style>
    </div>
  );
}
