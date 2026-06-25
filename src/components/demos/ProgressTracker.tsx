/**
 * ProgressTracker — a "mark complete" toggle for a project page. State persists
 * in localStorage and broadcasts an event so the homepage progress bar updates.
 */
import { useEffect, useState } from 'preact/hooks';
import { isCompleted, setCompleted } from '../../lib/progress';

interface Props {
  slug: string;
}

export default function ProgressTracker({ slug }: Props) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(isCompleted(slug));
  }, [slug]);

  function toggle() {
    const next = !done;
    setDone(next);
    setCompleted(slug, next);
  }

  return (
    <button type="button" class={`track-btn ${done ? 'done' : ''}`} onClick={toggle}>
      <span class="track-mark">{done ? '✓' : '○'}</span>
      {done ? 'Completed' : 'Mark as complete'}
      <style>{`
        .track-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: var(--bg-elev-2); border: 1px solid var(--border); color: var(--text);
          padding: 0.5rem 1rem; border-radius: var(--radius); cursor: pointer; font-weight: 600; font-size: 0.92rem;
        }
        .track-btn:hover { border-color: var(--accent); }
        .track-btn.done { border-color: var(--good); color: var(--good); background: color-mix(in srgb, var(--good) 12%, var(--bg-elev)); }
        .track-mark { font-family: var(--mono); font-weight: 700; }
      `}</style>
    </button>
  );
}
