"""02 — Embeddings & Vector Search (Python parity).

Ranks every document in the corpus against a query by cosine similarity.
Run from the /python directory:  python embeddings_demo.py
"""
from _shared.data import load_corpus
from _shared.embeddings import fake_embed, cosine_similarity

if __name__ == "__main__":
    corpus = load_corpus("knowledge-base")
    query = "how does retrieval work"

    q = fake_embed(query)
    scored = sorted(
        ((cosine_similarity(q, fake_embed(f"{d['title']} {d['text']}")), d) for d in corpus),
        key=lambda x: x[0],
        reverse=True,
    )

    print(f'Query: "{query}"\n')
    for rank, (score, doc) in enumerate(scored, 1):
        print(f"{rank:>2}. {score:.3f}  {doc['title']}")
