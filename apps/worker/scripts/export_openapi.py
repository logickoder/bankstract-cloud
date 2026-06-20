# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike
"""Export the worker's OpenAPI spec to JSON for the docs site.

Run from apps/worker when the API changes:
    uv run python scripts/export_openapi.py
Writes apps/docs/openapi.json (committed). The docs build consumes the file, so it
never needs a running worker. CI drift-checks that this output matches the code.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from bankstract_cloud.main import app

_DEFAULT_OUT = Path(__file__).resolve().parents[2] / "docs" / "openapi.json"


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else _DEFAULT_OUT
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(app.openapi(), indent=2) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
