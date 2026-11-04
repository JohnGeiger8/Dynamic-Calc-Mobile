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
2. Which independently verified game restrictions should replace the captured reference UI defaults (especially EV availability)? Issue #2 records the reference behavior below; in-game validation remains separate.
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

## Reproduce the selected inputs (issue #2)

Captured on **2026-11-03**. The accepted target and pinned revisions above remain unchanged. The format is version 1, identified as `emerald-kaizo-original`; this version identifies the capture format, not a game release number.

From a clean checkout, use **Node.js 22.15.0 or later** (CI uses 22.15.0):

```sh
npm run baseline:fetch
npm run baseline:verify
npm run test:baseline
```

No package installation is required. `baseline:fetch` retrieves the 26 files listed in [`manifest.json`](../../baselines/emerald-kaizo/manifest.json), exclusively from commit-addressed `raw.githubusercontent.com` URLs. It verifies byte lengths and SHA-256 before saving or evaluating anything. Existing cached files are also verified; a corrupt file is an error, not permission to replace it silently. Delete the specifically named corrupt cache file and rerun fetch to repair it. There is no `latest`, branch, npoint, CDN data, or alternate-dataset fallback. Network/HTTP errors stop retrieval. A first retrieval needs network access; GitHub availability is still an external dependency.

`baseline:verify` requires all inputs locally and performs **no network access**. Both commands rerun the pinned species/move loader functions in an isolated Node VM, check 1,744 trainer sets, compare effective settings and ordinary field defaults, check the effective critical multiplier, and compare both derived SHA-256 hashes. Inputs are checked in full before upstream code executes. Failure exits nonzero with the missing path or expected checksum; the CLI removes any previous `verified/` outputs before attempting the operation. Do not consume partial downloads as a successful capture.

Successful output lives under ignored `.baseline-cache/emerald-kaizo/`:

| Path | Contents |
| --- | --- |
| `reference/` | Unmodified pinned Decomps inputs, integration source evidence, and `calc/LICENSE` |
| `trainerSource/` | Unmodified source `ek.js` and root MIT `LICENSE` |
| `verified/data.json` | Canonical species/UI and engine tables, moves/UI and engine tables, items, abilities, natures, Gen 3 type chart, trainer sets, and trainer order |
| `verified/effective-settings.json` | Canonical [`configuration.json`](../../baselines/emerald-kaizo/configuration.json), including runtime-checked reference settings, explicit comparison defaults, hooks, support limits, and evidence locations |

Canonical JSON sorts object keys recursively, preserves array ordering, uses two-space indentation, UTF-8 and LF, and ends in a newline. The manifest locks the two output hashes as well as every input. Sorting keys does not establish trainer ordering: use the separately captured `trainerOrder` links and original set IDs. Upstream trainer order is a separate fallback file (`backups/trainer_orders/ek2.js`) and must not be fetched from a mutable default. Format/source changes require a reviewed manifest/configuration update and new expected hashes; commands never rewrite those locks.

This is a reproducibility fixture for subsequent adapter and comparison work. It does not replace the inherited desktop selector or make the hosted reference immutable. Opening the existing external `?data=ek` link still opens the live site. Consumers must use verified outputs and explicit battle inputs; visiting that live URL is not this reproducibility procedure. No new runtime dependency is added to the calculator.

### Effective configuration and evidence

All source paths below refer to the manifest's pinned **Decomps** revision. The executable harness runs `js/initialize.js`, `js/calc_ui/menu_settings.js`, the base tables, and the actual `loadPoksData` / `loadMovesData` functions. DOM decoration and document-ready callbacks are suppressed. This is headless source capture, not a full browser replay.

| Concern | Captured behavior and source evidence |
| --- | --- |
| Separate generation selectors | `setGameSettings` forces `damageGen=3`, `typeChart=3`, `gameSwitchIn=3`, `switchIn=3`, and `critGen=5`. `gen` remains 8. `type_chart` is synchronized to 3; `defaultTypeChart` remains the initial 6 but is not the active chart. |
| Physical/special categories | Title-scoped synchronization disables the split. `calc/mechanics/gen3.js` uses type-based categories for damaging moves and preserves Status. Physical types are Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost, Steel; its special list also includes Fairy. |
| Critical behavior | `getCriticalHitMultiplier` in `calc/mechanics/util.js` returns 2 for `critGen=5` (runtime checked). `calculateFinalModsADV` floors the critical multiplication, skips Reflect/Light Screen on critical; attack/defense functions ignore negative attack and positive defense stages. Battle Armor and Shell Armor suppress critical hits. The critical checkbox supplies a deterministic flag, not a critical-hit probability model. |
| Base data and overrides | The `.gen` handler in `js/shared_controls.js` uses Gen 8 species, items and abilities. **Additional source finding:** the UI move picker starts at `calc.MOVES[9]`, while the engine uses `MOVES_BY_ID[8]`. Both are captured. `loadPoksData` patches stats/types/abilities/form data and adds custom species; `loadMovesData` applies snapshot moves while retaining unspecified base metadata. Return=102, Magnitude=70, and the Solar-Beam alias are retained. No independent data normalization/filtering is imposed. |
| Pool boundaries | Snapshot overrides do not remove the rest of the base pools. Captured counts: 1,511 species, 973 move-picker names including aliases, 971 Gen 8 engine move IDs, 678 items, 366 abilities, 25 natures, 384 species with 1,744 trainer sets, and 460 trainer-order records. The selected Gen 3 chart table has 19 keys, including inherited non-original-generation entries. This capture does not certify every available entry as valid in EK. |
| EV/IV availability | `hasEvs=true` on a clean profile. Set loading uses supplied EVs/IVs, otherwise 0 EVs and 31 IVs per stat (random-set mode would use 84 EVs for non-HP stats and is excluded). EV UI availability is a reference behavior, not evidence that in-game EV training is available. Turning EVs off can hide controls while `createPokemon` still reads their values; explicit EVs remain required in comparisons. |
| Pokémon values | Trainer level, nature, ability, item and four moves come from the snapshot. UI fallbacks: Hardy nature, first species ability, no item, `(No Move)` for missing slots, boosts 0 and HP 100%. Engine API defaults differ in places: level 100, Serious nature, IV 31, EV 0. Fixtures must provide explicit levels/stats/current HP/status rather than depend on whichever set the UI selects first. Item enabled, critical off, healthy status and no boosts are the explicit ordinary comparison profile. |
| Ordinary field | `calc/field.js` defaults to Singles, no weather/terrain, zero Spikes, and false side/room/aura/ruin/inverse/gravity/screen/hazard/protection/helping-hand/tailwind/badge/switching effects (undefined optional values are omitted in JSON). `clearField` in `js/shared_controls.js` selects Singles and clear weather and clears both sides, terrain and badge boosts unless preservation options are requested. The full instantiated Field/Side object is recorded in configuration. |
| EK-specific integration | Typed Hidden Power uses its move-table data through `shouldUseEmeraldKaizoTypedHiddenPowerMove`; generic Hidden Power can be inferred from IVs. `correctHiddenPower` immediately returns the input set unchanged. `setBaseGame` resolves `g3`; mechanics stays `vanilla`; save expansion, includes and Mastersheet are off. No Pokédex or AI panel. No EK partner/battle-type metadata is supplied by the snapshot. |
| Predictions | A fresh reference has switch preview enabled (`noSwitch=false`) and the Gen 3 selector; switch AI info defaults off and is not available for this title. The reproducibility fixture records these facts but supports/advertises **neither switch prediction nor AI prediction**. Doubles, spread and partner correctness remain unsupported without fixtures. Cascade custom AI flags are false. |

