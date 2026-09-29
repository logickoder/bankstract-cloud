# License

bankstract-cloud is AGPL-3.0. The copyleft is the moat. Do not weaken it.

- Every `.ts`, `.tsx`, `.py` file in `apps/` and `packages/` starts with the short notice in `LICENSE_HEADER.txt`:
  ```
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (C) 2026 Jeffery Orazulike
  ```
- The engine (`bankstract`, MIT) is a runtime dependency. It does not inherit AGPL.
- B2B consumers call us over HTTP. They do not inherit AGPL. Say so in docs whenever it comes up.
- A SaaS-hosted fork must open-source its modifications.
- `infra/` is the public self-host bundle that backs the claim. Keep it working: `docker compose -f infra/docker-compose.yml up --build`.
