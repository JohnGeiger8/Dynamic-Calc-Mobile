# Mobile UI stack investigation

Date: November 11, 2026

Status: **Accepted** under [issue #15](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/15), completed after [PR #25](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/pull/25) merged. The prototype evidence below is historical; it is not a completed Battle UI.

## Goal and scope

Choose a maintainable React-based mobile UI stack for the [Battle interaction and iPhone requirements](UI-Design.md#4-battle-screen). Compare Ionic React, Framework7 React, and Konsta UI, starting with Ionic. The focused [prototype](../../prototypes/ionic-battle/README.md) exercises two combatant cards, searchable selection, and an HP sheet. It uses sample identities and values; calculation integration, saved state, Box, Trainers, Settings, and the production mobile entry point remain in issues #17, #18–#22, #16, and the later usable-release work respectively. The inherited desktop page and accepted [Emerald Kaizo baseline](Emerald-Kaizo-Baseline-Report.md) are unchanged.

## Accepted decision

**Use Ionic React 9 with React 19, TypeScript, and Vite for the first Battle implementation.** Ionic supplies a tested modal/searchbar path and theming without adding a second utility-CSS system. The measured initial bundle is large, so #16 should split routes/components and set a reviewed size budget after a representative production shell exists. Keep the adapter in #17 independent of Ionic types so this UI choice does not shape mechanics contracts. Do not add Capacitor, an Ionic account, a paid service, or native packaging for the web prototype.

The [UI Design information architecture](UI-Design.md#3-information-architecture) specifies persistent navigation for the usable app. The investigation prototype has **only Battle**; it shows no links to unfinished destinations. Issue #16 should keep the first shell similarly honest. Add labeled Box, Trainers, and Settings destinations when their flows exist, while preserving the active matchup and per-tab context as the design requires. This staging does not change the intended final navigation.

## Inherited engine boundary

The desktop [entry point](../../index.html) loads jQuery, Select2, game scripts, then `calc/*.js` in a fixed order. Its inline `require()` shim returns a shared global `exports` object. `calc/index.js` exposes `calculate`, `Pokemon`, `Move`, `Field`, and generations, while [shared controls](../../js/shared_controls.js) create Pokémon and field values by reading desktop DOM controls; [showdown hooks](../../js/showdown_hooks.js) also use local storage and DOM state. The UI cannot safely import those control functions as a state API.

A browser-target bundling probe in the prototype shows a feasible **module boundary**, with a concrete compatibility fix still needed: direct `esbuild --bundle --platform=browser calc/index.js` fails because `calc/mechanics/custom/util.js` requires `../stats` as though it used the desktop shared-export shim. The probe aliases that single import to the existing `calc/stats.js` and bundles 25 inherited modules into 857,118 bytes. It neither changes nor duplicates formulas. It does **not** prove runtime configuration or calculation parity. Issue #17 should define typed battle/configuration/result contracts, make module resolution and game-specific globals explicit, load pinned data, and compare all 30 fixtures in a browser. The prototype keeps React state separate from the desktop globals in preparation for that adapter.

## Candidate comparison

The table separates **hands-on prototype observations** from **documentation/package-metadata comparisons**. Only Ionic was installed and exercised in this investigation. Package unpacked sizes are npm metadata for the named packages, not equivalent production bundle measurements; transitive dependencies differ.

| Criterion | Ionic React | Framework7 React | Konsta UI React |
| --- | --- | --- | --- |
| Components for this flow | **Exercised:** `IonModal` sheet, `IonSearchbar`, buttons, content/toolbar; two cards use semantic HTML and CSS. | **Documented:** cards, Searchbar, Sheet Modal, toolbar, router. Not exercised here. | **Documented:** cards, Searchbar, Sheet Modal, tab bar. Not exercised here. |
| Accessibility | **Observed in Chrome:** labeled sides/buttons, modal dialog, focusable search and HP inputs, inline error, disabled invalid Done, focus returned after dismissal. Ionic documents modal focus trapping. Physical VoiceOver and keyboard remain open. | Accessibility of sheet focus, keyboard, and VoiceOver was not measured. Requires a prototype before treating it as equivalent. | Accessibility of sheet focus, keyboard, and VoiceOver was not measured. Requires a prototype before treating it as equivalent. |
| Theme and layout | CSS variables and shadow parts support the dark/emerald design. Prototype uses safe-area insets, 44px buttons, reduced-motion CSS, and card stacking. | iOS/Material themes and sheet breakpoints are documented; likely needs theme overrides for the requested calm dark look. | Tailwind-driven iOS/Material styling and safe-area utilities are documented; brings a Tailwind configuration and likely a separate app shell. |
| License and maintenance signal | MIT; official React integration and current v9 docs. npm `@ionic/react@9.0.11`. This is a release signal, not a support guarantee. | MIT; current v9.3.0 docs/release. `framework7-react@9.3.0` plus `framework7@9.3.0`. | MIT; current v5.5.0 docs/release. Konsta describes itself as a good fit with a parent shell such as Ionic or Framework7. |
| Build cost evidence | **Measured:** `npm ci` lockfile, 57 packages after adding probe tool, 177 MB installed dependencies; `npm run build` 0.85s warm on Node 22.15.0. Main JS 1,323.75 kB / 292.20 kB gzip; CSS 18.97 / 4.96 kB. Vite warns about the >500 kB chunk. npm package unpacked size: 1,143,062 bytes for `@ionic/react` alone. | **Metadata only:** 395,128 bytes unpacked for `framework7-react`, plus 14,790,421 bytes for `framework7`; no install/build/runtime size measured. | **Metadata only:** 1,321,270 bytes unpacked for `konsta`; Tailwind and parent-shell costs not measured. |
| `/Dynamic-Calc-Mobile/` hosting | **Exercised:** Vite `base` emitted prefixed JS/CSS URLs; built preview loaded at the subpath with no console errors. | Vite can configure the same base, but this candidate was not built here. Its own router would need subpath testing. | Vite can configure the same base, but this candidate was not built here. Navigation would need an additional shell/router decision. |

Current official references: [Ionic React overview](https://ionicframework.com/docs/react/overview), [modal](https://ionicframework.com/docs/api/modal), [searchbar](https://ionicframework.com/docs/api/searchbar), and [theming](https://ionicframework.com/docs/theming/basics); [Framework7 React](https://framework7.io/react/introduction.html) and [Sheet Modal](https://framework7.io/react/sheet-modal); [Konsta UI React](https://konstaui.com/react), [Sheet](https://konstaui.com/react/sheet), and [Searchbar](https://konstaui.com/react/searchbar); [Vite base configuration](https://vite.dev/config/shared-options#base). Package versions and unpacked sizes were queried from the public npm registry on the date above.

## Validation and open questions

On Node 22.15.0 / npm 10.9.2, `npm run typecheck`, `npm run build`, and `npm run probe:engine` passed. In Chrome, the development prototype was exercised at 320×700, 375×812, 430×932, and 812×375 CSS pixels. Document width equaled viewport width at each size; cards stacked in portrait and sat side by side in landscape; measured card action buttons were 44px high. Search filtering, no-match and clear, both selection paths, long-name wrapping, HP Cancel/Done, invalid-range feedback, and focus-triggered sheet expansion were observed. The production preview at `/Dynamic-Calc-Mobile/` loaded prefixed assets and its tested selection/HP flow without console errors. A dev-server gesture error appeared twice during responsive/keyboard automation; it did not reproduce in the production-preview flow and needs retesting if the prototype is promoted.

The [prototype CI workflow](../../.github/workflows/ui-stack-prototype.yml) installs from its lockfile and repeats typecheck, boundary probe, and build for relevant PRs. Its remote run is separate from the local evidence above.

Open for maintainer review:

1. Monitor the production shell bundle as features are added; alternative builds were not measured in this investigation.
2. On a physical iPhone, check Safari portrait/landscape safe areas, on-screen keyboard with picker/HP sheet actions visible, system text enlargement, and VoiceOver labels/focus order. Chrome viewport emulation does not establish those results.
3. In #17, demonstrate real browser calculation parity for the pinned Emerald Kaizo configuration. This module bundle smoke check is intentionally narrower.
4. In #16, decide a production chunk budget and CI build gate after the representative shell and adapter boundary exist.

The dedicated HP editor accepts exact whole HP or a percentage from 0 to 100. Percentage entry converts to the nearest whole HP, with half values rounded up. Selecting a different species sets current HP to its maximum; selecting the same species retains current HP. Stat changes retain exact HP; if the new maximum is lower, the combatant editor requires correction before saving. Zero is retained in state but calculations remain unavailable because the inherited engine treats zero as full HP. Damage presentation and direction switching remain in #20.
