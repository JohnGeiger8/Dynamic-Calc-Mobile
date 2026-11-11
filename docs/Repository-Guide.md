# Repository guide

This is a navigation map, not a task tracker. Read [Development Workflow](Development-Workflow.md) for process, [Developer Setup](Developer-Setup.md) for commands, and the [design index](design/README.md) for intended behavior. Verify any design claim against code and current issue evidence before implementing it.

| Path | Role | Change guidance |
| --- | --- | --- |
| `index.html`, `*.html`, `css/`, `img/` | Inherited desktop calculator and Mastersheet entry points/assets | Inspect the actual script order and browser behavior; the desktop UI is not the proposed mobile UI. Preserve upstream notices. |
| `js/`, `backups/` | Inherited global UI controls, game adapters, data loaders, hooks, and trainer snapshots | Read the specific loader/hook before changing it. Some code and data are for unrelated games. Do not scan or rewrite the entire vendor/data tree for a narrow task. |
| `calc/src/`, `calc/test/`, `calc/` build files | Inherited Smogon calculation engine, source tests, and build | Follow [engine instructions](../calc/AGENTS.md). Generated `calc/dist/` and bundles derive from source. |
| `baselines/emerald-kaizo/` | Reviewed manifest, configuration, reference fixtures, schema, difference inventory, and discrepancy ledger | These are pinned inputs/evidence. Changing a lock or expected result requires provenance and review. |
| `scripts/baseline/` | Pinned fetch, offline verify, reference capture, audit, comparison, and tests | Follow [baseline instructions](../scripts/baseline/AGENTS.md). The comparison is the calculation gate. |
| `.baseline-cache/` | Ignored, retrieved upstream inputs and derived verification output | Regenerate via scripts; do not edit, commit, or use as a source of truth. |
| `.github/workflows/emerald-kaizo-baseline.yml` | Current CI gate | Runs pinned fetch, verify, tests, and 30 comparisons on `master` pushes and relevant PR paths. It does not cover every future UI path. |
| `cypress/` | Inherited desktop browser tests and fixtures | These are not the Battle prototype acceptance suite. Some fixtures are save files; avoid exposing private user saves. |
| `docs/design/` | Product intent, accepted baseline decisions, dated evidence | [UI Design](design/UI-Design.md) describes future mobile behavior; [baseline report](design/Emerald-Kaizo-Baseline-Report.md) records current supported calculation scope. |

The first mobile entry point and its component boundary are planned in [issue #16](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/16); [issue #15](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/15) owns stack selection. No mobile directory or build gate exists yet. The current browser preview is the inherited desktop calculator.

## Which source is authoritative?

- **Requirements and decisions:** accepted design sections and the issue's scope/acceptance criteria. The UI specification is initial design intent, with implementation pending. [Emerald Kaizo baseline](design/Emerald-Kaizo-Baseline.md) accepts the original/unversioned dataset and pinned comparison approach.
- **Observed behavior:** current code, tests, and reproducible comparisons. A green reference comparison proves parity for recorded cases, not game accuracy or mobile UI completion.
- **Historical evidence:** dated findings and PR/CI links in the baseline documents. Keep original dates/results; change present-tense review status only after verifying GitHub state.
- **Generated files:** `.baseline-cache/`, Node dependencies, Cypress screenshots/downloads, and `calc/` build output. Regenerate from source and lockfiles when needed; inspect any generated diff before committing.

The repository is a fork of [hzla/Dynamic-Calc](https://github.com/hzla/Dynamic-Calc). The Emerald Kaizo comparison separately pins [hzla/Dynamic-Calc-Decomps](https://github.com/hzla/Dynamic-Calc-Decomps) and its upstream trainer-data lineage. Their content and mechanics are not interchangeable. Preserve inherited MIT/license notices and attribution.
