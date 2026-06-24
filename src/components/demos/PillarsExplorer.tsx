/**
 * PillarsExplorer — an interactive learning graphic for the 14 pillars of
 * Agentic AI. Pick a pattern, flip between the "naïve" and "pattern" approach,
 * and press play to watch an animated SVG diagram + a before/after stat bar
 * make the trade-off visible. Runs fully client-side, no model required.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { PILLARS, CATEGORIES, type Pillar, type Category } from '../../data/pillars';

/* ----------------------------- timing model ----------------------------- */

const SOURCE_T = 1;
const SINK_T = 1;
const STAGE_T = 1;
const SAT_T = 1.4;

/** Total sim-seconds for a pillar in a given mode (drives play duration + clock). */
function getTotal(p: Pillar, after: boolean): number {
  switch (p.archetype) {
    case 'fanout': {
      const b = p.branches!.map((x) => x.t);
      if (p.race) {
        // after: winner finishes first; before: you might run the slow path alone.
        const win = b[p.winner ?? 0];
        const slow = Math.max(...b);
        return SOURCE_T + (after ? win : slow) + SINK_T;
      }
      const span = after ? Math.max(...b) : b.reduce((s, v) => s + v, 0);
      return SOURCE_T + span + SINK_T;
    }
    case 'pipeline': {
      const n = p.stages!.length;
      const m = p.itemCount!;
      return (after ? n + m - 1 : n * m) * STAGE_T;
    }
    case 'hub': {
      const n = p.satellites!.length;
      return after ? n * SAT_T : n * SAT_T * 0.8;
    }
    case 'speculative': {
      const { think, tool, synth } = p.spec!;
      return (after ? Math.max(think, tool) : think + tool) + synth;
    }
  }
}

type NodeState = 'idle' | 'active' | 'done' | 'winner' | 'cancelled';

/* ------------------------------- rAF clock ------------------------------ */

