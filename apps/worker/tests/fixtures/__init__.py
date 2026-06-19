# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

# Synthetic test data only. NEVER a real bank statement (privacy rule, mirrors engine).
# This minimal PDF parses as a valid PDF container but matches no registered bank
# parser, so the engine returns ParseError -> the worker maps it to HTTP 422.

MINIMAL_PDF: bytes = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
