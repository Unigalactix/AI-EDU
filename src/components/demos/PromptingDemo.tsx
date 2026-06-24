/**
 * PromptingDemo — a prompt playground. Learners compare a bare prompt vs the
 * same prompt with a persona (system) and grounding context, and see how the
 * mock model's output changes. Teaches prompt structure & grounding.
 */
import { useState } from 'preact/hooks';
import { mockLLM } from '@lib/js';
import { DemoShell, Field } from './DemoShell';

const PERSONAS = ['', 'concise analyst', 'patient teacher explaining', 'critical reviewer'];

export default function PromptingDemo() {
  const [prompt, setPrompt] = useState('Summarise why grounding reduces hallucination.');
  const [system, setSystem] = useState(PERSONAS[1]);
  const [context, setContext] = useState(
    'Grounding means giving the model trusted source text to answer from. When the model quotes retrieved context instead of relying on memory, it is less likely to invent facts (hallucinate).'
  );
  const [useContext, setUseContext] = useState(true);
  const [out, setOut] = useState('');

  function run() {
    setOut(
      mockLLM(prompt, {
        system,
        context: useContext && context.trim() ? [context] : [],
      })
    );
  }

  return (
    <DemoShell title="Prompt playground">
      <Field label="Prompt (user message)">
        <textarea value={prompt} onInput={(e) => setPrompt((e.target as HTMLTextAreaElement).value)} />
      </Field>
      <Field label="Persona (system message)">
        <select value={system} onInput={(e) => setSystem((e.target as HTMLSelectElement).value)}>
          {PERSONAS.map((p) => (
            <option value={p}>{p || '(none)'}</option>
          ))}
        </select>
      </Field>
      <Field label="Grounding context">
        <textarea value={context} onInput={(e) => setContext((e.target as HTMLTextAreaElement).value)} />
      </Field>
      <div class="row">
        <label style="display:flex; gap:0.4rem; align-items:center; font-size:0.9rem; color:var(--text-dim);">
          <input
            type="checkbox"
            checked={useContext}
            onChange={(e) => setUseContext((e.target as HTMLInputElement).checked)}
          />
          Include context
        </label>
        <button class="btn" onClick={run}>Generate</button>
      </div>
      {out && (
        <div class="answer">
          <h5>Model output</h5>
          <div>{out}</div>
        </div>
      )}
    </DemoShell>
  );
}