function useProgress() {
  const [progress, setProgress] = useState(1);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const start = useRef(0);
  const dur = useRef(3000);

  function frame(now: number) {
    if (!start.current) start.current = now;
    const p = Math.min(1, (now - start.current) / dur.current);
    setProgress(p);
    if (p < 1) raf.current = requestAnimationFrame(frame);
    else setPlaying(false);
  }
  function play(total: number) {
    cancelAnimationFrame(raf.current);
    dur.current = Math.min(4200, Math.max(2200, total * 300));
    start.current = 0;
    setProgress(0);
    setPlaying(true);
    raf.current = requestAnimationFrame(frame);
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return { progress, playing, play };
}

/* ------------------------------ svg helpers ----------------------------- */

const W = 360;
const H = 200;

function Node({
  x,
  y,
  label,
  state,
  w = 66,
  h = 30,
}: {
  x: number;
  y: number;
  label: string;
  state: NodeState;
  w?: number;
  h?: number;
}) {
  return (
    <g class={`pnode pnode-${state}`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={8} />
      <text x={x} y={y + 3.5} text-anchor="middle">
        {label}
      </text>
    </g>
  );
}

function Edge({ x1, y1, x2, y2, on }: { x1: number; y1: number; x2: number; y2: number; on: boolean }) {
  return <line class={`pedge${on ? ' on' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
}

/* ------------------------------ renderers ------------------------------- */

function FanoutDiagram({ p, after, clock }: { p: Pillar; after: boolean; clock: number }) {
  const branches = p.branches!;
  const n = branches.length;
  const sx = 46;
  const bx = 180;
  const kx = 314;
  const cy = 100;
  const ys = branches.map((_, i) => (n === 1 ? cy : 30 + (i * (H - 60)) / (n - 1)));

  // schedule
  const winIdx = p.winner ?? 0;
  let starts: number[] = [];
  let ends: number[] = [];
  let sinkStart = 0;

  if (p.race) {
    const only = after ? winIdx : branches.indexOf(branches.reduce((a, b) => (a.t > b.t ? a : b)));
    starts = branches.map(() => SOURCE_T);
    ends = branches.map((b, i) => (after ? SOURCE_T + b.t : i === only ? SOURCE_T + b.t : Infinity));
    sinkStart = SOURCE_T + branches[only].t;
  } else if (after) {
    starts = branches.map(() => SOURCE_T);
    ends = branches.map((b) => SOURCE_T + b.t);
    sinkStart = SOURCE_T + Math.max(...branches.map((b) => b.t));
  } else {
    let acc = SOURCE_T;
    branches.forEach((b) => {
      starts.push(acc);
      acc += b.t;
      ends.push(acc);
    });
    sinkStart = acc;
  }
  const sinkEnd = sinkStart + SINK_T;
  const finished = clock >= sinkEnd;

  const sourceState: NodeState = clock <= 0 ? 'idle' : clock < SOURCE_T ? 'active' : 'done';
  function branchState(i: number): NodeState {
    if (p.race && !after && ends[i] === Infinity) return 'idle';
    if (p.race && after && i !== winIdx && clock >= sinkStart && clock < ends[i]) return 'cancelled';
    if (p.race && after && i !== winIdx && clock >= ends[i]) return 'cancelled';
    if (clock < starts[i]) return 'idle';
    if (clock < ends[i]) return 'active';
    if (finished && p.winner === i && !p.race) return 'winner';
    return 'done';
  }
  const sinkState: NodeState = clock < sinkStart ? 'idle' : clock < sinkEnd ? 'active' : 'done';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="pdiagram" role="img" aria-label={`${p.title} flow diagram`}>
      {branches.map((_, i) => (
        <Edge x1={sx + 33} y1={cy} x2={bx - 33} y2={ys[i]} on={branchState(i) !== 'idle'} />
      ))}
      {branches.map((_, i) => (
        <Edge x1={bx + 33} y1={ys[i]} x2={kx - 33} y2={cy} on={sinkState !== 'idle' || finished} />
      ))}
      <Node x={sx} y={cy} label={p.source!} state={sourceState} />
      {branches.map((b, i) => (
        <Node x={bx} y={ys[i]} label={b.label} state={branchState(i)} />
      ))}
      <Node x={kx} y={cy} label={p.sink!} state={sinkState} />
    </svg>
  );
}

function SpeculativeDiagram({ p, after, clock }: { p: Pillar; after: boolean; clock: number }) {
  const { think, tool, synth } = p.spec!;
  const x0 = 70;
  const x1 = 300;
  const span = x1 - x0;
  const total = (after ? Math.max(think, tool) : think + tool) + synth;
  const sc = span / total;

  const toolStart = after ? 0 : think;
  const synthStart = after ? Math.max(think, tool) : think + tool;

  function bar(start: number, len: number, y: number, label: string, cls: string) {
    const fillEnd = Math.max(0, Math.min(len, clock - start));
    const active = clock >= start && clock < start + len;
    const done = clock >= start + len;
    return (
      <g class={`pbar ${cls} ${active ? 'active' : done ? 'done' : 'idle'}`}>
        <rect x={x0 + start * sc} y={y} width={len * sc} height={26} rx={6} class="pbar-track" />
        <rect x={x0 + start * sc} y={y} width={fillEnd * sc} height={26} rx={6} class="pbar-fill" />
        <text x={x0 + start * sc + 6} y={y + 17}>
          {label}
        </text>
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="pdiagram" role="img" aria-label="Speculative execution timeline">
      <text x={x0 - 8} y={56} text-anchor="end" class="plane">
        LLM
      </text>
      <text x={x0 - 8} y={106} text-anchor="end" class="plane">
        Tool
      </text>
      <text x={x0 - 8} y={156} text-anchor="end" class="plane">
        Final
      </text>
      {bar(0, think, 32, 'Think', 'think')}
      {bar(toolStart, tool, 82, 'Pre-fetch', 'tool')}
      {bar(synthStart, synth, 132, 'Synthesize', 'synth')}
      {after && (
        <text x={x0} y={186} class="pnote">
          Tool runs under the thinking time → latency hidden
        </text>
      )}
    </svg>
  );
}

function PipelineDiagram({ p, after, clock }: { p: Pillar; after: boolean; clock: number }) {
  const stages = p.stages!;
  const m = p.itemCount!;
  const n = stages.length;
  const xs = stages.map((_, i) => 70 + (i * 220) / (n - 1));
  const cy = 70;

  // which item index occupies station s right now (or -1)
  function itemAt(s: number): number {
    for (let j = 0; j < m; j++) {
      const enter = after ? (j + s) * STAGE_T : j * n * STAGE_T + s * STAGE_T;
      if (clock >= enter && clock < enter + STAGE_T) return j;
    }
    return -1;
  }
  function itemDone(j: number): boolean {
    const done = after ? (j + n) * STAGE_T : (j + 1) * n * STAGE_T;
    return clock >= done;
  }
  function itemPending(j: number): boolean {
    const enter = after ? j * STAGE_T : j * n * STAGE_T;
    return clock < enter;
  }
  const doneCount = Array.from({ length: m }, (_, j) => j).filter(itemDone).length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="pdiagram" role="img" aria-label="Assembly line pipeline">
      {stages.map((s, i) => {
        const occ = itemAt(i);
        return (
          <g class={`pnode ${occ >= 0 ? 'pnode-active' : 'pnode-idle'}`}>
            <rect x={xs[i] - 36} y={cy - 20} width={72} height={40} rx={8} />
            <text x={xs[i]} y={cy - 2} text-anchor="middle">
              {s}
            </text>
            {occ >= 0 && (
              <text x={xs[i]} y={cy + 13} text-anchor="middle" class="pitem-num">
                item {occ + 1}
              </text>
            )}
          </g>
        );
      })}
      {/* queue */}
      <text x={20} y={140} class="ptray">
        Queue
      </text>
      {Array.from({ length: m }, (_, j) => j)
        .filter(itemPending)
        .map((j, k) => (
          <circle class="pitem queued" cx={26 + k * 14} cy={156} r={6} />
        ))}
      {/* done */}
      <text x={W - 70} y={140} class="ptray">
        Done · {doneCount}/{m}
      </text>
      {Array.from({ length: m }, (_, j) => j)
        .filter(itemDone)
        .map((j, k) => (
          <circle class="pitem finished" cx={W - 64 + k * 14} cy={156} r={6} />
        ))}
    </svg>
  );
}

function HubDiagram({ p, after, clock }: { p: Pillar; after: boolean; clock: number }) {
  const sats = p.satellites!;
  const n = sats.length;
  const cx = 180;
  const cy = 102;
  const R = 70;
  const pos = sats.map((_, i) => {
    const ang = (-90 + (i * 360) / n) * (Math.PI / 180);
    return { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
  });

  function satState(i: number): NodeState {
    if (!after) return 'idle';
    const start = i * SAT_T;
    const end = start + SAT_T;
    if (clock < start) return 'idle';
    if (clock < end) return 'active';
    return 'done';
  }
  const activeIdx = after ? Math.min(n - 1, Math.floor(clock / SAT_T)) : -1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="pdiagram" role="img" aria-label="Blackboard collaboration">
      {pos.map((pt, i) => (
        <Edge x1={cx} y1={cy} x2={pt.x} y2={pt.y} on={satState(i) === 'active'} />
      ))}
      <g class={`pnode ${after ? 'pnode-active' : 'pnode-active'}`}>
        <rect x={cx - 48} y={cy - 22} width={96} height={44} rx={10} />
        <text x={cx} y={cy + 4} text-anchor="middle">
          {after ? p.hub : 'Monolith'}
        </text>
      </g>
      {pos.map((pt, i) => (
        <Node x={pt.x} y={pt.y} label={sats[i]} state={satState(i)} w={62} h={26} />
      ))}
      {after && activeIdx >= 0 && (
        <text x={cx} y={H - 6} text-anchor="middle" class="pnote">
          Router → {sats[activeIdx]}
        </text>
      )}
    </svg>
  );
}

function Diagram({ p, after, clock }: { p: Pillar; after: boolean; clock: number }) {
  if (p.archetype === 'fanout') return <FanoutDiagram p={p} after={after} clock={clock} />;
  if (p.archetype === 'speculative') return <SpeculativeDiagram p={p} after={after} clock={clock} />;
  if (p.archetype === 'pipeline') return <PipelineDiagram p={p} after={after} clock={clock} />;
  return <HubDiagram p={p} after={after} clock={clock} />;
}

/* ------------------------------- stat bar ------------------------------- */

function decimals(v: number) {
  return Number.isInteger(v) ? 0 : v < 10 ? 2 : 0;
}

function StatBars({ p, progress }: { p: Pillar; progress: number }) {
  const s = p.stat;
  const max = Math.max(s.before, s.after);
  const dec = Math.max(decimals(s.before), decimals(s.after));
  const row = (label: string, val: number, good: boolean) => {
    const shown = (val * progress).toFixed(dec);
    return (
      <div class="statrow">
        <span class="statlabel">{label}</span>
        <div class="stattrack">
          <div class={`statfill ${good ? 'good' : 'bad'}`} style={{ width: `${(val / max) * progress * 100}%` }} />
        </div>
        <span class="statval">
          {shown}
          {s.unit}
        </span>
      </div>
    );
  };
  const afterGood = !s.lowerIsBetter || s.after <= s.before;
  return (
    <div class="stats">
      <div class="stathead">
        <span>{s.label}</span>
        <span class="statimp">{s.improvement}</span>
      </div>
      {row('Naïve', s.before, !s.lowerIsBetter && s.before >= s.after ? true : false)}
      {row('Pattern', s.after, afterGood)}
    </div>
  );
}

/* ------------------------------- main view ------------------------------ */

export default function PillarsExplorer() {
  const [id, setId] = useState(PILLARS[0].id);
  const [after, setAfter] = useState(true);
  const { progress, playing, play } = useProgress();
  const pillar = PILLARS.find((x) => x.id === id)!;
  const total = getTotal(pillar, after);
  const clock = progress * total;

  // auto-play whenever the pattern or mode changes
  useEffect(() => {
    play(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, after]);

  const modeLabels: Record<Pillar['archetype'], [string, string]> = {
    fanout: ['Sequential', 'Parallel'],
    pipeline: ['Monolithic', 'Pipelined'],
    hub: ['Monolith', 'Blackboard'],
    speculative: ['Sequential', 'Speculative'],
  };
  const [beforeLbl, afterLbl] = modeLabels[pillar.archetype];

  const grouped = (Object.keys(CATEGORIES) as Category[]).map((cat) => ({
    cat,
    items: PILLARS.filter((p) => p.category === cat),
  }));

  return (
    <section class="px">
      <div class="px-grid">
        {/* sidebar list */}
        <aside class="px-list">
          {grouped.map((g) => (
            <div class="px-group">
              <h4>{CATEGORIES[g.cat].label}</h4>
              {g.items.map((p) => (
                <button
                  class={`px-item ${p.id === id ? 'sel' : ''}`}
                  onClick={() => setId(p.id)}
                  aria-current={p.id === id}
                >
                  <span class="px-num">{p.num}</span>
                  <span>
                    <strong>{p.title}</strong>
                    <em>{p.tagline}</em>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* detail */}
        <div class="px-detail">
          <header class="px-head">
            <div>
              <span class="px-cat">{CATEGORIES[pillar.category].label}</span>
              <h3>
                <span class="px-badge">{pillar.num}</span>
                {pillar.title}
              </h3>
            </div>
          </header>

          <div class="px-stage">
            <div class="px-toolbar">
              <div class="px-toggle" role="tablist" aria-label="Approach">
                <button class={!after ? 'on' : ''} onClick={() => setAfter(false)} role="tab" aria-selected={!after}>
                  {beforeLbl}
                </button>
                <button class={after ? 'on' : ''} onClick={() => setAfter(true)} role="tab" aria-selected={after}>
                  {afterLbl}
                </button>
              </div>
              <button class="px-play" onClick={() => play(total)}>
                {playing ? '● Running…' : '▶ Replay'}
              </button>
            </div>

            <Diagram p={pillar} after={after} clock={clock} />
            <StatBars p={pillar} progress={progress} />
          </div>

          <div class="px-text">
            <div class="px-prob">
              <h5>The problem</h5>
              <p>{pillar.problem}</p>
            </div>
            <div class="px-sol">
              <h5>The pattern</h5>
              <p>{pillar.solution}</p>
            </div>
          </div>

          <ul class="px-take">
            {pillar.takeaways.map((t) => (
              <li>{t}</li>
            ))}
          </ul>
          <p class="px-real">
            <strong>In the wild:</strong> {pillar.realWorld}
          </p>
        </div>
      </div>
      <Styles />
    </section>
  );
}

/* -------------------------------- styles -------------------------------- */

function Styles() {
  return (
    <style>{`
      .px { --on: var(--accent); }
      .px-grid { display: grid; grid-template-columns: 260px 1fr; gap: 1.1rem; align-items: start; }
      @media (max-width: 860px) { .px-grid { grid-template-columns: 1fr; } }

      .px-list { display: grid; gap: 1rem; position: sticky; top: 72px; max-height: calc(100vh - 90px); overflow: auto; padding-right: 2px; }
      @media (max-width: 860px) { .px-list { position: static; max-height: none; } }
      .px-group h4 { margin: 0 0 0.4rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); }
      .px-item { display: flex; gap: 0.6rem; align-items: center; width: 100%; text-align: left; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 9px; padding: 0.5rem 0.6rem; margin-bottom: 0.35rem; cursor: pointer; color: var(--text); }
      .px-item:hover { border-color: var(--accent); }
      .px-item.sel { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--bg-elev)); }
      .px-num { flex: none; width: 24px; height: 24px; border-radius: 6px; display: grid; place-items: center; font-size: 0.78rem; font-weight: 700; background: var(--bg-elev-2); border: 1px solid var(--border); color: var(--text-dim); }
      .px-item.sel .px-num { background: var(--accent); color: #fff; border-color: var(--accent); }
      .px-item strong { display: block; font-size: 0.9rem; line-height: 1.2; }
      .px-item em { font-style: normal; font-size: 0.76rem; color: var(--text-dim); }

      .px-detail { border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-elev); overflow: hidden; }
      .px-head { padding: 1rem 1.1rem 0.6rem; }
      .px-cat { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); }
      .px-head h3 { display: flex; align-items: center; gap: 0.6rem; margin: 0.25rem 0 0; font-size: 1.3rem; }
      .px-badge { flex: none; width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; font-size: 0.95rem; background: var(--accent); color: #fff; }

      .px-stage { margin: 0.2rem 1.1rem 0; padding: 0.8rem; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; }
      .px-toolbar { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem; }
      .px-toggle { display: inline-flex; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: 999px; padding: 2px; }
      .px-toggle button { border: none; background: transparent; color: var(--text-dim); font-size: 0.8rem; font-weight: 600; padding: 0.3rem 0.8rem; border-radius: 999px; cursor: pointer; }
      .px-toggle button.on { background: var(--accent); color: #fff; }
      .px-play { margin-left: auto; background: var(--bg-elev-2); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 0.35rem 0.8rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
      .px-play:hover { border-color: var(--accent); }

      .pdiagram { width: 100%; height: auto; display: block; }
      .pnode rect { fill: var(--bg-elev-2); stroke: var(--border); stroke-width: 1.4; transition: fill .2s, stroke .2s; }
      .pnode text { fill: var(--text-dim); font-size: 9px; font-weight: 600; font-family: var(--sans); transition: fill .2s; }
      .pnode-active rect { fill: color-mix(in srgb, var(--accent) 30%, var(--bg-elev-2)); stroke: var(--accent); }
      .pnode-active text { fill: var(--text); }
      .pnode-done rect { fill: color-mix(in srgb, var(--good) 22%, var(--bg-elev-2)); stroke: var(--good); }
      .pnode-done text { fill: var(--text); }
      .pnode-winner rect { fill: color-mix(in srgb, var(--accent-2) 32%, var(--bg-elev-2)); stroke: var(--accent-2); stroke-width: 2; }
      .pnode-winner text { fill: var(--text); }
      .pnode-cancelled rect { fill: var(--bg-elev); stroke: var(--border); stroke-dasharray: 3 3; opacity: .5; }
      .pnode-cancelled text { fill: var(--text-dim); opacity: .6; }
      .pitem-num { fill: var(--text-dim); font-size: 8px; }

      .pedge { stroke: var(--border); stroke-width: 1.6; transition: stroke .25s; }
      .pedge.on { stroke: var(--accent); stroke-dasharray: 5 4; animation: pflow .6s linear infinite; }
      @keyframes pflow { to { stroke-dashoffset: -18; } }

      .pbar-track { fill: var(--bg-elev-2); stroke: var(--border); stroke-width: 1; }
      .pbar-fill { fill: var(--accent); opacity: .9; }
      .pbar.tool .pbar-fill { fill: var(--accent-2); }
      .pbar.synth .pbar-fill { fill: var(--good); }
      .pbar text { fill: var(--text); font-size: 9px; font-weight: 600; font-family: var(--sans); }
      .plane { fill: var(--text-dim); font-size: 9px; font-weight: 600; }
      .pnote { fill: var(--text-dim); font-size: 8.5px; }

      .pitem { stroke: var(--border); }
      .pitem.queued { fill: var(--bg-elev-2); }
      .pitem.finished { fill: var(--good); }
      .ptray { fill: var(--text-dim); font-size: 8.5px; font-weight: 600; }

      .stats { margin-top: 0.7rem; }
      .stathead { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-dim); margin-bottom: 0.35rem; }
      .statimp { color: var(--good); font-weight: 700; }
      .statrow { display: grid; grid-template-columns: 64px 1fr 78px; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
      .statlabel { font-size: 0.78rem; color: var(--text-dim); }
      .stattrack { height: 14px; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
      .statfill { height: 100%; border-radius: 999px; transition: width .08s linear; }
      .statfill.good { background: var(--good); }
      .statfill.bad { background: var(--warn); }
      .statval { font-family: var(--mono); font-size: 0.82rem; text-align: right; color: var(--text); }

      .px-text { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; padding: 1rem 1.1rem 0; }
      @media (max-width: 620px) { .px-text { grid-template-columns: 1fr; } }
      .px-text h5 { margin: 0 0 0.3rem; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-dim); }
      .px-prob h5 { color: var(--warn); }
      .px-sol h5 { color: var(--good); }
      .px-text p { margin: 0; font-size: 0.92rem; }

      .px-take { margin: 0.9rem 1.1rem 0; padding-left: 1.1rem; display: grid; gap: 0.25rem; }
      .px-take li { font-size: 0.9rem; }
      .px-real { margin: 0.8rem 1.1rem 1.1rem; padding: 0.6rem 0.8rem; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: 8px; font-size: 0.88rem; color: var(--text-dim); }
      .px-real strong { color: var(--text); }
    `}</style>
  );
}
