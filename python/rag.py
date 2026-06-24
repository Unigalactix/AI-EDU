"""04 — Classic RAG: retrieve once, then generate a grounded answer.

Mirrors ragPipeline() in src/lib/js/agents.ts.
Run from the /python directory:  python rag.py
"""
from __future__ import annotations

from typing import Dict, List

from _shared.data import load_corpus
from _shared.embeddings import retrieve
from _shared.mock_llm import mock_llm


class Trace:
    """Incrementally builds a list of trace steps for the UI / console."""

    def __init__(self) -> None:
        self.steps: List[Dict] = []

    def add(self, actor: str, kind: str, detail: str, data=None) -> None:
        self.steps.append({"step": len(self.steps) + 1, "actor": actor, "kind": kind, "detail": detail, "data": data})


def rag_pipeline(question: str, corpus: List[Dict], k: int = 3) -> Dict:
    t = Trace()
    t.add("user", "think", f'Question received: "{question}"')

    hits = retrieve(question, corpus, k)
    t.add("retriever", "retrieve", f"Retrieved top {len(hits)} chunks by cosine similarity.", hits)

    context = [h["doc"]["text"] for h in hits]
    answer = mock_llm(question, context=context)
    t.add("generator", "answer", "Generated an answer grounded in the retrieved context.", {"answer": answer})

    return {"answer": answer, "trace": t.steps}


if __name__ == "__main__":
    corpus = load_corpus("knowledge-base")
    result = rag_pipeline("What is retrieval augmented generation?", corpus)
    print("ANSWER:", result["answer"], "\n")
    for s in result["trace"]:
        print(f'{s["step"]}. [{s["kind"]}] {s["actor"]}: {s["detail"]}')
