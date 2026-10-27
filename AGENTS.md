# Instructions for AI agents

These instructions apply throughout Dynamic Calc - Mobile. Follow the user's explicit instructions and applicable platform/tool rules. Use the repository workflow for authorized project work; this file does not grant permission to merge, publish, message others, or change access beyond the user's authorization.

## Read before working

1. Read [Development Workflow](docs/Development-Workflow.md). It is the source of truth for issue structure, labels, milestones, board transitions, review, and completion.
2. Read the [documentation index](docs/README.md) and [design index](docs/design/README.md).
3. Read the design sections relevant to the task. For mobile UI and Emerald Kaizo work, start with [UI Design](docs/design/UI-Design.md).
4. Read the linked issue, its acceptance criteria, dependencies, and related PRs before changing code. Check for more specific instructions in directories you will modify.

Treat design specifications as intended behavior, not proof of implementation or calculation accuracy. Check document status and open questions against the current code. If instructions, designs, and issue scope disagree, explain the discrepancy and resolve it within the user's authorized scope; ask only when a consequential decision cannot be inferred. Do not silently broaden scope or mark proposed behavior as complete.

## Issues and project board

- Use GitHub Issues for actionable work and the [Project board](https://github.com/users/JohnGeiger8/projects/2) for execution status. Search for existing work before creating duplicates.
- Use one issue per independently verifiable outcome. Follow the workflow's Goal, Scope, Acceptance criteria, Dependencies, and References structure. Bugs also need reproduction details; calculation bugs need complete battle inputs and reference results.
- When authorized work lacks an issue, create or propose a scoped issue as appropriate to the request and available access. A read-only question does not require an issue. Do not turn unaccepted suggestions into implementation commitments.
- Use the workflow's exact label taxonomy: one primary kind (`bug`, `feature`, `investigation`, or `documentation`) and applicable areas (`ui`, `engine`, `game-data`, `infrastructure`). Use `good first issue` and `help wanted` only when their documented conditions are met. Verify labels and milestones exist before applying them.
- Follow **Backlog → Ready → In progress → In review → Done** and the entry criteria in the workflow. Respect maintainer ownership of triage, assignment, and Ready/Done decisions; carry out those actions only when authorized.
- Link blockers and explain their effect. Keep blocked work in its current status; do not hide it in Done. Follow the documented rules for paused, reopened, duplicate, and declined work.
- Keep issue and board state accurate. If permissions or tooling prevent an update, report the specific update still needed and continue unaffected authorized work. Never claim an issue, board transition, label, milestone, or automation exists without verification.

## Documentation and design references

- Include relevant repository document paths and section links in an issue's References and in PR descriptions when they explain requirements, decisions, or validation. Use relative Markdown links within the repository where practical.
- Keep product/UI specifications, architecture decisions, and mechanics baseline plans in `docs/design/`. Keep process instructions in `docs/Development-Workflow.md`.
- When adding a design, include date, status, goal, scope, decisions, open questions, and validation expectations. Add it to `docs/design/README.md`; update `docs/README.md` if documentation navigation changes.
- If implementation changes intended behavior, update the affected design in the same change, or clearly link a proposed design update for maintainer review. Distinguish a proposal from an accepted decision. Do not rewrite a requirement merely to make an incomplete implementation appear compliant.
- Track live task status in Issues and Projects rather than duplicating it in design checklists. Add issue/PR links to designs when useful for traceability.
- Keep references valid after moving or renaming documents. The mobile UI specification lives at `docs/design/UI-Design.md`; do not recreate its former `docs/UI-Design.md` location as a competing specification.
- Preserve upstream attribution and license notices when changing or documenting inherited code and data.

## Implementation and validation

- Follow the branch and PR process in the workflow. Keep changes focused and connect them to the issue and relevant design sections.
- Preserve existing calculation behavior unless the task explicitly changes it. Emerald Kaizo is the first game baseline. Follow the design's compatibility checks for the original fork and its separately linked Decomps reference; do not assume their data or mechanics match.
- Verify the issue's acceptance criteria using checks appropriate to the change. UI changes need relevant viewport/interaction evidence; engine or game-data changes need reproducible calculation comparisons. Documentation-only changes need content and link/render review.
- Report what was actually checked, results, and material limitations. Do not invent passing tests, reference calculations, device testing, independent review, or deployment success.
- Use `Closes #N` only when the PR fully resolves an issue; use `Refs #N` for partial work. Summarize the problem, resulting behavior, design references, and verification in the PR.
- Move work to In review when evidence is ready. Mark Done only after the workflow's acceptance and merge/findings requirements are satisfied. Verify actual automation behavior: setting Done currently closes the issue.
- Track deployment separately from task completion. A merged change is not proof that the public website is updated.

## Keep the process consistent

Avoid maintaining a second task tracker or duplicating the workflow rules in new documents. Propose process changes by updating `docs/Development-Workflow.md` and adjust this file's references if needed. Report any remaining setup or access limitations clearly rather than treating documented conventions as configured GitHub features.
