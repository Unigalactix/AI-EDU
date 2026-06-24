"""Deterministic, offline 'embeddings' for teaching semantic search.

Identical algorithm to src/lib/js/embeddings.ts: a bag-of-words hashing vector
(FNV-1a) into 64 buckets, L2-normalised, compared with cosine similarity.
"""
from __future__ import annotations

import math
import re
from typing import Dict, List

DIMS = 64


def tokenize(text: str) -> List[str]:
    """Lowercase and split into word tokens."""
    return [t for t in re.sub(r"[^a-z0-9\s]", " ", text.lower()).split() if t]


def _hash_token(token: str) -> int:
    """Stable FNV-1a hash -> 32-bit unsigned int (matches the JS version)."""
    h = 0x811C9DC5
    for ch in token:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def fake_embed(text: str) -> List[float]:
    """Map text to a fixed-length, L2-normalised vector."""
    vec = [0.0] * DIMS
    for token in tokenize(text):
        vec[_hash_token(token) % DIMS] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Cosine similarity of two equal-length vectors (dot product when normalised)."""
    return sum(x * y for x, y in zip(a, b))


def retrieve(query: str, corpus: List[Dict], k: int = 3) -> List[Dict]:
    """Return the top-k most similar documents as {'doc': ..., 'score': ...}."""
    q = fake_embed(query)
    scored = [
        {"doc": doc, "score": cosine_similarity(q, fake_embed(f"{doc['title']} {doc['text']}"))}
        for doc in corpus
    ]
    scored.sort(key=lambda h: h["score"], reverse=True)
    return scored[:k]
