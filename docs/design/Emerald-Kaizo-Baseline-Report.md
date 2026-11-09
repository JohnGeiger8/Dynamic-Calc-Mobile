# Emerald Kaizo baseline report

- **Date:** 2026-11-08
- **Status:** Proposed for [issue #7](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/7) review
- **Goal:** State the reproducible Emerald Kaizo calculation baseline, its evidence and limits, and the procedure for keeping it accurate.
- **Scope:** The pinned original/unversioned Emerald Kaizo data and ordinary Singles damage comparisons. This report does not certify game accuracy against a ROM or release the mobile interface.

## Baseline decision and identity

The accepted first-game target is **Emerald Kaizo (original/unversioned)**, identified as `emerald-kaizo-original` in the [manifest](../../baselines/emerald-kaizo/manifest.json). Emerald Kaizo 1.1 is a separate dataset and is excluded. The game source has not been tied to an authoritative patch or ROM hash. The 1,744 trainer sets and their lineage are documented in the [baseline record](Emerald-Kaizo-Baseline.md#accepted-baseline).

| Component | Pinned revision | Role |
| --- | --- | --- |
| [Original fork parent](https://github.com/hzla/Dynamic-Calc/commit/42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74) | `42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74` | Preserved upstream ancestry |
| [Linked Decomps reference](https://github.com/hzla/Dynamic-Calc-Decomps/commit/883e9837e6281dd9d6963b935b6cda1dbe101293) | `883e9837e6281dd9d6963b935b6cda1dbe101293` | Selected calculator, settings, and `ek2.js` snapshot |
| [Trainer-data source](https://github.com/anastarawneh/pokemon-damage-calc/commit/15ae28de8310f6442f1302f1709b0bf792d1e131) | `15ae28de8310f6442f1302f1709b0bf792d1e131` | Snapshot lineage |
| [Mobile fork after reconciliation](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/commit/cdc62f31711c0cb45756f3badd054ab53c397b8f) | `cdc62f31711c0cb45756f3badd054ab53c397b8f` | Merged result of issues #1–#6 |

The [manifest](../../baselines/emerald-kaizo/manifest.json) records byte lengths and SHA-256 hashes for 26 upstream inputs and both generated outputs. It pins the selected `backups/ek2.js` to SHA-256 `93b0732ccd62c434f4dac95f47e9f1c83412efc4c95326c75dbfc28f722d99c0`. The [configuration](../../baselines/emerald-kaizo/configuration.json) records the effective settings and ordinary field defaults, while the [fixtures](../../baselines/emerald-kaizo/reference-fixtures.json) pin reference results and provenance. Source changes require review; the live linked website may change independently.

## Calculations covered

The selected reference uses Generation 3 damage mechanics and type chart, a Generation 8 base species/engine-move pool with snapshot overrides, and a Generation 9 UI move picker. The effective critical selector is 5, yielding a 2× critical multiplier for the captured Gen 3 path. Damaging moves use Gen 3 type-based physical/special categories; the physical/special split is disabled. Ordinary field defaults to Singles, clear weather and terrain, no hazards or screens, and no badge or partner effects. Inputs in the fixtures override defaults explicitly. The full setting and loader evidence is in the [baseline record](Emerald-Kaizo-Baseline.md#effective-configuration-and-evidence).

The 30 pinned cases compare both attack directions, physical and special attacks, one status move, type interactions, stats, abilities, items, boosts, critical hits, weather, screens, current HP, residual damage, switching Pursuit, and Double Kick. The runner compares raw damage rolls and hit-array shape, HP and derived percentage ranges, and available KO chance, turns, and wording. Only whitespace runs in KO text are normalized. The cases are reference examples, not a claim that every combination is legal in game. See the [fixture coverage](Emerald-Kaizo-Baseline.md#pinned-reference-calculation-fixtures) and [runner behavior](Emerald-Kaizo-Baseline.md#fork-comparison-runner-issue-3).

The fork currently matches **30 of 30** recorded cases, with zero known discrepancies. [Issue #6's reconciliation](Emerald-Kaizo-Baseline.md#reconciliation-of-the-four-differences-issue-6) records the Brick Break, switching Pursuit, Double Kick, and residual-damage KO decisions. All four remain explicit regression cases in the comparison test.

## Reproduce from a clean checkout

Use Node.js 22.15.0 or later. The first fetch needs access to pinned GitHub source files. Cached content is ignored by Git and verified against the manifest before use. From the repository root:

```sh
npm run baseline:fetch
npm run baseline:verify
npm run test:baseline
npm run baseline:fixtures:fetch
npm run baseline:fixtures:verify
npm run test:comparison
npm run baseline:compare
```

`baseline:verify` and `baseline:fixtures:verify` work offline after retrieval. `baseline:compare` also fetches missing pinned inputs when necessary. A changed or unavailable source, invalid fixture, changed result, or stale known-difference annotation fails the comparison. `test:comparison` changes an expected roll in a temporary fixture, checks that the CLI exits unsuccessfully with its case ID, and then verifies the committed fixture still matches. The [CI workflow](../../.github/workflows/emerald-kaizo-baseline.yml) runs these checks for relevant pull requests and on pushes to `master`.

## Baseline maintenance

1. Identify the proposed code, data, or setting change and its source revision. Decide whether it belongs to the accepted original/unversioned game target; use an issue for an independently verifiable change.
2. Update the manifest and [configuration](../../baselines/emerald-kaizo/configuration.json) only when their inputs genuinely change. Preserve source attribution and license files. Refresh pinned hashes and the deterministic capture using the baseline scripts; never substitute a mutable upstream default.
3. Capture complete battle inputs and reference results for new or corrected behavior. Explain any disagreement with the reference using source or mechanics evidence. Update the fixture and schema if needed; record unresolved differences individually in [the discrepancy ledger](../../baselines/emerald-kaizo/known-comparison-differences.json) with an issue link and rationale.
4. Run the clean reproduction sequence above. Check raw rolls, hit shape, and KO descriptions, then describe any change to the advertised support boundary in the design. A changed expected result needs maintainer review before merge.
5. Verify the PR's CI run. The baseline report and issue/board record should distinguish merged changes from deployment.

## Milestone evidence and limits

| Issue | Merged evidence | Contribution |
| --- | --- | --- |
| [#1](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/1) | [PR #8](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/pull/8) | Accepted game version, source lineage, and supported boundary |
| [#2](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/2) | [PR #9](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/pull/9) | Pinned retrieval, hashes, effective settings, and offline verification |
| [#3](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/3) | [PR #12](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/pull/12) | Automated fork comparison with explicit mismatch failures |
| [#4](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/4) | [PR #11](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/pull/11) | Complete inputs and pinned results for 30 cases |
| [#5](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/5) | [PR #10](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/pull/10) | Difference inventory and minimum reconciliation candidates |
| [#6](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/6) | [PR #13](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/pull/13) | Resolved four mismatches; comparison passes |
| [#7](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/7) | [PR #14](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/pull/14), pending review | This report and the CI comparison gate |

Issues #1–#6 are closed as completed and their listed PRs are merged. Issue #7 remains open for review and final milestone sign-off. A merged calculation baseline does **not** mean the mobile interface or public website has been deployed.

**Outside validated support:** Emerald Kaizo 1.1; ROM or patch accuracy; doubles, spread and partner effects; switch-in or AI prediction; general multihit and per-hit item/ability interactions; Pain Split's status effect; and the audit's game-level type-rounding and Hidden Power questions. The existing desktop or future mobile UI must not present these as validated. A later issue must supply independent game evidence and fixtures before expanding the support claim.

## Open questions and validation

An authoritative Emerald Kaizo release or patch identifier and independent game calculations would strengthen the baseline. The audit's unresolved type-rounding and Hidden Power questions remain documented in the [baseline record](Emerald-Kaizo-Baseline.md#uncertainty-and-exclusions). For this report, validate internal links, the clean reproduction commands, the deliberate-mismatch failure, and the PR's CI result before accepting issue #7.

Local validation on 2026-11-08: `baseline:fixtures:verify` reproduced all 30 pinned cases; `test:baseline` passed six tests; `test:comparison` passed three; and `baseline:compare` reported 30 matches, zero mismatches, and zero stale annotations. A temporary copy of case `EK4-03` with one expected roll changed made `baseline:compare -- --fixtures <temporary-file>` exit 1 and report that case's raw-damage difference. The temporary file was removed, and the committed fixture was not edited. Local Markdown targets in this report and both documentation indexes exist, and `git diff --check` passed. The initial [PR #14 clean-checkout CI run](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/actions/runs/42559715097) passed, including the new `baseline:compare` step. Its final commit must also pass CI before review is complete.
