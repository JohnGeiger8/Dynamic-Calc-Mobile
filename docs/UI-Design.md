# Dynamic Calc - Mobile
## UI design and Emerald Kaizo baseline

Date: October 26, 2026  
Status: Initial design specification; implementation and calculation validation are pending.  
Direction: Approach 2 — a dedicated mobile web interface sharing the existing calculation engine and game data.  
First game: Emerald Kaizo.  
Repository: `JohnGeiger8/Dynamic-Calc-Mobile`, forked from `hzla/Dynamic-Calc`.

## 1. Product goal

Help an Emerald Kaizo player answer two questions quickly on an iPhone: **Can I knock this Pokémon out? Can I survive its reply?**

Keep both combatants, current HP, active conditions, and damage results easy to compare. Make switching between a player's box and a trainer's team fast enough to use during a run. Reuse upstream calculation behavior while giving the mobile interface its own layout and interaction model.

The first implementation milestone is one complete Battle flow. The first usable release adds Box, Trainers, Settings, and portable saved sessions. Offline downloads and native iOS packaging follow later.

## 2. Repository findings and baseline decision

Inspected upstream branch: `master`. Reference commit: `42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74`.

The existing site uses HTML, JavaScript, jQuery, Select2, and global script loading. Much of the damage engine lives under `calc/`, while UI behavior and game-specific integration also live under `js/`. Desktop styles contain large minimum widths. The engine is a reuse opportunity, but it is not yet proven to be an isolated drop-in library for a new interface.

**Emerald Kaizo requires a compatibility check before implementation.** The requested repository still identifies a legacy Emerald Kaizo data source, `24bbfc0e69ff4a5c006b`, and maps Emerald Kaizo to backup key `ek`. However, its current game selector links to `https://hzla.github.io/Dynamic-Calc-Decomps/?data=ek`. These two baselines must not be assumed equivalent.

Keep the requested fork parent as `hzla/Dynamic-Calc`. Use the current linked Emerald Kaizo calculator as the user-facing comparison reference. Before building the engine adapter, capture its exact mechanics configuration, data revision, and representative results. Compare them against the fork. If differences exist, document them and port only the required Emerald Kaizo changes with attribution. Do not silently change the fork parent or substitute a newer generic calculator package.

The baseline record must include:

- Original upstream commit and, if used, the separate Decomps reference commit.
- Emerald Kaizo data location, snapshot/checksum, and collection date.
- Species/move pool, damage generation, type chart, battle format, and supported prediction behavior.
- Per-Pokémon stats, IVs/EVs, nature, ability, item, HP, status, moves, boosts, and all field conditions for each comparison.
- Expected damage rolls, displayed ranges, and knockout descriptions from the reference calculator.

No calculation comparisons have been executed as part of this design document. Compatibility remains a release requirement.

## 3. Information architecture

| Destination | Purpose | Primary actions |
| --- | --- | --- |
| Battle | Compare a matchup and edit its assumptions | Change either Pokémon; edit HP; inspect moves; set field conditions |
| Box | Manage the player's available Pokémon | Search; import; edit; select for Battle |
| Trainers | Find an Emerald Kaizo opponent and team | Search trainers; inspect team; select opposing Pokémon |
| Settings | Manage game context, appearance, and data | Review game/version; export/import; reset field; appearance |

Use persistent bottom navigation with text labels. Preserve the active matchup and each tab's search and scroll position when switching tabs. Emerald Kaizo is selected by default; other game choices are deferred until validated.

## 4. Battle screen

### Layout

The following is a structural wireframe, not a finished visual mockup. Placeholder text does not represent verified game data or calculated results.

```text
┌────────────────────────────────────┐
│ Emerald Kaizo            Session ⋯ │
├──────────────────┬─────────────────┤
│ YOUR POKÉMON     │ OPPONENT        │
│ Sprite · Name    │ Sprite · Name   │
│ Level · Status   │ Level · Status  │
│ HP current/max   │ HP current/max  │
│ [Edit] [Change]  │ [Edit] [Change] │
├──────────────────┴─────────────────┤
│ Field: weather / screens / hazards │
│ [Edit field]                       │
├────────────────────────────────────┤
│ [Your attacks] [Opponent attacks]  │
│ Move A     damage range   KO info  │
│ Move B     damage range   KO info  │
│ Move C     damage range   KO info  │
│ Move D     damage range   KO info  │
├────────────────────────────────────┤
│ Selected move details / rolls      │
├────────────────────────────────────┤
│ Your team · tap to change          │
│ Trainer team · tap to change       │
├────────────────────────────────────┤
│ Battle     Box   Trainers Settings │
└────────────────────────────────────┘
```

### Matchup header

Display both Pokémon together using compact summaries. Distinguish “Your Pokémon” and “Opponent” in words, not just colors. Show level, current/max HP, status, and compact ability/item summaries where space permits. Long names wrap without hiding the distinction between forms.

The header remains compactly visible as results scroll. On small screens or at large text sizes, allow the cards to stack instead of shrinking text. Prioritize readable results over keeping every element fixed.

