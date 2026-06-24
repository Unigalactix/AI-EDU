/** Shared styles + small UI atoms for the interactive demos. */
import type { ComponentChildren } from 'preact';

export function DemoShell({
  title,
  children,
}: {
  title: string;
  children: ComponentChildren;
}) {
  return (
    <section class="demo">
      <header class="demo-header">
        <span class="demo-dot" />
        <span>{title}</span>
        <span class="demo-tag">runs in your browser · mock model</span>
      </header>
      <div class="demo-inner">{children}</div>
      <DemoStyles />
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ComponentChildren;
}) {
  return (
    <label class="demo-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function DemoStyles() {
  return (
    <style>{`
      .demo { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; background: var(--bg-elev); }
      .demo-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; background: var(--bg-elev-2); border-bottom: 1px solid var(--border); font-weight: 600; font-size: 0.9rem; }
      .demo-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--good); }
      .demo-tag { margin-left: auto; font-weight: 500; color: var(--text-dim); font-size: 0.78rem; }
      .demo-inner { padding: 1rem; }
      .demo-field { display: block; margin-bottom: 0.8rem; }
      .demo-field > span { display: block; font-size: 0.82rem; color: var(--text-dim); margin-bottom: 0.3rem; font-weight: 600; }
      .demo input[type=text], .demo textarea, .demo select {
        width: 100%; background: var(--bg); color: var(--text);
        border: 1px solid var(--border); border-radius: 8px; padding: 0.55rem 0.7rem;
        font-family: var(--sans); font-size: 0.95rem;
      }
      .demo textarea { min-height: 70px; resize: vertical; }
      .demo .row { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: end; }
      .demo .answer { background: var(--bg); border: 1px solid var(--border); border-left: 3px solid var(--good); border-radius: 8px; padding: 0.8rem 1rem; margin-top: 1rem; }
      .demo .answer h5 { margin: 0 0 0.3rem; color: var(--text-dim); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
      .demo .examples { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.5rem; }
      .demo .examples button { background: var(--bg-elev-2); border: 1px solid var(--border); color: var(--text-dim); font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: 999px; cursor: pointer; }
      .demo .examples button:hover { color: var(--text); border-color: var(--accent); }

      .trace { list-style: none; margin: 1rem 0 0; padding: 0; }
      .trace-step { display: flex; gap: 0.7rem; padding: 0.5rem 0; border-top: 1px dashed var(--border); }
      .trace-icon { font-size: 1.1rem; line-height: 1.4; }
      .trace-head { display: flex; gap: 0.5rem; align-items: baseline; }
      .trace-kind { font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.04em; }
      .trace-detail { font-size: 0.92rem; }
      .trace-hits { list-style: none; margin: 0.4rem 0 0; padding: 0; display: grid; gap: 0.25rem; }
      .trace-hits li { display: flex; gap: 0.6rem; font-size: 0.85rem; }
      .trace-hits .score { font-family: var(--mono); color: var(--accent); min-width: 3.5em; }
      .sim-bar { height: 8px; background: var(--bg-elev-2); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }
      .sim-bar > span { display: block; height: 100%; background: var(--accent); }
    `}</style>
  );
}
