/**
 * SearchBox — a lightweight client-side site search. Renders a trigger in the
 * nav; opening it loads a small static index (/search.json) once and filters in
 * the browser. Keyboard: Ctrl/⌘+K or "/" to open, Esc to close, ↑/↓ to move,
 * Enter to go. No backend required.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

interface Entry {
  type: string;
  title: string;
  summary: string;
  keywords: string;
  url: string;
}

interface Props {
  base: string;
}

export default function SearchBox({ base }: Props) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const link = (p: string) => `${base}/${p}`.replace(/\/+/g, '/');

  // Load the index lazily the first time the box opens.
  useEffect(() => {
    if (open && entries.length === 0) {
      fetch(link('search.json'))
        .then((r) => r.json())
        .then(setEntries)
        .catch(() => setEntries([]));
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  // Global shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !open && !/input|textarea/i.test((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 8);
    return entries
      .filter((e) => `${e.title} ${e.summary} ${e.keywords}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, entries]);

  useEffect(() => setActive(0), [query]);

  function onListKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && results[active]) { window.location.href = link(results[active].url); }
  }

  return (
    <>
      <button type="button" class="icon-btn search-trigger" onClick={() => setOpen(true)} aria-label="Search">
        <span aria-hidden="true">🔎</span>
        <span class="search-trigger-label">Search</span>
        <kbd>/</kbd>
      </button>

      {open && (
        <div class="sx-overlay" onClick={() => setOpen(false)}>
          <div class="sx-modal" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              class="sx-input"
              type="text"
              placeholder="Search projects, notes, tools…"
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
              onKeyDown={onListKey}
            />
            <ul class="sx-results">
              {results.length === 0 && <li class="sx-empty">No matches.</li>}
              {results.map((r, i) => (
                <li>
                  <a class={`sx-item ${i === active ? 'active' : ''}`} href={link(r.url)} onMouseEnter={() => setActive(i)}>
                    <span class="sx-type">{r.type}</span>
                    <span class="sx-text">
                      <span class="sx-title">{r.title}</span>
                      <span class="sx-summary">{r.summary}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <div class="sx-foot"><kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close</div>
          </div>
        </div>
      )}

      <style>{`
        .search-trigger-label { display: inline; }
        @media (max-width: 860px) { .search-trigger-label { display: none; } .search-trigger kbd { display: none; } }
        .sx-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: flex-start; padding-top: 12vh; z-index: 100; }
        .sx-modal { width: min(560px, 92vw); background: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: 0 20px 60px rgba(0,0,0,0.4); overflow: hidden; }
        .sx-input { width: 100%; box-sizing: border-box; border: none; border-bottom: 1px solid var(--border); background: var(--bg); color: var(--text); padding: 1rem 1.1rem; font-size: 1rem; outline: none; }
        .sx-results { list-style: none; margin: 0; padding: 0.4rem; max-height: 50vh; overflow-y: auto; }
        .sx-empty { color: var(--text-dim); padding: 1rem; text-align: center; }
        .sx-item { display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem 0.7rem; border-radius: 8px; color: inherit; }
        .sx-item:hover, .sx-item.active { background: var(--bg-elev-2); text-decoration: none; }
        .sx-type { flex: none; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; color: var(--accent); width: 56px; }
        .sx-text { display: flex; flex-direction: column; }
        .sx-title { font-weight: 600; }
        .sx-summary { font-size: 0.83rem; color: var(--text-dim); }
        .sx-foot { border-top: 1px solid var(--border); padding: 0.5rem 0.8rem; font-size: 0.78rem; color: var(--text-dim); }
        .sx-foot kbd { font-family: var(--mono); border: 1px solid var(--border); border-radius: 4px; padding: 0.02rem 0.3rem; margin: 0 0.1rem; }
      `}</style>
    </>
  );
}
