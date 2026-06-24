"""A deterministic 'mock LLM'. Mirrors src/lib/js/mockLLM.ts.

It reads the prompt + optional grounding context, can decide to emit a tool
call, and produces a grounded, templated answer that quotes the context.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional


def decide_tool_call(prompt: str) -> Optional[Dict]:
    """Decide whether the 'model' wants to call a tool (keyword intent)."""
    p = prompt.lower()

    math_match = re.search(r"(-?\d+(?:\.\d+)?)\s*([+\-*/x])\s*(-?\d+(?:\.\d+)?)", p)
    if math_match:
        return {
            "tool": "calculator",
            "args": {"expression": f"{math_match.group(1)} {math_match.group(2)} {math_match.group(3)}"},
        }

    if re.search(r"\b(look ?up|search|find|retrieve|what is|who is|define)\b", p):
        query = re.sub(r".*\b(look ?up|search|find|retrieve|what is|who is|define)\b", "", prompt, flags=re.I).strip()
        return {"tool": "datasetSearch", "args": {"query": query or prompt}}

    return None


def _describe_persona(system: str) -> str:
    s = system.lower()
    if "terse" in s or "concise" in s:
        return "[concise]"
    if "teacher" in s or "explain" in s:
        return "[explaining clearly]"
    if "critic" in s or "review" in s:
        return "[reviewing critically]"
    if "planner" in s or "plan" in s:
        return "[planning]"
    return ""


def mock_llm(
    prompt: str,
    context: Optional[List[str]] = None,
    system: str = "",
    max_sentences: int = 3,
) -> str:
    """Generate a deterministic answer from a prompt and optional context."""
    context = context or []
    prompt_tokens = set(re.sub(r"[^a-z0-9\s]", " ", prompt.lower()).split())
    persona = f"{_describe_persona(system)} " if system and _describe_persona(system) else ""

    if not context:
        return (
            f"{persona}Based on general reasoning (no sources retrieved), here is a concise take on "
            f'"{prompt.strip()}": this looks like a request that would benefit from retrieving '
            "supporting context before answering."
        )

    sentences: List[str] = []
    for chunk in context:
        sentences.extend(s.strip() for s in re.split(r"(?<=[.!?])\s+", chunk) if s.strip())

    ranked = []
    for s in sentences:
        tokens = re.sub(r"[^a-z0-9\s]", " ", s.lower()).split()
        overlap = sum(1 for t in tokens if t in prompt_tokens)
        ranked.append((overlap, s))
    ranked.sort(key=lambda x: x[0], reverse=True)

    top = [s for overlap, s in ranked[:max_sentences] if overlap > 0]
    body = " ".join(top) if top else " ".join(sentences[:max_sentences])
    return f"{persona}{body}"
