# Baseline validation scope

The root [agent instructions](../../AGENTS.md) also apply. These scripts fetch, verify, capture, audit, and compare the pinned original/unversioned Emerald Kaizo inputs. Read the [baseline report](../../docs/design/Emerald-Kaizo-Baseline-Report.md) and [baseline record](../../docs/design/Emerald-Kaizo-Baseline.md) before editing them.

- Keep retrieval commit-addressed and checksum checked before executing upstream code. A missing or corrupt cache is an explicit failure; never fall back to a mutable branch or another dataset.
- `baselines/emerald-kaizo/` contains reviewed locks, fixtures, and discrepancy records. `.baseline-cache/` contains ignored fetched and derived output. Change locks or expectations only with source/provenance evidence and issue review.
- Run the [full baseline sequence](../../docs/Developer-Setup.md#validation-by-change), including the deliberate-mismatch test. Describe changed case IDs, roll shape, and KO differences rather than reporting only a pass count.