### Damage results

Default to Your attacks. A labeled segmented control changes direction without changing the underlying matchup. Keep a compact summary of the strongest damaging opposing move visible below your results where possible; label it as maximum damage among displayed moves, not as an AI prediction.

Each move row shows its name, type, minimum–maximum damage as a percentage, and the engine's supported knockout description. Expand a row for raw HP damage, rolls, relevant assumptions, and a plain-language explanation. Status moves and unsupported results get explicit labels rather than misleading zero-damage or knockout values.

Percentage damage uses the target's maximum HP; knockout interpretation must account for current HP and the engine's supported conditions. Do not invent multi-turn probabilities or describe a matchup as “safe” solely from a damage range. A move's maximum roll, accuracy, critical-hit setting, and speed order are separate facts.

Show critical-hit and other result-changing toggles beside their context. Updates recalculate automatically after a valid edit. When results become stale during loading or invalid input, clearly mark them unavailable.

### Quick HP editing

Tapping HP opens a numeric input with current and maximum HP visible. Offer percentage entry as an alternative. Validate the range from zero to maximum HP and explain invalid values inline. Preserve exact HP when switching Pokémon or tabs. Never reset HP to full as a side effect of changing the attack direction.

### Editing a Pokémon

Use a bottom sheet that can expand to a full screen when the keyboard opens or content is long. Group inputs into Basics, Moves, Stats, and Conditions. Provide searchable species/move/item/ability pickers and explicit Done/Cancel actions. A separate Change action selects another box or trainer entry without overwriting the saved original.

Show common controls first: level, current HP, item, ability, status, moves, and boosts. Keep nature and IV/EV details available in Stats. Expose only controls valid for the active game configuration; do not apply ordinary Emerald assumptions without checking Emerald Kaizo data.

### Field conditions

Show a readable summary of weather, terrain when applicable, screens, hazards, and battle format. Indicate which side each condition affects. Provide an explicit reset-field action that preserves teams and selected Pokémon. A clean field also gets a visible label so the user knows it was considered.

### Team switching and predictions

Provide separately labeled player and trainer team strips with clear selection states and tap targets. Trainer teams retain their original order. Any predicted switch-in order belongs in a separate labeled view and is shown only after Emerald Kaizo compatibility is verified. Explain assumptions and unsupported cases. Never present a prediction as guaranteed.

## 5. Supporting screens

### Box

Show a searchable list or compact grid with name, level, status, and identifying nickname. Distinguish duplicate species and forms. Selecting a Pokémon loads the player's side and returns to Battle. Keep editing distinct from selecting.

Start with manual creation and paste-based team import supported by the existing project. Import shows a preview, per-entry errors, and explicit Add versus Replace choices. A failed import preserves existing data. Offer file import where the inherited parser is compatible; direct emulator/save-file integration is a later feature until verified on iPhone.

### Trainers

Search by trainer and location where supported by the data. Show the complete trainer identity, including duplicate/rematch distinctions, before selecting a team. Display each team member's level and a compact moveset summary. Selecting a member loads the opponent's side and returns to Battle. Supply previous/next trainer actions only where upstream ordering exists.

### Settings and saved sessions

Show Emerald Kaizo plus the active data revision. Persist the box, matchup, trainer, HP, field, and notes locally after valid changes. Provide a portable export containing a schema version and game/data identity. Validate imports, preview replacements, and reject incompatible data with a helpful message. Provide an explicit session-reset action with confirmation because it discards user progress.

Browser storage is convenient but can be cleared. Make export easy to find and avoid implying cloud sync or guaranteed permanent storage. Retain access to the inherited desktop calculator while the new UI is being developed.

## 6. Visual direction and iPhone behavior

Use a calm dark interface with an emerald accent, clear typography, restrained type colors, and compact Pokémon artwork. Exact colors and spacing can be refined during the prototype. Use text and icons together for status and result meaning; color alone is insufficient.

- Design first for portrait widths of 375–430 CSS pixels; check 320 pixels and landscape as well.
- Use approximately 16-pixel body/input text and at least 44-by-44 CSS-pixel primary tap targets.
- Respect screen safe areas and the Home indicator; bottom navigation must not cover results or inputs.
- The keyboard must not obscure active HP/search inputs or sheet actions.
- Support system text enlargement, accessible labels, visible focus, logical reading order, and reduced motion.
- No essential action depends on hover, a hardware keyboard, or an unexplained gesture.
- Maintain at least 4.5:1 contrast for normal text. Pair outcome colors with explicit descriptions.
- On larger displays, expand into a two-column layout while keeping the same data model and navigation concepts.

## 7. Loading, empty, and error states

| State | Required behavior |
| --- | --- |
| First visit | Open Emerald Kaizo; explain how to select a trainer and add/import a Pokémon |
| Empty box | Offer Add Pokémon and Import; avoid an unexplained blank grid |
| Missing matchup side | Prompt selection; do not calculate against a hidden default |
| Game data loading | Show progress context and disable results until the correct data is ready |
| Data load failure | Explain which game failed; offer retry; preserve saved session |
| Invalid HP or stat | Show an inline error and suppress affected results |
| No search matches | Preserve query and offer clear-search |
| Unsupported mechanics | Mark affected results or prediction unavailable; do not silently approximate |
| Offline without downloaded data | State that the selected game needs a connection |

