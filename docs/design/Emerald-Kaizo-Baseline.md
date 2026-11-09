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

## Fork/reference difference audit (issue #5)

- **Audit date:** 2026-11-03
- **Audit status:** Proposed findings for [issue #5](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/5) review
- **Machine-readable inventory:** [`difference-inventory.json`](../../baselines/emerald-kaizo/difference-inventory.json)
- **Verifier:** [`scripts/baseline/audit-emerald-kaizo.mjs`](../../scripts/baseline/audit-emerald-kaizo.mjs)

### Reproducible procedure

Clone the three repositories into any disposable directory, detach each checkout at the revision already pinned above, and run the audit verifier with the three paths:

```sh
git clone https://github.com/hzla/Dynamic-Calc.git /tmp/ek-audit-fork
git -C /tmp/ek-audit-fork checkout 42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74
git clone https://github.com/hzla/Dynamic-Calc-Decomps.git /tmp/ek-audit-reference
git -C /tmp/ek-audit-reference checkout 883e9837e6281dd9d6963b935b6cda1dbe101293
git clone https://github.com/anastarawneh/pokemon-damage-calc.git /tmp/ek-audit-trainers
git -C /tmp/ek-audit-trainers checkout 15ae28de8310f6442f1302f1709b0bf792d1e131
npm run baseline:audit -- \
  --fork /tmp/ek-audit-fork \
  --reference /tmp/ek-audit-reference \
  --trainer-source /tmp/ek-audit-trainers
```

The verifier rejects the wrong commit or any changed locked file before reporting the inventory. The inventory locks 28 source files that support its findings, including both trainer representations, the source trainer file, configuration/loaders, calculation dispatch, Gen 3 mechanics, and result-description paths. It classifies every finding as `relevant`, `irrelevant-to-baseline`, or `requires-investigation`, and records likely effects, fixture candidates, evidence still needed, and minimum action.

For broader orientation, sorted `rg --files calc js backups` lists contain 32 fork-only paths, 208 reference-only paths, and 83 common paths; 50 common files differ byte-for-byte. Those counts are not the conclusion: most additions serve other games, later mechanics, AI, save formats, or developer tooling. The inventory narrows the comparison to behavior that can affect the accepted EK target.

### Findings and relevance

| Area | Classification | Finding and likely effect |
| --- | --- | --- |
| Reference selection and settings | Relevant | The fork's local mapping names `backups/ek.js` and its user-facing selector redirects to Decomps. The reference resolves `data=ek` to `ek2.js` and independently selects a Gen 8 base data pool, Gen 3 damage/type/switch selectors, `critGen=5`, and no physical/special split. A single generation toggle cannot reproduce this configuration. |
| Base data and loaders | Relevant | The reference overlays the EK snapshot on its pinned base species, move, item, ability, and type tables while retaining unspecified metadata. Its loader forces Return to 102 BP, Magnitude to 70 BP, retains the Solar-Beam alias, and preserves separate UI/engine move pools. Equivalent trainer text can therefore resolve to different calculation inputs in the fork. |
| Trainer sets and order | Relevant, content already reconciled | The raw fork, reference, and source files differ in representation and identifiers, but issue #1's documented normalization matches all 1,744 sets with no missing or extra entry. Use the verified `ek2`-derived data and separate trainer order; no trainer-content port is recommended. |
| Dispatch and explicit state | Relevant | Decomps dispatches with a separate mechanics generation and carries item activation and expanded field state through clones. The fork uses different globals/defaults. Hidden state can choose the wrong mechanics or discard a visible toggle unless the adapter supplies explicit configuration and battle state. |
| Gen 3 core calculation | Relevant | Move category selection, attack/defense/final modifier staging, critical selection, item behavior, and floor order differ. These paths can change raw rolls for ordinary moves, boosts, burn, screens, held items, abilities, and critical hits. |
| Move-specific hooks | Relevant | Brick Break, Pain Split, Triple Kick/per-hit power, multihit/stat drops, Beat Up, Pursuit, Weather Ball, starter abilities, Explosion/Self-Destruct, and critical handling differ. The accepted trainer data actually exercises many of these paths: 128 Brick Break, 92 Explosion, 23 Self-Destruct, 18 Weather Ball, 13 Pursuit, and 4 Pain Split entries. |
| Type effectiveness and dual-type rounding | Requires investigation | The reference sorts defender types by a precedence list and floors each type multiplier separately; the fork combines effectiveness before a later application. Dual-type rounding can change HP rolls. Static code establishes disagreement, not game correctness. |
| Raw results and KO descriptions | Relevant | Decomps changes multihit result shapes, range aggregation, recovery/recoil, residual effects, and knockout text. Issue #4 must capture raw rolls and exact descriptions separately so presentation normalization cannot hide a mechanics mismatch. |
| Typed and generic Hidden Power | Requires investigation | The reference preserves typed EK move-table entries but can derive generic Hidden Power from IVs. The accepted sets contain 229 typed entries and 2 generic entries. Fixtures must prevent typed moves from being overwritten and must state IVs for generic cases. |
| Doubles/spread behavior | Irrelevant to the initial baseline | The two paths differ, but no EK doubles/partner evidence was pinned. Keep doubles unsupported rather than importing unverified spread logic. |
| Switch/AI/save hooks | Irrelevant to the initial baseline | Decomps has newer switch preview, AI, save reader, and trainer UI integrations, but EK exposes no verified AI or partner behavior. They are not evidence for ordinary Singles damage parity. |
| Other Decomps growth | Irrelevant to the initial baseline | Reference-only later-generation, other-hack, AI, save, and developer modules explain much of the repository diff. Porting them would enlarge scope without establishing EK correctness. |

The full locations and dispositions are in the machine-readable inventory. `Relevant` means a path can affect supported inputs or outputs, not that the Decomps implementation has been proven correct. `Requires investigation` is intentionally not resolved by choosing one calculator.

### Candidate fixture set for issue #4

Use complete inputs from the pinned output; the labels below identify candidates, not expected damage:

| Concern | Candidate from the accepted trainer data |
| --- | --- |
| Screens and Brick Break | Leader Roxanne's level 14 Anorith |
| Explosion defense handling | Team Magma Grunt #2 at Mt. Chimney's level 36 Camerupt |
| Weather and category selection | Camper Beau's level 40 Choice Band Castform using Weather Ball |
| Switching flag | Pokémon Ranger Jackson's level 45 Crawdaunt using Pursuit |
| Status/non-damage behavior | Ruin Maniac Bryan's level 30 Duskull using Pain Split |
| Ability and item modifier order | Guitarist Beth's level 47 Huge Power Azumarill using Return; add a low-HP Blaze, Torrent, Overgrow, or Swarm case |
| Fixed loader overrides | Barboach from the Team Aqua Grunt at Rusturf Tunnel using Magnitude; the Azumarill Return case above |
| Hidden Power | Parasol Lady Daphne's Ampharos using Hidden Power Water; Expert Edgar's Electabuzz and Psychic Brandi's Unown using generic Hidden Power with explicit IVs |
| Multihit result shape | An accepted Double Kick set plus targeted per-hit/stat-change cases where the trainer data has no representative |
| Criticals, boosts, screens, and current HP | Targeted cases around positive/negative stat stages, full/partial HP, exact KO boundaries, and Reflect/Light Screen |
| Dual-type rounding | Targeted neutral, 2x, 4x, 0.5x, 0.25x, immunity, and Foresight cases at floor boundaries |

Issue #4 must obtain results from the pinned reference and record uncertainty rather than fill expected values from this audit. Game correctness needs independent evidence wherever the fork and reference disagree. Doubles, spread, prediction, and AI cases remain excluded unless their support scope is separately accepted.

### Minimum reconciliation scope

1. Treat issue #2's verified data and effective configuration as adapter inputs; never fall back to the legacy local `ek.js`, a live default, or EK 1.1.
2. Make mechanics generation, data generation, item activation, Pokémon values, and the complete Field/Side state explicit at the adapter boundary.
3. Use issue #4 fixtures to measure raw rolls first, then knockout descriptions. Include the relevant and investigation candidates above in both attack directions where applicable.
4. Port only the narrow Gen 3 loader, clone/dispatch, modifier, move-hook, and result behavior required by accepted fixtures. Keep attribution with any inherited code.
5. When reference and fork disagree, retain a linked uncertain result until authoritative evidence supports a choice. Do not turn reference parity into a claim of game correctness.

Do not replace the calculation engine wholesale. Do not import unrelated Decomps games, save readers, AI/prediction systems, later-generation mechanics, or doubles logic. This keeps the requested fork parent, limits license review, and gives each behavior change a reproducible reason.

### Follow-up and remaining limits

[Issue #4](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/4) is the next dependency: it must define the schema and capture the candidate reference cases above. [Issue #3](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/3) remains blocked until those fixtures exist; this audit does not create a comparison runner or invent expected results.

No standalone mechanics bug is filed from static disagreement alone. If an issue #4 case demonstrates a mismatch or authoritative evidence resolves one of `EK-AUDIT-07`/`EK-AUDIT-09`, create one focused follow-up per independently verifiable behavior and link its full battle inputs and reference result. This audit used no ROM, patch, save, game execution, or calculation-output fixture and therefore makes no damage, KO, prediction, or game-accuracy claim.

## Pinned reference calculation fixtures (issue #4)

- **Capture date:** 2026-11-07
- **Status:** Proposed reference evidence for [issue #4](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/4) review; game accuracy remains unverified
- **Fixture file:** [`reference-fixtures.json`](../../baselines/emerald-kaizo/reference-fixtures.json)
- **Schema:** [`reference-fixtures.schema.json`](../../baselines/emerald-kaizo/reference-fixtures.schema.json)
- **Capture:** [`capture-reference-fixtures.mjs`](../../scripts/baseline/capture-reference-fixtures.mjs)

The version 1 schema requires a case ID, purpose, audit finding links, trainer-set provenance, explicit configuration identity, both Pokémon, move, field, raw damage, HP and percentage ranges, KO result when available, and an uncertainty field. Each Pokémon records species, level, nature, ability, item and activation, six IVs/EVs/boosts, status, current HP, all selected moves, and calculated stats. Each field records Singles, weather and terrain, all captured Field/Side defaults plus explicit switching state on both sides. The configuration hash points to the full [`configuration.json`](../../baselines/emerald-kaizo/configuration.json); the record also states Gen 3 mechanics, Gen 8 species/engine move data, the Gen 9 UI move picker, critical model 5, and disabled physical/special split.

The 30 cases include both attack directions, the named Roxanne, Mt. Chimney, Beau, Jackson, Bryan, Beth, Rusturf Tunnel, Daphne, Edgar, Brandi, and Double Kick trainer sets; ordinary physical and special attacks; one status move; item activation, Huge Power, burn, boosts, critical hit, Reflect/Light Screen, partial HP, residual damage, weather, Pursuit switching, Explosion, Return and Magnitude overrides, typed and generic Hidden Power, multihit arrays, and dual-type neutral, 2×, 4×, ½×, ¼×, immunity, and Foresight targets. Synthetic opposing Pokémon are deliberately labeled by a null `trainerSet`; their complete values are recorded. These are pinned-reference examples, not claims about trainer battle pairings or in-game legality.

### Reproduce the fixture capture

Use Node.js 22.15.0 or later in a clean checkout. The first three commands verify issue #2's 26 locked files and outputs. The fixture fetch retrieves only three additional pinned reference modules (`calc/items.js`, `calc/result.js`, `calc/desc.js`) from the same commit and checks their SHA-256 before executing them. Both inherited license files remain in the ignored cache. No reference integration source is vendored.

```sh
npm run baseline:fetch
npm run baseline:verify
npm run test:baseline
npm run baseline:fixtures:fetch
npm run baseline:fixtures:verify
```

The last command recalculates all cases from the pinned reference and compares canonical JSON byte for byte with the committed fixture file. It does **not** execute the fork or implement issue #3's comparison runner. The capture uses the verified `data.json` hash, the pinned Gen 3 modules, explicit state, and the pinned UI loader's Return=102 and Magnitude=70 base-power overrides. Generic Hidden Power uses the pinned `Stats.getHiddenPower` function with explicit IVs; typed Hidden Power retains the selected move-table entry. Raw single-hit rolls are ordered by random factor 85–100; multihit results preserve one 16-roll array per hit. HP ranges come from the pinned Result API. Percentage ranges divide those HP values by the recorded defender maximum HP and round to one decimal; they are a documented derived convenience, not a claim about every browser display format. KO descriptions are exact `Result.kochance().text` values when supplied. `null` means unavailable or not established, not zero.

### Uncertainty and exclusions

The pinned Gen 3 function returns zero for Pain Split before reaching its later Pain Split hook. The fixture records that observed zero and leaves the status effect and KO description unresolved. `EK-AUDIT-07` type order/rounding and `EK-AUDIT-09` typed versus generic Hidden Power remain explicitly uncertain against the game even though reference rolls are recorded. The fixtures therefore allow later comparison with the fork but do not settle which calculator is correct. Reference output also does not prove that the synthetic opposing Pokémon or battle settings occur in Emerald Kaizo.

The initial support profile remains ordinary Singles. Doubles/spread, switch prediction, AI, EK 1.1, ROMs, patches, and personal saves are outside this capture. No game execution or independently verified damage result was used. Issue #3 remains blocked until these fixtures are reviewed and accepted as usable reference cases; its fork comparison runner is separate work.

## Fork comparison runner (issue #3)

- **Comparison date:** 2026-11-07
- **Status:** Proposed runner and findings for [issue #3](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/3) review
- **Runner:** [`compare-emerald-kaizo.mjs`](../../scripts/baseline/compare-emerald-kaizo.mjs)
- **Known differences:** [`known-comparison-differences.json`](../../baselines/emerald-kaizo/known-comparison-differences.json)

From a clean checkout with Node.js 22.15.0 or later, run one command:

```sh
npm run baseline:compare
```

The command retrieves any missing issue #2 inputs from their pinned commits, rejects missing or changed content, reproduces the verified data and configuration, validates the fixture schema and provenance, then executes all 30 cases through the fork's existing `calc/calc.js` Gen 3 dispatch. It passes the recorded Pokémon, move, and field inputs through an isolated adapter. That adapter supplies the selected Gen 8 data pool, Gen 3 mechanics and type chart, title, physical/special setting, and explicit move metadata; it maps `itemOn=false` to an unequipped item because the fork Pokémon constructor has no item activation option. The fork modules are read from the checkout, so this command detects changes to them. Later-generation dispatch imports are excluded from the isolated Gen 3 harness. No desktop UI or hidden browser state is consulted.

Raw damage arrays (including per-hit shape), HP and derived percentage ranges, and available KO chance, turn count, and description are compared exactly. Only whitespace runs in KO text are normalized as presentation; wording, probabilities, punctuation, and rolls remain significant. A missing KO result in the reference fixture is not asserted. Every case still runs and compares its raw result. The command prints case IDs, expected and actual values, and linked rationales, then exits nonzero for any mismatch, invalid fixture, missing data, execution error, or stale known-difference entry. The dedicated test suite also changes a copy of one expected roll, verifies the command fails with that case ID, and leaves the committed fixture untouched.

At the initial issue #3 comparison, 26 cases matched and four differed; the command exited with status 1:

| Case | Observed difference | Follow-up |
| --- | --- | --- |
| `EK4-01` | Brick Break through Reflect: raw rolls, range, and KO differ. | [#6](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/6), `EK-AUDIT-06` |
| `EK4-08` | Pursuit during switching: raw rolls and range differ. | [#6](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/6), `EK-AUDIT-06` |
| `EK4-16` | Double Kick: the reference has two hit arrays while the fork has one; KO wording differs. | [#6](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/6), `EK-AUDIT-08` |
| `EK4-19` | Return with Leftovers and Leech Seed: rolls match, KO chance and wording differ. | [#6](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/6), `EK-AUDIT-08` |

These are measured differences, not correctness decisions. Issue #6 must investigate each before a mechanics change. `EK-AUDIT-07` and `EK-AUDIT-09` remain uncertain against game evidence even where the fork happens to match the pinned reference. The runner establishes comparison behavior only; it does not validate the game, doubles, prediction, or the mobile interface.

## Reconciliation of the four differences (issue #6)

The fork now matches all 30 pinned reference cases. The discrepancy ledger is empty, and `npm run baseline:compare` exits successfully. The following decisions explain the changed behavior:

| Case | Decision and evidence |
| --- | --- |
| `EK4-01` | Clear Reflect and Light Screen before Brick Break damage. The [Emerald Brick Break battle script](https://github.com/pret/pokeemerald/blob/master/data/battle_scripts_1.s) runs `removelightscreenreflect` before `damagecalc`; the [command implementation](https://github.com/pret/pokeemerald/blob/master/src/battle_script_commands.c) clears both screen flags. |
| `EK4-08` | Double Pursuit's calculated damage after the base damage `+2`, rather than doubling an earlier intermediate value. The [switch battle script](https://github.com/pret/pokeemerald/blob/master/data/battle_scripts_1.s) sets the damage multiplier to two before `damagecalc`, and [the damage command](https://github.com/pret/pokeemerald/blob/master/src/battle_script_commands.c) applies it to the calculated base damage. This fixes the tested switching case; switch prediction remains outside the support boundary. |
| `EK4-16` | Record two independent Double Kick hit-roll arrays and use their combined distribution for the KO description. The [Emerald double-hit script](https://github.com/pret/pokeemerald/blob/master/data/battle_scripts_1.s) repeats damage calculation per hit. This targeted correction does not assert parity for every multihit move or per-hit item/ability interaction. |
| `EK4-19` | Count damaging end-of-turn effects when they finish a turn's KO, while end-of-turn healing cannot reverse a KO already dealt by an attack. With 54 current HP, minimum Return damage of 23 twice, and net 7 residual damage per turn (Leftovers +6, Leech Seed -13), the minimum two-turn sequence is lethal by the second turn's residual damage. The pinned reference uses this convention; the fixture's wording says "after Leftovers recovery and Leech Seed damage." |

These corrections establish parity with the pinned reference for the recorded ordinary Singles cases. They do not establish game accuracy against an Emerald Kaizo ROM, broader multihit behavior, doubles, AI, or switch prediction. The audit's type-rounding and Hidden Power questions remain open pending independent game evidence.
