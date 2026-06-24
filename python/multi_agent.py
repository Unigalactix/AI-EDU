"""06 — Multi-Agent: researcher -> analyst -> writer hand off in sequence.

Mirrors multiAgentPipeline() in src/lib/js/agents.ts.
Run from the /python directory:  python multi_agent.py
"""
from __future__ import annotations

from typing import Dict, List

from _shared.data import load_corpus
from _shared.embeddings import retrieve
from _shared.mock_llm import mock_llm, decide_tool_call
from _shared.tools import run_tool
from rag import Trace


def multi_agent_pipeline(question: str, corpus: List[Dict]) -> Dict:
    t = Trace()

    # Researcher gathers evidence.
    hits = retrieve(question, corpus, 3)
    t.add("researcher", "retrieve", "Researcher gathered supporting evidence.", hits)
    evidence = [h["doc"]["text"] for h in hits]

    # Analyst extracts the key point, optionally using a tool.
    tool_call = decide_tool_call(question)
    if tool_call:
        result = run_tool(tool_call["tool"], tool_call["args"], corpus)
        t.add("analyst", "tool", f'Analyst called {tool_call["tool"]}.', {"toolCall": tool_call, "result": result})
        analyst_note = f'Tool {tool_call["tool"]} returned: {result["output"]}.'
    else:
        analyst_note = mock_llm(question, context=evidence, system="concise analyst", max_sentences=2)
        t.add("analyst", "think", "Analyst summarised the evidence.", {"analystNote": analyst_note})

    # Writer composes the final answer.
    answer = mock_llm(question, context=[*evidence, analyst_note], system="explain clearly")
    t.add("writer", "answer", "Writer composed the final response from evidence + analysis.", {"answer": answer})

    return {"answer": answer, "trace": t.steps}


if __name__ == "__main__":
    corpus = load_corpus("knowledge-base")
    result = multi_agent_pipeline("Why do agents use tools?", corpus)
    print("ANSWER:", result["answer"], "\n")
    for s in result["trace"]:
        print(f'{s["step"]}. [{s["kind"]}] {s["actor"]}: {s["detail"]}')
