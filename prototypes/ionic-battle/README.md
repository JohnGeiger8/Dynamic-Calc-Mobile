# Ionic React Battle interaction study

This is a disposable interaction prototype for [issue #15](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile/issues/15), not the mobile Battle implementation. It uses illustrative names and HP only. It does not load Emerald Kaizo game data, call the calculation engine, save a session, or change the inherited desktop entry point. The [dated stack investigation](../../docs/design/Mobile-UI-Stack-Investigation.md) records the comparison and proposed decision.

With Node 22.15.0 and npm 10.9.2, from this directory:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run probe:engine
npm run build
npm run dev
```

Open `http://127.0.0.1:5173/Dynamic-Calc-Mobile/` for development. `npm run preview` serves the built output at `http://127.0.0.1:4173/Dynamic-Calc-Mobile/`. The configured Vite base is a repository subpath; neither command deploys anything. The browser-target engine probe bundles inherited modules without changing formulas, but does not execute an Emerald Kaizo calculation. Issue #17 owns the typed runtime adapter and fixture parity.

The [prototype CI workflow](../../.github/workflows/ui-stack-prototype.yml) repeats install, typecheck, boundary probe, and build on relevant PRs. It is a check for this study; issue #16 must define the production mobile build gate.

Try choosing both sides, filtering a sample name, clearing a no-match search, editing HP, and cancelling an invalid edit. The sheet expands when its numeric input receives focus. Real iPhone Safari keyboard, safe-area, text enlargement, and VoiceOver behavior still require device checks before the production Battle UI is accepted.
