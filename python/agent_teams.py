"""07 — Agent Teams: a supervisor routes to a team and merges the result.

Mirrors agentTeamsPipeline() in src/lib/js/agents.ts.
Run from the /python directory:  python agent_teams.py
"""
from __future__ import annotations

import re
from typing import Dict, List

from _shared.data import load_corpus
from _shared.mock_llm import decide_tool_call
from _shared.tools import run_tool
from multi_agent import multi_agent_pipeline
from rag import Trace


def agent_teams_pipeline(question: str, corpus: List[Dict]) -> Dict:
    t = Trace()
    p = question.lower()

    # A real arithmetic expression (e.g. "144 / 12") or an explicit compute keyword
    # routes to the quant team; everything else goes to the research team.
    is_math = bool(
        re.search(r"-?\d+(?:\.\d+)?\s*[+\-*/x]\s*-?\d+", p)
        or re.search(r"\b(calculate|compute|divide|multiply)\b", p)
    )
    route = "quant-team" if is_math else "research-team"
    t.add("supervisor", "route", f'Supervisor routed the task to the "{route}".')

    if route == "quant-team":
        tool_call = decide_tool_call(question) or {"tool": "calculator", "args": {"expression": question}}
        result = run_tool(tool_call["tool"], tool_call["args"], corpus)
        t.add("quant-team", "tool", f'Quant team computed the result with {tool_call["tool"]}.', {"result": result})
        answer = f'The quant team computed: {result["output"]}.'
    else:
        sub = multi_agent_pipeline(question, corpus)
        for s in sub["trace"]:
            t.add(f'research-team/{s["actor"]}', s["kind"], s["detail"], s["data"])
        answer = sub["answer"]

    t.add("supervisor", "answer", "Supervisor reviewed the team output and returned the final answer.", {"answer": answer})
    return {"answer": answer, "trace": t.steps}


if __name__ == "__main__":
    corpus = load_corpus("knowledge-base")
    for q in ("What is 144 / 12?", "Summarise multi-agent systems"):
        result = agent_teams_pipeline(q, corpus)
        print(f"Q: {q}\nANSWER: {result['answer']}\n")
