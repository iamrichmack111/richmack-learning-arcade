# GitHub Issue Backlog

These issues are scoped so they can be created directly in GitHub and added to a project board.

## P1 — Add HTTP smoke test for every game

**Labels:** `testing`, `reliability`, `priority:high`

**Goal:** Verify that the local server can actually serve the launcher and every registered game entry point, not just that the files exist on disk.

**Acceptance criteria:**

- Start the arcade server on an ephemeral localhost port during the test.
- Request `/` and every `games/<slug>/index.html` path.
- Fail if any request is not HTTP 200.
- Run the smoke test in GitHub Actions.
- Keep the test dependency-free if practical.

## P1 — Improve keyboard navigation and focus visibility

**Labels:** `accessibility`, `launcher`, `priority:high`

**Goal:** Make the launcher fully usable without a mouse.

**Acceptance criteria:**

- Search, filter chips, random game, play, and new-tab actions have visible focus states.
- Tab order follows the visual reading order.
- Filter changes remain understandable to keyboard and assistive-technology users.
- No existing pointer interaction regresses.

## P1 — Add game metadata for subject and difficulty

**Labels:** `enhancement`, `launcher`, `learning`, `priority:high`

**Goal:** Help a learner or parent choose a game based on educational need rather than theme alone.

**Acceptance criteria:**

- Each game has a subject/skill value.
- Each game has a simple difficulty or grade-band value.
- Launcher cards display the metadata without becoming cluttered.
- Search matches the new metadata.

## P2 — Add favorites and recently played games

**Labels:** `enhancement`, `launcher`, `priority:medium`

**Goal:** Reduce friction when returning to preferred games.

**Acceptance criteria:**

- Players can favorite/unfavorite a game.
- Recently played games are tracked locally.
- Data stays in browser local storage; no account or server database is required.
- The feature degrades safely if local storage is unavailable.

## P2 — Add no-JavaScript fallback game list

**Labels:** `accessibility`, `resilience`, `priority:medium`

**Goal:** Preserve basic navigation if launcher JavaScript fails or is disabled.

**Acceptance criteria:**

- `index.html` contains a useful `<noscript>` game list.
- Every listed link points to a valid game entry point.
- The normal JavaScript experience remains unchanged.

## P2 — Define a shared learning-result schema

**Labels:** `architecture`, `learning`, `priority:medium`

**Goal:** Establish a common optional result shape across games before adding any aggregate progress feature.

**Acceptance criteria:**

- Document fields for game id, score, accuracy, duration, timestamp, and optional skill/topic.
- Define which fields are required versus optional.
- Include two example payloads from different games.
- Do not add telemetry or network transmission.

## P3 — Standardize standalone-game integration checklist

**Labels:** `documentation`, `maintainability`, `priority:low`

**Goal:** Make adding the next game predictable and less error-prone.

**Acceptance criteria:**

- Document directory requirements.
- Document launcher metadata requirements.
- Document screenshot/asset recommendations.
- Document validation and manual-test steps.
- Include the exact commands contributors should run before opening a PR.
