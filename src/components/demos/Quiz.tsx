/**
 * Quiz — a self-contained knowledge check for a project. Pick answers, submit,
 * and see your score with per-question explanations. The best score is saved to
 * localStorage so returning learners see their progress.
 */
import { useMemo, useState } from 'preact/hooks';
import { QUIZZES } from '../../data/quizzes';
import { recordQuizScore } from '../../lib/progress';

interface Props {
  slug: string;
}

export default function Quiz({ slug }: Props) {
  const questions = QUIZZES[slug] ?? [];
  const [picked, setPicked] = useState<number[]>(() => questions.map(() => -1));
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () => questions.reduce((s, q, i) => s + (picked[i] === q.answer ? 1 : 0), 0),
    [picked, questions],
  );

  if (questions.length === 0) return null;

  const allAnswered = picked.every((v) => v >= 0);

  function submit() {
    if (!allAnswered) return;
    setSubmitted(true);
    recordQuizScore(slug, score, questions.length);
  }

  function reset() {
    setPicked(questions.map(() => -1));
    setSubmitted(false);
  }

  return (
    <div class="quiz">
      <div class="quiz-head">
        <h3>✅ Knowledge check</h3>
        {submitted && (
          <span class={`quiz-score ${score === questions.length ? 'perfect' : ''}`}>
            {score} / {questions.length}
          </span>
        )}
      </div>

      <ol class="quiz-list">
        {questions.map((q, i) => (
          <li class="quiz-q">
            <p class="quiz-prompt">{q.q}</p>
            <div class="quiz-opts">
              {q.options.map((opt, oi) => {
                const isPicked = picked[i] === oi;
                const isCorrect = oi === q.answer;
                let cls = 'quiz-opt';
                if (submitted) {
                  if (isCorrect) cls += ' correct';
                  else if (isPicked) cls += ' wrong';
                } else if (isPicked) cls += ' picked';
                return (
                  <button
                    type="button"
                    class={cls}
                    disabled={submitted}
                    onClick={() => setPicked((prev) => prev.map((v, idx) => (idx === i ? oi : v)))}
                  >
                    <span class="quiz-mark">
                      {submitted && isCorrect ? '✓' : submitted && isPicked ? '✕' : String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {submitted && <p class="quiz-explain">{q.explain}</p>}
          </li>
        ))}
      </ol>

      <div class="quiz-actions">
        {!submitted ? (
          <button class="btn" type="button" disabled={!allAnswered} onClick={submit}>
            Check answers
          </button>
        ) : (
          <button class="btn secondary" type="button" onClick={reset}>
            Try again
          </button>
        )}
        {!submitted && !allAnswered && (
          <span class="quiz-hint">Answer all {questions.length} questions to check.</span>
        )}
      </div>

      <style>{`
        .quiz { border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-elev); padding: 1.25rem; margin: 2rem 0 0; }
        .quiz-head { display: flex; align-items: center; justify-content: space-between; }
        .quiz-head h3 { margin: 0; }
        .quiz-score { font-family: var(--mono); font-weight: 700; background: var(--bg-elev-2); border: 1px solid var(--border); border-radius: 999px; padding: 0.2rem 0.7rem; }
        .quiz-score.perfect { color: var(--good); border-color: var(--good); }
        .quiz-list { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: 1.25rem; }
        .quiz-prompt { font-weight: 600; margin: 0 0 0.6rem; }
        .quiz-opts { display: grid; gap: 0.4rem; }
        .quiz-opt {
          display: flex; align-items: center; gap: 0.6rem; text-align: left;
          background: var(--bg); border: 1px solid var(--border); color: var(--text);
          padding: 0.55rem 0.75rem; border-radius: 8px; cursor: pointer; font-size: 0.92rem;
        }
        .quiz-opt:hover:not(:disabled) { border-color: var(--accent); }
        .quiz-opt:disabled { cursor: default; }
        .quiz-opt.picked { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--bg)); }
        .quiz-opt.correct { border-color: var(--good); background: color-mix(in srgb, var(--good) 14%, var(--bg)); }
        .quiz-opt.wrong { border-color: var(--warn); background: color-mix(in srgb, var(--warn) 12%, var(--bg)); }
        .quiz-mark {
          flex: none; width: 22px; height: 22px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--bg-elev-2); border: 1px solid var(--border);
          font-size: 0.78rem; font-weight: 700; font-family: var(--mono);
        }
        .quiz-explain { font-size: 0.88rem; color: var(--text-dim); margin: 0.5rem 0 0; padding-left: 0.2rem; border-left: 2px solid var(--accent); padding-left: 0.7rem; }
        .quiz-actions { display: flex; align-items: center; gap: 0.8rem; margin-top: 1.25rem; }
        .quiz-hint { font-size: 0.85rem; color: var(--text-dim); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
