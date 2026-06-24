"""A tiny tool registry for function-calling demos. Mirrors src/lib/js/tools.ts."""
from __future__ import annotations

import re
from typing import Dict, List

from .embeddings import retrieve


def calculator(args: Dict, corpus: List[Dict] | None = None) -> Dict:
    """Safely evaluate a single 'a OP b' arithmetic expression (no eval)."""
    expr = (args.get("expression") or "").replace("x", "*").replace("X", "*")
    m = re.search(r"(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)", expr)
    if not m:
        return {"tool": "calculator", "output": f'Could not parse expression: "{expr}"'}
    a, op, b = float(m.group(1)), m.group(2), float(m.group(3))
    if op == "+":
        r = a + b
    elif op == "-":
        r = a - b
    elif op == "*":
        r = a * b
    elif op == "/":
        r = float("nan") if b == 0 else a / b
    else:
        r = float("nan")
    if r != r:  # NaN check
        return {"tool": "calculator", "output": "undefined"}
    # Match JS number formatting: integers print without a trailing .0
    return {"tool": "calculator", "output": str(int(r) if r == int(r) else r)}


def dataset_search(args: Dict, corpus: List[Dict] | None = None) -> Dict:
    """Search the corpus and return the best matching snippet."""
    corpus = corpus or []
    if not corpus:
        return {"tool": "datasetSearch", "output": "No corpus available."}
    hits = retrieve(args.get("query", ""), corpus, k=1)
    if not hits:
        return {"tool": "datasetSearch", "output": "No matching document found."}
    top = hits[0]["doc"]
    return {"tool": "datasetSearch", "output": f"{top['title']}: {top['text']}"}


def word_count(args: Dict, corpus: List[Dict] | None = None) -> Dict:
    """Word count of a piece of text."""
    n = len((args.get("text") or "").split())
    return {"tool": "wordCount", "output": str(n)}


TOOL_REGISTRY = {
    "calculator": calculator,
    "datasetSearch": dataset_search,
    "wordCount": word_count,
}


def run_tool(name: str, args: Dict, corpus: List[Dict] | None = None) -> Dict:
    """Execute a named tool, returning a friendly error if unknown."""
    tool = TOOL_REGISTRY.get(name)
    if not tool:
        return {"tool": name, "output": f"Unknown tool: {name}"}
    return tool(args, corpus)