### Persisted settings and deterministic isolation

The capture creates fresh in-memory storage on every run and supplies only `?data=ek`; it never reads the user's browser profile. The committed configuration records the entire effective `settings` object, rather than reconstructing it from ordinary Emerald assumptions.

In the browser, `calcHasEvs` can change EV availability; `calcPhysSpecSplit:Emerald Kaizo`, `calcInvertTypes:Emerald Kaizo`, `calcSwitchPreview:Emerald Kaizo`, `calcSwitchAiInfo:Emerald Kaizo`, and `calcChallengeMode:Emerald Kaizo` are title-scoped preferences. Challenge mode is gated to supported Gen 5 titles and is false here. URL `noSwitch=1` can disable preview; URL `gen` can change the base pool, while EK's title branch forces damage/type/critical selectors back to their pinned values. Tests exercise consequential stored and URL overrides and prove subsequent isolated captures return to identical settings.

Other persisted values such as `customsets`, left/right selection, custom opponent teams, `currentParty`, `partnerName`, `lvlCap`, `rememberHpStatus`/`rememberedEnemyHpStatus`, randomizer/filter settings, item activation, and existing UI HP/status/field edits can change the matchup or its available inputs. `dynamicTypeBug` is another stored integration toggle and defaults on; it must not be assumed irrelevant to later comparisons. Layout, theme, analytics and display preferences are not battle evidence. Use an isolated profile plus explicit per-battle fixtures when comparing against the full browser; never clear a user's real storage as part of this procedure. The capture excludes user sets, saves, parties and partners entirely.

### Attribution and distribution choice

The source trainer repository has a root MIT license (Honko and contributors, 2013–2024); Decomps contains `calc/LICENSE` (MIT, Honko and contributors, 2013–2022), but no root license explicitly covering all browser integration files. The generated snapshot and trainer-order file retain their `Generated from pokemon-damage-calc EK trainer data. Do not edit by hand.` notices. We therefore commit the retrieval/verification method, provenance hashes, and our configuration description; **no new third-party data or integration code is vendored**. All retrieved files remain unmodified, with both license texts retained alongside the cache. Do not infer permission for unrelated graphics, ROMs or other assets. Broader redistribution requires separate license review.

### Verification and remaining limitations

A clean temporary Git clone on 2026-11-03 ran the three documented commands successfully without installing packages or copying a cache. All six tests passed and the tracked working tree stayed clean. The derived SHA-256 values were `52d39f69f360b82ca2d7d6fbd8205adc0f6dcd293f4e1239310ca8abd08752fa` (`data.json`) and `0a998c02d3106c8be12c9a054e779294d0046b6e89b3febb83fb313689c02926` (`effective-settings.json`), identical to the manifest and original working checkout. Relative documentation links and `git diff --check` passed.

The baseline test suite checks all 26 input hashes (including empty, truncated and same-length corruption), missing files, HTTP failure, wrong retrieved content, output hashes, effective settings, critical multiplier, persisted-setting isolation, and CLI failure with stale-output removal. CI performs fetch, offline verify, tests, and working-tree checks from a fresh checkout.

This captures the selected inputs; it does not perform issue #5's independent accuracy audit. The headless harness suppresses UI event wiring, automatic ability weather changes, persisted matchup restoration and calculation rendering. Explicit fixture battle inputs must account for those effects. Source mechanics evidence and a verified critical multiplier are not damage-roll, KO-description, doubles or AI parity fixtures. No ROM, patch, release hash, personal save, physical device, or game execution was used. Remote deletion could prevent fresh retrieval, though a complete verified cache can be reused offline. The inherited engine tests and browser tests concern the older fork and do not establish Decomps/EK parity; issue #4 remains responsible for comparison fixtures.
