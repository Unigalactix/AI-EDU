"""Load the same static JSON datasets the web demos use."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

# /python/_shared/data.py -> repo root is two levels up.
DATASETS_DIR = Path(__file__).resolve().parents[2] / "public" / "datasets"


def load_corpus(name: str) -> List[Dict]:
    """Load /public/datasets/<name>.json as a list of document dicts."""
    path = DATASETS_DIR / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(f'Dataset "{name}" not found at {path}')
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)
