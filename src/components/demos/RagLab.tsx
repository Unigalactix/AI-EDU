/**
 * RagLab — an interactive explorer for the 18 RAG techniques. Two views:
 *  • Explore: pick a technique and watch its RAG pipeline animate, with the
 *    signature stage(s) highlighted and a score-vs-baseline bar.
 *  • Leaderboard: all 18 techniques ranked by benchmark score, animated.
 * Runs fully client-side — no model required.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  RAG_TECHNIQUES,
  RAG_CATEGORIES,
  BASELINE,
  type RagTechnique,
  type RagCategory,
} from '../../data/ragTechniques';

/* ------------------------------- rAF clock ------------------------------ */

function useProgress() {
  const [progress, setProgress] = useState(1);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const start = useRef(0);
  const dur = useRef(2600);

  function frame(now: number) {
    if (!start.current) start.current = now;
    const p = Math.min(1, (now - start.current) / dur.current);
    setProgress(p);
    if (p < 1) raf.current = requestAnimationFrame(frame);
    else setPlaying(false);
  }
  function play(duration = 2600) {
    cancelAnimationFrame(raf.current);
    dur.current = duration;
    start.current = 0;
    setProgress(0);
    setPlaying(true);
    raf.current = requestAnimationFrame(frame);
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return { progress, playing, play };
}

/* --------------------------- pipeline diagram --------------------------- */

const W = 360;

function Pipeline({ t, progress }: { t: RagTechnique; progress: number }) {
  const n = t.stages.length;
  const spacing = (W - 72) / Math.max(1, n - 1);
  const nodeW = Math.min(72, spacing * 0.84);
  const xs = t.stages.map((_, i) => 36 + i * spacing);
  const rowY = 46;
  const reached = progress * n;

  // anchor branch chips under the first decision, else first 'new' stage
  let anchor = t.stages.findIndex((s) => s.kind === 'decision');
  if (anchor < 0) anchor = t.stages.findIndex((s) => s.kind === 'new');
  if (anchor < 0) anchor = 0;

  function state(i: number): 'idle' | 'active' | 'done' {
    if (reached >= i + 1) return 'done';
    if (reached >= i) return 'active';
    return 'idle';
  }
  const tokenX = 36 + Math.min(n - 1, Math.max(0, reached - 0.5)) * spacing;
  const branchesOn = t.branches && reached >= anchor;

  return (
    <svg viewBox={`0 0 ${W} 150`} class="rl-svg" role="img" aria-label={`${t.title} pipeline`}>
      {/* connecting rail */}
      {t.stages.slice(0, -1).map((_, i) => (
        <line
          class={`rl-rail${reached > i + 1 ? ' on' : ''}`}
          x1={xs[i] + nodeW / 2}
          y1={rowY}
          x2={xs[i + 1] - nodeW / 2}
          y2={rowY}
        />
      ))}
      {/* branch links */}
      {branchesOn &&
        t.branches!.map((_, i) => {
          const bx = 36 + ((i + 0.5) * (W - 72)) / t.branches!.length;
          return <line class="rl-rail on dashed" x1={xs[anchor]} y1={rowY + 14} x2={bx} y2={96} />;
        })}
      {/* stage nodes */}
      {t.stages.map((s, i) => {
        const st = state(i);
        return (
          <g class={`rl-node rl-${st} rl-kind-${s.kind}`}>
            <rect x={xs[i] - nodeW / 2} y={rowY - 16} width={nodeW} height={32} rx={7} />
            <text x={xs[i]} y={rowY + 3.5} text-anchor="middle">
              {s.label}
            </text>
            {s.kind === 'new' && st !== 'idle' && (
              <text x={xs[i]} y={rowY - 21} text-anchor="middle" class="rl-tag">
                NEW
              </text>
            )}
            {s.kind === 'decision' && st !== 'idle' && (
              <text x={xs[i]} y={rowY - 21} text-anchor="middle" class="rl-tag dec">
                DECIDE
              </text>
            )}
          </g>
        );
      })}
      {/* branch chips */}
      {t.branches &&
        t.branches.map((b, i) => {
          const bx = 36 + ((i + 0.5) * (W - 72)) / t.branches!.length;
          return (
            <g class={`rl-chip${branchesOn ? ' on' : ''}`}>
              <rect x={bx - 34} y={96} width={68} height={22} rx={11} />
              <text x={bx} y={111} text-anchor="middle">
                {b}
              </text>
            </g>
          );
        })}
      {/* flowing token */}
      <circle class="rl-token" cx={tokenX} cy={rowY} r={6} />
    </svg>
  );
}

/* ------------------------------- score bar ------------------------------ */

function ScoreCompare({ t, progress }: { t: RagTechnique; progress: number }) {
  const max = 1;
  const delta = t.score - BASELINE;
  const better = t.score > BASELINE;
  const same = Math.abs(delta) < 0.001;
  const rank = [...RAG_TECHNIQUES].sort((a, b) => b.score - a.score).findIndex((x) => x.id === t.id) + 1;

  const bar = (label: string, val: number, cls: string) => (
    <div class="rl-statrow">
      <span class="rl-statlabel">{label}</span>
      <div class="rl-track">
        <div class={`rl-fill ${cls}`} style={{ width: `${(val / max) * progress * 100}%` }} />
      </div>
      <span class="rl-statval">{(val * progress).toFixed(2)}</span>
    </div>
  );

  return (
    <div class="rl-stats">
      <div class="rl-stathead">
        <span>Benchmark score</span>
        <span class={`rl-delta ${same ? 'neutral' : better ? 'good' : 'bad'}`}>
          {same ? 'ties baseline' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)} vs Simple RAG`}
          <span class="rl-rank"> · rank #{rank}/18</span>
        </span>
      </div>
      {bar('Simple RAG', BASELINE, 'base')}
      {bar(t.title, t.score, same ? 'base' : better ? 'good' : 'bad')}
    </div>
  );
}

/* ------------------------------ leaderboard ----------------------------- */

function Leaderboard({ progress, onPick }: { progress: number; onPick: (id: string) => void }) {
  const ranked = [...RAG_TECHNIQUES].sort((a, b) => b.score - a.score);
  const top = ranked[0].score;
  return (
    <div class="rl-board">
      <p class="rl-board-lead">
        All 18 techniques on one complex query. The dashed line is the Simple RAG baseline
        ({BASELINE.toFixed(2)}). Click any bar to explore it.
      </p>
      <div class="rl-board-grid">
        {ranked.map((t, i) => {
          const better = t.score > BASELINE;
          const same = Math.abs(t.score - BASELINE) < 0.001;
          return (
            <button class="rl-board-row" onClick={() => onPick(t.id)} aria-label={`${t.title}: ${t.score}`}>
              <span class="rl-board-rank">{i + 1}</span>
              <span class="rl-board-name">{t.title}</span>
              <div class="rl-board-track">
                <div class="rl-baseline" style={{ left: `${BASELINE * 100}%` }} />
                <div
                  class={`rl-board-fill ${i === 0 ? 'win' : same ? 'base' : better ? 'good' : 'bad'}`}
                  style={{ width: `${(t.score / 1) * Math.min(1, progress * 1.1) * 100}%` }}
                />
              </div>
              <span class="rl-board-score">{(t.score * Math.min(1, progress * 1.1)).toFixed(2)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- main view ------------------------------ */

export default function RagLab() {
  const [view, setView] = useState<'explore' | 'board'>('explore');
  const [id, setId] = useState(RAG_TECHNIQUES.find((x) => x.id === 'adaptive-rag')!.id);
  const { progress, playing, play } = useProgress();
  const t = RAG_TECHNIQUES.find((x) => x.id === id)!;

  useEffect(() => {
    play(view === 'board' ? 1400 : 2600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, view]);

  const grouped = (Object.keys(RAG_CATEGORIES) as RagCategory[]).map((cat) => ({
    cat,
    items: RAG_TECHNIQUES.filter((x) => x.category === cat),
  }));

  function pick(nextId: string) {
    setId(nextId);
    setView('explore');
  }

  return (
    <section class="rl">
      <div class="rl-tabs">
        <button class={view === 'explore' ? 'on' : ''} onClick={() => setView('explore')}>
          Explore techniques
        </button>
        <button class={view === 'board' ? 'on' : ''} onClick={() => setView('board')}>
          🏆 Leaderboard
        </button>
      </div>

      {view === 'board' ? (
        <Leaderboard progress={progress} onPick={pick} />
      ) : (
        <div class="rl-grid">
          <aside class="rl-list">
            {grouped.map((g) => (
              <div class="rl-group">
                <h4>{RAG_CATEGORIES[g.cat].label}</h4>
                {g.items.map((x) => (
                  <button
                    class={`rl-item ${x.id === id ? 'sel' : ''}`}
                    onClick={() => setId(x.id)}
                    aria-current={x.id === id}
                  >
                    <span class={`rl-score ${x.score > BASELINE ? 'good' : x.score < BASELINE ? 'bad' : ''}`}>
                      {x.score.toFixed(2)}
                    </span>
                    <span>
                      <strong>{x.title}</strong>
                      <em>{x.tagline}</em>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </aside>

          <div class="rl-detail">
            <header class="rl-head">
              <span class="rl-cat">{RAG_CATEGORIES[t.category].label}</span>
              <h3>{t.title}</h3>
            </header>

            <div class="rl-stage">
              <div class="rl-toolbar">
                <span class="rl-legend">
                  <i class="dot base" /> standard <i class="dot new" /> new step <i class="dot dec" /> decision
                </span>
                <button class="rl-play" onClick={() => play()}>
                  {playing ? '● Running…' : '▶ Replay'}
                </button>
              </div>
              <Pipeline t={t} progress={progress} />
              <ScoreCompare t={t} progress={progress} />
            </div>

            <div class="rl-text">
              <div class="rl-prob">
                <h5>The problem</h5>
                <p>{t.problem}</p>
              </div>
              <div class="rl-sol">
                <h5>The technique</h5>
                <p>{t.technique}</p>
              </div>
            </div>

            <ul class="rl-take">
              {t.takeaways.map((k) => (
                <li>{k}</li>
              ))}
            </ul>
            <p class="rl-when">
              <strong>When to use:</strong> {t.whenToUse}
            </p>
          </div>
        </div>
      )}
      <Styles />
    </section>
  );
}

/* -------------------------------- styles -------------------------------- */

function Styles() {
  return (
    <style>{`
      .rl-tabs { display: inline-flex; gap: 2px; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: 999px; padding: 3px; margin-bottom: 1rem; }
      .rl-tabs button { border: none; background: transparent; color: var(--text-dim); font-size: 0.86rem; font-weight: 600; padding: 0.4rem 1rem; border-radius: 999px; cursor: pointer; }
      .rl-tabs button.on { background: var(--accent); color: #fff; }

      .rl-grid { display: grid; grid-template-columns: 260px 1fr; gap: 1.1rem; align-items: start; }
      @media (max-width: 860px) { .rl-grid { grid-template-columns: 1fr; } }

      .rl-list { display: grid; gap: 1rem; position: sticky; top: 72px; max-height: calc(100vh - 90px); overflow: auto; padding-right: 2px; }
      @media (max-width: 860px) { .rl-list { position: static; max-height: none; } }
      .rl-group h4 { margin: 0 0 0.4rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); }
      .rl-item { display: flex; gap: 0.6rem; align-items: center; width: 100%; text-align: left; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 9px; padding: 0.45rem 0.55rem; margin-bottom: 0.32rem; cursor: pointer; color: var(--text); }
      .rl-item:hover { border-color: var(--accent); }
      .rl-item.sel { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--bg-elev)); }
      .rl-score { flex: none; width: 38px; height: 24px; border-radius: 6px; display: grid; place-items: center; font-family: var(--mono); font-size: 0.74rem; font-weight: 700; background: var(--bg-elev-2); border: 1px solid var(--border); color: var(--text-dim); }
      .rl-score.good { color: var(--good); border-color: color-mix(in srgb, var(--good) 50%, var(--border)); }
      .rl-score.bad { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 50%, var(--border)); }
      .rl-item strong { display: block; font-size: 0.88rem; line-height: 1.2; }
      .rl-item em { font-style: normal; font-size: 0.74rem; color: var(--text-dim); }

      .rl-detail { border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-elev); overflow: hidden; }
      .rl-head { padding: 1rem 1.1rem 0.5rem; }
      .rl-cat { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); }
      .rl-head h3 { margin: 0.25rem 0 0; font-size: 1.3rem; }

      .rl-stage { margin: 0.2rem 1.1rem 0; padding: 0.8rem; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; }
      .rl-toolbar { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.3rem; }
      .rl-legend { font-size: 0.72rem; color: var(--text-dim); display: inline-flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
      .rl-legend .dot { width: 9px; height: 9px; border-radius: 3px; display: inline-block; margin: 0 0.1rem 0 0.4rem; }
      .rl-legend .dot.base { background: var(--accent); }
      .rl-legend .dot.new { background: var(--accent-2); }
      .rl-legend .dot.dec { background: var(--warn); }
      .rl-play { margin-left: auto; background: var(--bg-elev-2); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 0.32rem 0.75rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
      .rl-play:hover { border-color: var(--accent); }

      .rl-svg { width: 100%; height: auto; display: block; }
      .rl-node rect { fill: var(--bg-elev-2); stroke: var(--border); stroke-width: 1.4; transition: fill .2s, stroke .2s; }
      .rl-node text { fill: var(--text-dim); font-size: 8.5px; font-weight: 600; font-family: var(--sans); }
      .rl-active rect { fill: color-mix(in srgb, var(--accent) 28%, var(--bg-elev-2)); stroke: var(--accent); }
      .rl-active text, .rl-done text { fill: var(--text); }
      .rl-done rect { fill: color-mix(in srgb, var(--good) 18%, var(--bg-elev-2)); stroke: var(--good); }
      .rl-kind-new.rl-active rect, .rl-kind-new.rl-done rect { stroke: var(--accent-2); fill: color-mix(in srgb, var(--accent-2) 26%, var(--bg-elev-2)); }
      .rl-kind-decision.rl-active rect, .rl-kind-decision.rl-done rect { stroke: var(--warn); fill: color-mix(in srgb, var(--warn) 22%, var(--bg-elev-2)); }
      .rl-tag { fill: var(--accent-2); font-size: 6.5px; font-weight: 800; letter-spacing: 0.06em; }
      .rl-tag.dec { fill: var(--warn); }

      .rl-rail { stroke: var(--border); stroke-width: 1.6; transition: stroke .25s; }
      .rl-rail.on { stroke: var(--accent); }
      .rl-rail.dashed { stroke: var(--accent-2); stroke-dasharray: 3 3; }
      .rl-token { fill: var(--accent); filter: drop-shadow(0 0 4px var(--accent)); }

      .rl-chip rect { fill: var(--bg-elev-2); stroke: var(--border); stroke-dasharray: 3 3; opacity: .45; transition: opacity .25s; }
      .rl-chip text { fill: var(--text-dim); font-size: 8px; font-weight: 600; font-family: var(--sans); opacity: .5; }
      .rl-chip.on rect { opacity: 1; stroke: var(--accent-2); stroke-dasharray: none; }
      .rl-chip.on text { opacity: 1; fill: var(--text); }

      .rl-stats { margin-top: 0.7rem; }
      .rl-stathead { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.78rem; color: var(--text-dim); margin-bottom: 0.35rem; flex-wrap: wrap; gap: 0.3rem; }
      .rl-delta.good { color: var(--good); font-weight: 700; }
      .rl-delta.bad { color: var(--warn); font-weight: 700; }
      .rl-delta.neutral { color: var(--text-dim); font-weight: 700; }
      .rl-rank { color: var(--text-dim); font-weight: 500; }
      .rl-statrow { display: grid; grid-template-columns: 88px 1fr 42px; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
      .rl-statlabel { font-size: 0.78rem; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .rl-track { height: 14px; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
      .rl-fill { height: 100%; border-radius: 999px; transition: width .08s linear; }
      .rl-fill.base { background: var(--text-dim); }
      .rl-fill.good { background: var(--good); }
      .rl-fill.bad { background: var(--warn); }
      .rl-statval { font-family: var(--mono); font-size: 0.82rem; text-align: right; color: var(--text); }

      .rl-text { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; padding: 1rem 1.1rem 0; }
      @media (max-width: 620px) { .rl-text { grid-template-columns: 1fr; } }
      .rl-text h5 { margin: 0 0 0.3rem; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-dim); }
      .rl-prob h5 { color: var(--warn); }
      .rl-sol h5 { color: var(--good); }
      .rl-text p { margin: 0; font-size: 0.92rem; }

      .rl-take { margin: 0.9rem 1.1rem 0; padding-left: 1.1rem; display: grid; gap: 0.25rem; }
      .rl-take li { font-size: 0.9rem; }
      .rl-when { margin: 0.8rem 1.1rem 1.1rem; padding: 0.6rem 0.8rem; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: 8px; font-size: 0.88rem; color: var(--text-dim); }
      .rl-when strong { color: var(--text); }

      .rl-board { border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-elev); padding: 1.1rem; }
      .rl-board-lead { margin: 0 0 0.9rem; color: var(--text-dim); font-size: 0.9rem; }
      .rl-board-grid { display: grid; gap: 0.4rem; }
      .rl-board-row { display: grid; grid-template-columns: 26px 150px 1fr 42px; align-items: center; gap: 0.6rem; width: 100%; background: transparent; border: none; cursor: pointer; padding: 0.2rem 0.2rem; border-radius: 8px; color: var(--text); text-align: left; }
      .rl-board-row:hover { background: var(--bg-elev-2); }
      @media (max-width: 620px) { .rl-board-row { grid-template-columns: 22px 110px 1fr 38px; gap: 0.4rem; } }
      .rl-board-rank { font-family: var(--mono); font-size: 0.8rem; color: var(--text-dim); text-align: right; }
      .rl-board-name { font-size: 0.86rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .rl-board-track { position: relative; height: 18px; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
      .rl-board-fill { height: 100%; border-radius: 6px 0 0 6px; transition: width .12s linear; }
      .rl-board-fill.win { background: linear-gradient(90deg, var(--accent), var(--accent-2)); }
      .rl-board-fill.good { background: var(--good); }
      .rl-board-fill.bad { background: var(--warn); }
      .rl-board-fill.base { background: var(--text-dim); }
      .rl-baseline { position: absolute; top: -2px; bottom: -2px; width: 2px; background: var(--text); opacity: .55; z-index: 2; }
      .rl-board-score { font-family: var(--mono); font-size: 0.82rem; text-align: right; color: var(--text); }
    `}</style>
  );
}