## 8. Architecture and fork maintenance

Keep the inherited desktop entry point initially. Add a separate mobile entry point and component structure, sharing the fork's calculation and game-loading code through an adapter. A lightweight component framework with TypeScript is a reasonable implementation choice; select it after checking the inherited global-script dependencies. A framework migration is not a prerequisite for the first prototype.

The adapter accepts explicit battle state and produces structured results. Move logic that currently reads directly from desktop controls into reusable functions. Preserve game-specific hooks. Avoid maintaining hidden duplicate desktop controls as the permanent source of mobile state, and avoid cloning the calculation formulas into new UI code.

Store an explicit game configuration independently from UI state. Lazy-load Emerald Kaizo data and avoid rendering or loading full Mastersheet content at startup. The upstream README warns of roughly 500 MB of Mastersheet memory use and discourages mobile use; a later encounter/trainer browser should load bounded subsets.

Track the original repository as upstream and isolate mobile UI changes from mechanics changes. Before merging upstream updates, rerun the recorded Emerald Kaizo comparisons. Preserve inherited license notices and attribution. Review inherited analytics and third-party scripts deliberately before publishing.

GitHub Pages is a suitable initial hosting target. Use repository-relative paths so deployment under `/Dynamic-Calc-Mobile/` works. Public hosting and the app itself are later implementation steps, not completed by this specification.

## 9. Milestones

| Milestone | Deliverable | Exit criterion |
| --- | --- | --- |
| 0 — Baseline | Fork, source inventory, pinned Emerald Kaizo configuration and comparison fixtures | Differences between original and current linked reference are recorded and resolved for supported calculations |
| 1 — Battle prototype | Mobile entry point, two combatants, HP editing, four moves per direction, field editing | A complete matchup can be edited and compared on an iPhone without horizontal page scrolling |
| 2 — Usable release | Box/import, Trainers, Settings, saved session and export/import | Run preparation and matchup switching work end to end without losing state |
| 3 — Installable/offline web app | Home Screen assets, manifest, explicit game download and update handling | Downloaded Emerald Kaizo matchups work offline and updates do not mix engine/data revisions |
| 4 — Expansion | Additional validated games, lightweight encounters, optional native package | Each addition has its own compatibility checks and a concrete user benefit |

Full Mastersheet, accounts/cloud sync, an App Store release, and broad multi-game support are outside the first usable release.

## 10. Validation and acceptance criteria

Calculation comparisons must use identical inputs and pinned game data. Cover both attack directions, physical/special/status moves, relevant type interactions, ability/item effects, stat stages, current HP, critical-hit settings, weather, side conditions, and game-specific mechanics found during the audit. Include supported spread/doubles cases before advertising doubles support. Match raw rolls and knockout descriptions, not only rounded percentages. Investigate reference disagreements rather than automatically treating either calculator as ground truth.

Interaction checks must establish that:

1. Both Pokémon and their identities remain clear while comparing damage.
2. HP and condition edits produce current results with no stale display.
3. Switching attack direction, tabs, box entries, or trainer members preserves the correct state.
4. Imports validate and preserve existing data on failure; export/import restores a saved session.
5. Long names, empty data, invalid inputs, loading failures, and large text remain usable.
6. VoiceOver can identify and operate the key Battle controls.
7. Portrait Safari, the on-screen keyboard, landscape, and later Home Screen mode work on a physical iPhone.
8. No mobile startup path loads full Mastersheet content.

For performance, target near-immediate result updates after valid edits; measure on a physical iPhone before setting a numerical release budget. Separate data download time from calculation latency.

## 11. Source references

- [Requested upstream repository](https://github.com/hzla/Dynamic-Calc)
- [Inspected upstream commit](https://github.com/hzla/Dynamic-Calc/commit/42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74)
- [Game selector and script loading](https://github.com/hzla/Dynamic-Calc/blob/42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74/index.html)
- [Desktop layout constraints](https://github.com/hzla/Dynamic-Calc/blob/42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74/css/main.css)
- [Calculation engine](https://github.com/hzla/Dynamic-Calc/tree/42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74/calc)
- [Shared controls and mechanics parameters](https://github.com/hzla/Dynamic-Calc/blob/42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74/js/shared_controls.js)
- [Local persistence and game integration](https://github.com/hzla/Dynamic-Calc/blob/42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74/js/showdown_hooks.js)
- [Backup data mapping](https://github.com/hzla/Dynamic-Calc/blob/42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74/backups/title_to_backup_mappings.js)
- [Current linked Emerald Kaizo calculator](https://hzla.github.io/Dynamic-Calc-Decomps/?data=ek)
- [Upstream features and Mastersheet warning](https://github.com/hzla/Dynamic-Calc/blob/42b4cdc0f11de43ecabf3a5d2c1aba67e46e2f74/README.md)
