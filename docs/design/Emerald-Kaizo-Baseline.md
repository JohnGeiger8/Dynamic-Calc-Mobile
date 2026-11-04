# Emerald Kaizo baseline

- **Date:** 2026-10-27
- **Status:** Accepted
- **Tracking issue:** [#1 Identify and pin the Emerald Kaizo reference version](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/1)

## Goal

Pin a reproducible Emerald Kaizo reference for the mobile calculator and separate verified facts from assumptions before mechanics, data, and UI implementation begin.

## Scope

This record covers the current fork's relationship to its upstream calculator, how its Emerald Kaizo link resolves, the dataset lineage and checksums, and the behaviors that may be advertised before calculation fixtures exist. It does not validate damage results, game data accuracy against a ROM, doubles behavior, or switch/AI prediction.

## Accepted baseline

Use the **original/unversioned Emerald Kaizo dataset currently selected by the fork** as the initial product baseline. Do not call it Emerald Kaizo 1.0: the source repository labels it `Emerald Kaizo`, while it labels the newer dataset separately as `Emerald Kaizo 1.1`.

The product owner confirmed this decision on 2026-10-27. Emerald Kaizo 1.1 is a different version of the game and is outside the initial baseline. Supporting it later requires a separately identified dataset and compatibility decision rather than silently replacing this reference.

## Pinned revisions

Revisions were inspected on 2026-10-27.

| Component | Pinned revision | Role |
| --- | --- | --- |
| [`JohnGeiger8/Dynamic-Calc-Mobile`](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/commit/43b0cf38f99886d17340e401496ebae52895be55) | `43b0cf38f99886d17340e401496ebae52895be55` | Fork baseline at the start of issue #1 |
| [`hzla/Dynamic-Calc`](https://github.com/hzla/Dynamic-Calc/commit/42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74) | `42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74` | Fork's exact upstream merge base and current upstream `master` at inspection time |
| [`hzla/Dynamic-Calc-Decomps`](https://github.com/hzla/Dynamic-Calc-Decomps/commit/883e9837e6281dd9d6963b935b6cda1dbe101293) | `883e9837e6281dd9d6963b935b6cda1dbe101293` | Calculator reached by the fork's `?data=ek` link |
| [`anastarawneh/pokemon-damage-calc`](https://github.com/anastarawneh/pokemon-damage-calc/commit/15ae28de8310f6442f1302f1709b0bf792d1e131) | `15ae28de8310f6442f1302f1709b0bf792d1e131` | Upstream source named by the generated reference snapshot |

At the pinned fork revision, `master` is zero commits behind and seven documentation-only commits ahead of `hzla/Dynamic-Calc@42b4cdc`. No calculator or game-data divergence was found in those seven commits.

## Reference resolution

The fork's selector maps Emerald Kaizo to:

```text
https://hzla.github.io/Dynamic-Calc-Decomps/?data=ek
```

At the pinned Decomps revision, the resolution chain is:

```text
data=ek
  -> title "Emerald Kaizo"
  -> backup key "ek2"
  -> backups/ek2.js
```

The snapshot begins with a generated-file notice naming `pokemon-damage-calc` EK trainer data. Its dataset matches the source repository's unversioned `src/js/data/sets/hacks/gen3/ek.js` after normalizing generator-only differences: level prefixes and duplicate-trainer labels, rival variant delimiters, generated IDs, and seven canonicalized move names. All 1,744 trainer-set entries then match with zero missing or extra entries.

The source repository contains a distinct `ek1.1.js` with 1,752 trainer-set entries. This is the decisive evidence that `?data=ek` currently represents the original/unversioned dataset, not 1.1.

## Dataset fingerprints

| Artifact | SHA-256 | Parsed trainer-set count |
| --- | --- | ---: |
| Decomps `backups/ek2.js` | `93b0732ccd62c434f4dac95f47e9f1c83412efc4c95326c75dbfc28f722d99c0` | 1,744 |
| Source `src/js/data/sets/hacks/gen3/ek.js` | `98c70b8a60d4bc7ac3a8e9fe93c70df9c453157f384fa5c6f6c272d102ad387c` | 1,744 |
| Source `src/js/data/sets/hacks/gen3/ek1.1.js` | `8d1ab3a6b431723f71727e9bb6991ce83e16bbc0d216459e9df74f01d463d921` | 1,752 |
| Fork legacy `backups/ek.js` | `820a347ea07d8a37eabf885fad2d113ebbeebad761f84eb95255a58b3e6d6ffe` | 1,744 |

The generated Decomps file has Git blob ID `ae5b4a65d31131ab204a6b464905eefd9ac74a4c`. It was introduced by [`10f2def`](https://github.com/hzla/Dynamic-Calc-Decomps/commit/10f2def19263e529f1218b9f5db6d4f5c49f1026) (`update ek data`) and last changed in the inspected history by [`bb7cac2`](https://github.com/hzla/Dynamic-Calc-Decomps/commit/bb7cac23320eb2c5f3674f57afaa93655a029e1d) (`fix rival sets for ek`). The source `ek.js` last changed in [`aa20a94`](https://github.com/anastarawneh/pokemon-damage-calc/commit/aa20a94c21cd0dfd9ca28066d0d9d99ce72c2b28).

These hashes pin inputs for reproducibility; they are not evidence that the data is correct against a particular ROM image.

## Observed reference configuration

On a clean profile with only `?data=ek`, the pinned Decomps code selects:

| Setting | Observed value |
| --- | --- |
| Damage mechanics | Generation 3 |
| Type chart | Generation 3 |
| Switch-preview generation | Generation 3 |
| Critical-hit model selector | `critGen = 5`, which preserves the reference calculator's 2x pre-Generation-6 critical multiplier |
| Physical/special split | Disabled by the title-scoped settings synchronization on a clean profile |
| Data pool | Generation 8 default pool plus the loaded backup overrides; `setGameSettings` does not change `settings.gen` for Emerald Kaizo |
| Data source mode | Full backup data |
| Pokédex panel | Hidden |
| AI panel | Hidden |

Some settings are persisted in browser storage and can override a clean-profile observation. Issue #2 must capture the effective configuration in a reproducible fixture rather than relying on these defaults alone.

## Supported behavior boundary

Until issues #2 through #5 add fixtures and comparisons, advertise only this narrow baseline:

- **Initial supported target:** selecting original/unversioned Emerald Kaizo trainer sets and performing ordinary single-battle damage calculations with Generation 3 mechanics, subject to the calculation fixtures required by issues #2 through #5.
- **Not yet validated or advertised:** doubles/spread-move calculations, partner interactions, switch-in prediction, mid-turn switching, AI move prediction, or parity with every reference-calculator option.
- **Reference-only, not proof of support:** the Decomps application contains Generation 3 switch-preview logic, but the EK snapshot has no battle-type or partner metadata, and the AI panel is hidden for Emerald Kaizo.

Displaying maximum opposing damage is a deterministic damage comparison, not an AI prediction feature.

## Decisions and evidence level

| Statement | Evidence level | Disposition |
| --- | --- | --- |
| The fork currently links to Decomps `?data=ek`. | Confirmed from pinned source | Keep for the initial baseline |
| `?data=ek` resolves to `backups/ek2.js`. | Confirmed from pinned Decomps source | Pin file and revision |
| `ek2.js` is generated from the original/unversioned source dataset. | Confirmed by source labels, counts, and normalized 1,744-entry comparison | Use as the initial lineage |
| The desired initial mobile target is original/unversioned Emerald Kaizo. | Confirmed by the product owner on 2026-10-27 | Accepted |
| The snapshot is accurate to an official game release or ROM hash. | Unverified | Do not claim; requires authoritative game evidence |
| Doubles and prediction behavior match the game. | Unverified | Exclude from initial support boundary |

## Open questions

1. What authoritative release artifact, patch version, or ROM hash can be recorded without distributing copyrighted game content?
2. Which EV availability, IV defaults, badge boosts, critical-hit details, current-HP behavior, and field defaults must issue #2 capture?
3. Which single-battle fixtures establish the minimum supported mechanics set in issue #4?
4. Which species, moves, items, abilities, trainer sets, and type-chart overrides must issue #5 audit independently of the generated snapshot?

## Validation performed

- Verified fork/upstream ancestry and the seven fork-only commits.
- Traced the Emerald Kaizo selector through the Decomps catalog and backup mapping.
- Recorded commit IDs, blob ID, SHA-256 fingerprints, species counts, and trainer-set counts.
- Compared all 1,744 original source trainer sets with the generated reference snapshot after documented representation-only normalization; zero entries were missing or extra.
- Confirmed the source UI and files distinguish `Emerald Kaizo` from `Emerald Kaizo 1.1`.
- Inspected the clean-profile settings path and EK title configuration.

No ROM, game execution, browser calculation fixture, mobile implementation, or doubles/prediction result was validated as part of this investigation.

## Decision

The original/unversioned 1,744-set dataset is accepted as the initial implementation baseline. Emerald Kaizo 1.1 remains out of scope and must be introduced as a separately versioned target if support is added later.
