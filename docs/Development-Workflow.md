# Development workflow

This is the working agreement for Dynamic Calc - Mobile. It starts with one maintainer and scales to community contributions. Issues are the source of truth for tasks, the Project board shows execution status, milestones group releases, and design documents explain intended behavior and decisions.

## Where work lives

- Repository: [JohnGeiger8/Dynamic-Calc-Mobile](https://github.com/JohnGeiger8/Dynamic-Calc-Mobile).
- Project: [Dynamic Calc - Mobile](https://github.com/users/JohnGeiger8/projects/2).
- Workflow: `docs/Development-Workflow.md` (this document).
- Design documents: `docs/design/`; start with [UI Design](design/UI-Design.md).
- Issues: actionable changes, bugs, investigations, and documentation tasks.
- Pull requests: proposed changes and their verification evidence.
- Discussions, when enabled: open-ended questions, suggestions, and community conversation.

Keep task status in Issues and Projects rather than copying a live checklist into a design document. Link designs from issues and link related implementation issues from designs when useful. A new suggestion enters evaluation; it is not automatically a commitment.

## Creating an issue

Search existing issues first. Create one issue for one independently verifiable outcome. Use a concrete title such as “Allow current HP editing on the Battle screen.” A large feature can have a parent issue and separately assigned sub-issues. Use a checklist for small steps within a single outcome; use separate issues for independently reviewable work.

Use this structure in the issue body:

```markdown
## Goal
What improves for the player or project, and why?

## Scope
What behavior changes? State meaningful exclusions or constraints.

## Acceptance criteria
- [ ] Observable outcome that proves the task is complete.
- [ ] Relevant error/edge case or verification requirement.

## Dependencies
None, or links to blocking issues with an explanation.

## References
Relevant design sections, examples, screenshots, or source details.
```

For bugs, also include expected versus actual behavior, reproduction steps, app/data version, and device/browser. Calculation bugs require both Pokémon's inputs, moves, field conditions, and expected/reference results. Avoid posting private save data or unrelated personal information. Investigations should name the question and the decision or evidence they will deliver.

The maintainer triages new issues, checks for duplicates, selects labels, and decides whether they are ready. Community reporters do not need to know the labels or fill in project metadata themselves.

## Labels

Apply one primary kind label and one or more area labels when known. These names are the agreed taxonomy; the repository label catalog must contain them before they can be applied. Existing GitHub default labels may remain, but avoid synonyms for the labels below.

| Group | Label | Meaning |
| --- | --- | --- |
| Kind | `bug` | Existing behavior is incorrect or broken |
| Kind | `feature` | Adds or improves a user capability |
| Kind | `investigation` | Answers a question or resolves uncertainty before implementation |
| Kind | `documentation` | Changes guides, specifications, or contributor documentation |
| Area | `ui` | Layout, interaction, accessibility, and presentation |
| Area | `engine` | Calculation logic, adapters, and mechanics validation |
| Area | `game-data` | Species, moves, trainers, game configuration, and data revisions |
| Area | `infrastructure` | Builds, hosting, automation, tooling, and repository setup |
| Community | `good first issue` | Small, well-specified task with clear guidance and limited context required |
| Community | `help wanted` | Maintainer welcomes a contributor taking ownership |

Do not label speculative or poorly understood work `good first issue`. Do not encode board statuses, releases, or every game as labels. Prioritize Ready items by board order initially; add a priority field only when it solves a real planning problem.

## Project board lifecycle

Use one board grouped by its Status field, in this order:

| Status | Entry condition | What happens next |
| --- | --- | --- |
| Backlog | New, untriaged, or deferred issue | Clarify, assess scope, label, and identify dependencies |
| Ready | Goal, scope, acceptance criteria, and references are sufficient; blockers are resolved | Maintainer orders the queue; a contributor can claim a task |
| In progress | An owner has begun work | Implement, update the issue with material findings, and link the branch/PR |
| In review | Change or investigation is ready to verify | Review scope, evidence, acceptance criteria, and documentation |
| Done | Acceptance criteria pass and the change is merged, or an investigation's findings are recorded and accepted | Close as completed and record deployment separately if applicable |

New imported issues start in Backlog. The issue remains open from Backlog through In review. If blocked after starting, keep its current status, link the blocking issue using a dependency where supported, and add a concise explanation. Return to Ready only when work is deliberately paused and can be picked up again. Never use Done to hide blocked or abandoned work.

Keep one development issue In progress at a time while working solo unless a dependency makes a second useful. Board order reflects the next work to pull; Backlog inclusion is not a delivery promise.

The maintainer owns triage and Ready/Done decisions. Contributors claim a Ready issue by commenting first; the maintainer assigns it to avoid duplicate effort. While solo, self-assignment and self-review are sufficient. If review finds significant changes needed, return to In progress.

Close duplicates, declined proposals, or obsolete issues as not planned, with a reason and any replacement link. Remove those cards from the active board rather than counting them as delivered work. Reopened work returns to Backlog for triage, or In progress when actively fixing a regression.

## Milestones and release scope

Start with three milestones; create them when release work is broken into issues:

1. **Emerald Kaizo Baseline** — identify and pin the game configuration, reconcile the original fork with the current linked reference, and record reproducible calculation comparisons.
2. **Battle Prototype** — complete one mobile matchup flow: Pokémon selection, HP editing, damage comparison, and field conditions.
3. **Community Beta** — add Box, Trainers, Settings, portable sessions, contributor guidance, and a verified shareable build.

Assign an issue to a milestone only when it is intended for that release. Do not invent deadlines or use completion percentage as a measure of engineering effort. Move unfinished work deliberately rather than closing it to finish a milestone. Later offline/PWA and multi-game work stays in Backlog until scoped.

## Implementation, review, and completion

1. Pick a Ready issue, assign an owner, and move it to In progress.
2. Create a descriptive branch such as `feature/12-hp-editor` or `docs/18-workflow`.
3. Make a focused change. Update the linked design if intended behavior changes.
4. Open a PR describing the problem, resulting behavior, linked issue, and verification. Use `Closes #N` for an issue fully resolved by the PR; use `Refs #N` for partial work.
5. Move the issue to In review when evidence is ready. Use screenshots for relevant UI changes and meaningful calculation comparisons for engine/data changes.
6. Verify acceptance criteria and required checks. Solo review is allowed; do not claim independent review occurred. Community contributions receive maintainer review.
7. Merge, confirm the linked issue closes, and set Done. Documentation-only tasks use link/render review; investigations attach findings and decisions rather than requiring a code change.

Done means the agreed work is accepted, not necessarily published. Track publication in a release issue or release notes with the app version and data revision. A merged PR alone does not mean the website has deployed successfully. Known limitations and deferred work should be linked explicitly.

## Automation rules

Prefer a small amount of automation with manual verification:

- Add new issues from this repository to the Project and default them to Backlog.
- Completed issues may move to Done automatically. Verify that not-planned closures do not appear as completed delivery.
- Reopened issues return to Backlog for triage.
- In review is set when verification is ready, not merely because a draft PR exists.
- Avoid automatic Done on PR merge alone: an issue may require multiple PRs or additional verification.

If a workflow cannot distinguish these cases, disable that rule and handle the transition manually. Do not assume automation is configured just because this document describes the desired behavior.

## Design document conventions

Keep product/UI designs, mechanics baseline plans, and architecture decisions in `docs/design/`. Use descriptive names such as `UI-Design.md` or `Emerald-Kaizo-Baseline.md` and list them in the design index. Each new design should include status, date, goal, scope, decisions, open questions, and validation expectations. Mark proposed behavior clearly; merge into the design only after the maintainer accepts it. Link implementation issues instead of duplicating their live status.

Current design: [UI Design and Emerald Kaizo baseline](design/UI-Design.md). Its implementation and calculation comparisons remain pending until the corresponding work is completed.

## Community growth and maintenance

Add structured issue forms and a contribution guide before the community beta. Offer `good first issue` tasks with enough detail to succeed and `help wanted` work with an owner available to answer questions. Keep broad ideas in Discussions when that feature is enabled, and create an issue when the next outcome becomes concrete.

Review Backlog and Ready periodically, close stale proposals with an explanation, and keep release notes honest about supported mechanics. Change this workflow through a focused documentation PR when the process needs to evolve. Avoid introducing sprints, estimates, or additional trackers until they are useful.
