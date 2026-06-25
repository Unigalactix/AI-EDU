/**
 * Tiny localStorage-backed progress store. Tracks which projects a learner has
 * marked complete and their best quiz scores. Everything stays on-device — no
 * accounts, no backend. Safe to import in browser islands only.
 */

const DONE_KEY = 'aiedu-completed';
const QUIZ_KEY = 'aiedu-quiz-scores';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Let other islands on the page react (e.g. the homepage progress bar).
    window.dispatchEvent(new CustomEvent('aiedu-progress'));
  } catch {
    /* storage unavailable (private mode); fail silently */
  }
}

export function getCompleted(): string[] {
  return read<string[]>(DONE_KEY, []);
}

export function isCompleted(slug: string): boolean {
  return getCompleted().includes(slug);
}

export function setCompleted(slug: string, done: boolean): void {
  const set = new Set(getCompleted());
  if (done) set.add(slug);
  else set.delete(slug);
  write(DONE_KEY, [...set]);
}

export function getQuizScores(): Record<string, { score: number; total: number }> {
  return read<Record<string, { score: number; total: number }>>(QUIZ_KEY, {});
}

/** Record a quiz result, keeping the best score for that key. */
export function recordQuizScore(key: string, score: number, total: number): void {
  const all = getQuizScores();
  const prev = all[key];
  if (!prev || score > prev.score) {
    all[key] = { score, total };
    write(QUIZ_KEY, all);
  }
}
