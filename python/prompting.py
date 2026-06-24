"""01 — Prompt Playground (Python parity).

Compares a bare prompt vs. the same prompt with a persona + grounding context.
Run from the /python directory:  python prompting.py
"""
from _shared.mock_llm import mock_llm

CONTEXT = (
    "Grounding means giving the model trusted source text to answer from. "
    "When the model quotes retrieved context instead of relying on memory, "
    "it is less likely to invent facts (hallucinate)."
)

if __name__ == "__main__":
    prompt = "Why does grounding reduce hallucination?"

    print("WITHOUT context:")
    print(" ", mock_llm(prompt), "\n")

    print("WITH persona + context:")
    print(" ", mock_llm(prompt, system="concise analyst", context=[CONTEXT]))
