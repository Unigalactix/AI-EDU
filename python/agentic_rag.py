"""05 — Agentic RAG: judge relevance, rewrite the query, retrieve again.

Mirrors agenticRagPipeline() in src/lib/js/agents.ts.
Run from the /python directory:  python agentic_rag.py
"""
from __future__ import annotations

from typing import Dict, List

from _shared.data import load_corpus
from _shared.embeddings import retrieve
from _shared.mock_llm import mock_llm
from rag import Trace

SCORE_THRESHOLD = 0.15


def agentic_rag_pipeline(question: str, corpus: List[Dict], k: int = 3) -> Dict:
    t = Trace()
    query = question
    t.add("agent", "plan", "Plan: retrieve, judge relevance, rewrite query if weak, then answer.")

    hits = retrieve(query, corpus, k)
    t.add("retriever", "retrieve", f'Pass 1 retrieval for "{query}".', hits)

    best = hits[0]["score"] if hits else 0.0
    t.add("agent", "critique", f"Top similarity = {best:.3f} (threshold {SCORE_THRESHOLD}).")

    if best < SCORE_THRESHOLD:
        expansion = hits[0]["doc"]["title"] if hits else ""
        query = f"{question} {expansion}".strip()
        t.add("agent", "think", f'Relevance low — rewriting query to: "{query}".')
        hits = retrieve(query, corpus, k)
        t.add("retriever", "retrieve", "Pass 2 retrieval after query rewrite.", hits)
    else:
        t.add("agent", "think", "Relevance sufficient — no rewrite needed.")

    context = [h["doc"]["text"] for h in hits]
    answer = mock_llm(question, context=context)
    t.add("generator", "answer", "Generated grounded answer from the best available context.", {"answer": answer})

    return {"answer": answer, "trace": t.steps}


if __name__ == "__main__":
    corpus = load_corpus("knowledge-base")
    result = agentic_rag_pipeline("how does it correct itself", corpus)
    print("ANSWER:", result["answer"], "\n")
    for s in result["trace"]:
        print(f'{s["step"]}. [{s["kind"]}] {s["actor"]}: {s["detail"]}')
