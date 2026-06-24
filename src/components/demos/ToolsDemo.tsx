/**
 * ToolsDemo — shows function calling. The mock model inspects the prompt,
 * decides whether to call a tool, the tool runs, and the result is folded back
 * into the final answer. Teaches the tool-use loop behind every agent.
 */
import { useEffect, useState } from 'preact/hooks';
import { loadCorpus, decideToolCall, runTool, mockLLM, type Doc, type ToolCall, type ToolResult } from '@lib/js';
import { DemoShell, Field } from './DemoShell';

interface Props {
  dataset: string;
  base: string;
  examples?: string[];
}

export default function ToolsDemo({ dataset, base, examples = [] }: Props) {
  const [corpus, setCorpus] = useState<Doc[]>([]);
  const [prompt, setPrompt] = useState(examples[0] ?? 'What is 23 * 19?');
  const [call, setCall] = useState<ToolCall | null>(null);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    loadCorpus(dataset, base).then(setCorpus).catch(() => {});
  }, [dataset, base]);

  function run(p: string = prompt) {
    const decided = decideToolCall(p);
    setCall(decided);
    if (decided) {
      const r = runTool(decided.tool, decided.args, corpus);
      setResult(r);
      setAnswer(mockLLM(p, { context: [`Tool ${r.tool} returned: ${r.output}`] }));
    } else {
      setResult(null);
      setAnswer(mockLLM(p));
    }
  }

  return (
    <DemoShell title="Function / tool calling">
      <Field label="Prompt">
        <input type="text" value={prompt} onInput={(e) => setPrompt((e.target as HTMLInputElement).value)} />
      </Field>
      <div class="row">
        <button class="btn" onClick={() => run()}>Run</button>
      </div>
      {examples.length > 0 && (
        <div class="examples">
          {examples.map((ex) => (
            <button onClick={() => { setPrompt(ex); run(ex); }}>{ex}</button>
          ))}
        </div>
      )}
      <div style="margin-top:1rem; display:grid; gap:0.5rem;">
        <div class="chip">{call ? `🛠️ tool chosen: ${call.tool}(${JSON.stringify(call.args)})` : '💭 no tool needed — answered directly'}</div>
        {result && <div class="chip">↩️ tool output: {result.output}</div>}
      </div>
      {answer && (
        <div class="answer">
          <h5>Final answer</h5>
          <div>{answer}</div>
        </div>
      )}
    </DemoShell>
  );
}
