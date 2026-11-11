# Documentation scope

The root [agent instructions](../AGENTS.md) also apply. Use [Development Workflow](Development-Workflow.md) for process rules, [Repository Guide](Repository-Guide.md) for code navigation, [Developer Setup](Developer-Setup.md) for commands, and [design/README.md](design/README.md) for product and mechanics decisions.

- Keep live status and validation results in GitHub Issues/PRs. Retain dated historical evidence; update stale present-tense claims with a link to the accepted outcome.
- A new design needs date, status, goal, scope, decisions, open questions, and validation expectations. Add it to the design index. Do not rewrite a requirement just to make incomplete code appear compliant.
- Run `npm run check:docs` and `git diff --check` after documentation changes. Review the rendered Markdown and external references where they matter.
