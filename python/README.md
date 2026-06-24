# Python parity implementations

These scripts mirror the in-browser JavaScript demos exactly, so you can study
the same techniques in Python. Everything uses only the **Python standard
library** — no API keys, no installs, fully offline and deterministic.

## Run them

From this `python/` directory:

```bash
python prompting.py        # 01 · Prompt Playground
python embeddings_demo.py  # 02 · Embeddings & Vector Search
python tools_demo.py       # 03 · Tool / Function Calling
python rag.py              # 04 · RAG
python agentic_rag.py      # 05 · Agentic RAG
python multi_agent.py      # 06 · Multi-Agent System
python agent_teams.py      # 07 · Agent Teams
```

> Run the scripts **from this folder** so the `_shared` package and the dataset
> path (`../public/datasets`) resolve correctly.

## Layout

| Path | Mirrors (JS) | Purpose |
| --- | --- | --- |
| `_shared/embeddings.py` | `src/lib/js/embeddings.ts` | Deterministic embeddings, cosine similarity, top-k retrieval |
| `_shared/mock_llm.py` | `src/lib/js/mockLLM.ts` | Offline mock model + tool-call decision |
| `_shared/tools.py` | `src/lib/js/tools.ts` | Calculator / dataset-search / word-count tools |
| `_shared/data.py` | `loadCorpus` in `src/lib/js/index.ts` | Loads the shared `/public/datasets` JSON |
| `rag.py` … `agent_teams.py` | `src/lib/js/agents.ts` | The four core pipelines, each emitting a trace |

The algorithms (the FNV-1a hashing embedding, the threshold in Agentic RAG, the
routing rule in Agent Teams) are identical to the JS engine, so both ecosystems
produce matching results.
