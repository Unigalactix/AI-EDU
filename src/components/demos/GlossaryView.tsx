/**
 * GlossaryView — a filterable list of definitions. Type to filter or pick a
 * category. Pure client-side; reads from the static glossary data module.
 */
import { useMemo, useState } from 'preact/hooks';
import { GLOSSARY, GLOSSARY_CATEGORIES, type Term } from '../../data/glossary';

type Filter = 'all' | Term['category'];

export default function GlossaryView() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GLOSSARY.filter((t) => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (!needle) return true;
      return `${t.term} ${t.short}`.toLowerCase().includes(needle);
    });
  }, [q, cat]);

  const cats: Filter[] = ['all', 'core', 'models', 'retrieval', 'agents'];

  return (
    <div class="gl">
      <div class="gl-controls">
        <input
          class="gl-search"
          type="text"
          placeholder="Filter terms…"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        />
        <div class="gl-cats">
          {cats.map((c) => (
            <button type="button" class={`gl-cat ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {c === 'all' ? 'All' : GLOSSARY_CATEGORIES[c]}
            </button>
          ))}
        </div>
      </div>

      <p class="gl-count">{filtered.length} term{filtered.length === 1 ? '' : 's'}</p>

      <dl class="gl-list">
        {filtered.map((t) => (
          <div class="gl-item">
            <dt>
              {t.term}
              <span class="gl-tag">{GLOSSARY_CATEGORIES[t.category]}</span>
            </dt>
            <dd>{t.short}</dd>
          </div>
        ))}
        {filtered.length === 0 && <p class="gl-empty">No terms match your filter.</p>}
      </dl>

      <style>{`
        .gl-controls { display: flex; flex-wrap: wrap; gap: 0.8rem; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
        .gl-search { flex: 1 1 220px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 0.55rem 0.75rem; font-size: 0.95rem; }
        .gl-cats { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .gl-cat { background: var(--bg-elev-2); border: 1px solid var(--border); color: var(--text-dim); border-radius: 999px; padding: 0.3rem 0.8rem; font-size: 0.82rem; cursor: pointer; }
        .gl-cat:hover { color: var(--text); }
        .gl-cat.active { color: var(--text); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, var(--bg-elev-2)); }
        .gl-count { color: var(--text-dim); font-size: 0.85rem; margin: 0.4rem 0 1rem; }
        .gl-list { display: grid; gap: 0.8rem; margin: 0; }
        .gl-item { border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-elev); padding: 0.9rem 1.1rem; }
        .gl-item dt { font-weight: 700; display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
        .gl-item dd { margin: 0.35rem 0 0; color: var(--text-dim); font-size: 0.93rem; }
        .gl-tag { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); padding: 0.1rem 0.45rem; border-radius: 999px; }
        .gl-empty { color: var(--text-dim); }
      `}</style>
    </div>
  );
}
