/**
 * ProgressSummary — a homepage widget showing how many projects the learner has
 * completed. Reads from localStorage and live-updates when progress changes on
 * any page (via the 'aiedu-progress' event). Earns a badge at milestones.
 */
import { useEffect, useState } from 'preact/hooks';
import { getCompleted } from '../../lib/progress';

interface Props {
  projects: { slug: string; title: string }[];
}

export default function ProgressSummary({ projects }: Props) {
  const [completed, setCompletedState] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setCompletedState(getCompleted());
    refresh();
    window.addEventListener('aiedu-progress', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('aiedu-progress', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const total = projects.length;
  const doneCount = projects.filter((p) => completed.includes(p.slug)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const badge =
    doneCount === 0
      ? null
      : doneCount === total
        ? { label: '🏆 Course complete', cls: 'gold' }
        : doneCount >= Math.ceil(total / 2)
          ? { label: '🔥 Halfway hero', cls: 'silver' }
          : { label: '🌱 Getting started', cls: 'bronze' };

  return (
    <div class="ps">
      <div class="ps-top">
        <div>
          <strong>Your progress</strong>
          <span class="ps-count">
            {doneCount} / {total} projects
          </span>
        </div>
        {badge && <span class={`ps-badge ${badge.cls}`}>{badge.label}</span>}
      </div>
      <div class="ps-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={`width:${pct}%`} />
      </div>
      <p class="ps-hint">
        {doneCount === 0
          ? 'Open a project and hit “Mark as complete” to start tracking. Saved on this device only.'
          : doneCount === total
            ? 'Every project done — nice work. Revisit the RAG Lab and Pillars to go deeper.'
            : `${total - doneCount} to go. Keep building!`}
      </p>

      <style>{`
        .ps { border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-elev); padding: 1.1rem 1.25rem; }
        .ps-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .ps-count { color: var(--text-dim); margin-left: 0.6rem; font-size: 0.9rem; }
        .ps-badge { font-size: 0.8rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; border: 1px solid var(--border); }
        .ps-badge.gold { color: var(--warn); border-color: var(--warn); }
        .ps-badge.silver { color: var(--accent); border-color: var(--accent); }
        .ps-badge.bronze { color: var(--good); border-color: var(--good); }
        .ps-bar { height: 10px; border-radius: 999px; background: var(--bg-elev-2); border: 1px solid var(--border); overflow: hidden; margin: 0.7rem 0 0; }
        .ps-bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--good), var(--accent)); transition: width 0.4s ease; }
        .ps-hint { color: var(--text-dim); font-size: 0.88rem; margin: 0.6rem 0 0; }
      `}</style>
    </div>
  );
}
