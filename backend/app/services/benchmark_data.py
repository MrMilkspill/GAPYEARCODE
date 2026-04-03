from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_json(name: str) -> Any:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


@lru_cache
def get_benchmark_config() -> dict[str, Any]:
    return _load_json("benchmark_config.json")


@lru_cache
def get_benchmark_sources() -> dict[str, Any]:
    return _load_json("benchmark_sources.json")
