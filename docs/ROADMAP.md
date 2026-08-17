# Roadmap

## Now — Repository reliability

- [x] Add structured bug, feature, and game issue forms
- [x] Add dependency-free arcade integrity validation
- [x] Run validation automatically in GitHub Actions
- [x] Add contribution and pull-request guidance
- [x] Add package metadata and standard project scripts
- [ ] Add a lightweight smoke test that requests every game entry point from the local server

## Next — Launcher quality

- [ ] Add keyboard navigation and stronger focus states
- [ ] Add optional favorites and recently played games using local storage
- [ ] Improve per-game metadata such as subject, difficulty, and recommended age/grade
- [ ] Add launcher-level accessibility checks
- [ ] Add a no-JavaScript fallback list of games

## Later — Learning system consistency

- [ ] Define a shared game result format for score, accuracy, and session duration
- [ ] Create reusable question-bank conventions where appropriate
- [ ] Add optional local-only progress export/import
- [ ] Document a repeatable checklist for bringing standalone games into the arcade

The arcade should stay local-first and simple to run. New infrastructure should earn its complexity by improving reliability, accessibility, or learning value.

See [ISSUE_BACKLOG.md](ISSUE_BACKLOG.md) for GitHub-ready issue scopes.
