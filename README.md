# AI·EDU — Learn AI Engineering by building

An open, hands-on curriculum that teaches the core techniques of modern AI
engineering — **RAG, Agentic RAG, Multi-Agent systems, and Agent Teams** — through
small, self-contained projects.

Every interactive demo runs **entirely in your browser** using a deterministic
**mock model** and **static datasets**. There are no API keys, no backend, and
nothing leaves your machine — which makes it perfect for learning and for hosting
free on **GitHub Pages**.

## What's inside

- **7 hands-on projects** — 3 foundational primers + 4 core techniques.
- **Two implementations each** — a live in-browser **JavaScript** demo plus a
  runnable **Python** version under [`python/`](python/).
- **Technical notes in the UI** — the mechanics of LLMs, prompting strategies, and
  architecture patterns, surfaced right next to the demos.
- **Curated resources** — foundational papers, guides, and tutorials.

| # | Project | Technique | Demo |
| --- | --- | --- | --- |
| 01 | Prompt Playground | Prompt engineering | persona + grounding |
| 02 | Embeddings & Vector Search | Semantic search | live similarity ranking |
| 03 | Tool / Function Calling | Function calling | tool-use loop |
| 04 | RAG | Retrieve-then-read | grounded answers + trace |
| 05 | Agentic RAG | Self-correcting retrieval | query rewrite loop |
| 06 | Multi-Agent System | Role specialisation | researcher → analyst → writer |
| 07 | Agent Teams | Orchestration | supervisor routing |

## Tech stack

- **[Astro](https://astro.build)** static site generator → static HTML for GitHub Pages.
- **Preact islands** for the interactive demos (tiny, hydrated client-side).
- **MDX** content collections for projects and technical notes.
- **Pure standard library** for the Python parity code.

## Run locally

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview  # serve the built site
```

Python projects:

```bash
cd python
python rag.py    # (and the other six scripts — see python/README.md)
```

## Deploy to GitHub Pages

1. In `astro.config.mjs`, set:
   - `site` to `https://<your-username>.github.io`
   - `base` to `/<your-repo-name>` (e.g. `/AI-EDU`). For a user/org page use `/`.
2. Push to the `main` branch. The workflow in
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and
   deploys automatically.
3. In the repo's **Settings → Pages**, set the source to **GitHub Actions**.

## How the mock engine works

To stay fully static and offline, the platform replaces real services with small,
deterministic stand-ins that teach the *exact* mechanics:

- **Embeddings** — a bag-of-words FNV-1a hashing vector + cosine similarity.
- **Mock LLM** — ranks context sentences by overlap with the prompt and quotes them.
- **Tools** — pure functions (calculator, dataset search, word count).
- **Pipelines** — RAG / Agentic RAG / multi-agent / agent-teams, each emitting a
  visible reasoning **trace**.

The JavaScript engine ([`src/lib/js`](src/lib/js)) and the Python engine
([`python/_shared`](python/_shared)) implement identical algorithms, so both
ecosystems produce matching results.

## Project structure

```
.
├── public/datasets/        # static JSON corpora
├── src/
│   ├── components/
│   │   ├── demos/          # Preact interactive islands + trace viewer
│   │   └── ui/             # Nav, Footer, CodeTabs
│   ├── content/
│   │   ├── projects/       # 7 project notes (MDX, with JS/Python code)
│   │   └── notes/          # standalone technical notes
│   ├── data/resources.json # curated reading list
│   ├── layouts/
│   ├── lib/js/             # the shared JS mock engine
│   ├── pages/              # home, roadmap, projects, notes, resources
│   └── styles/
└── python/                 # Python parity implementations
```

## License

MIT — see [`LICENSE`](LICENSE). Contributions and new project modules welcome.
