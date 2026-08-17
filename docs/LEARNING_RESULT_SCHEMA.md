# Shared Learning Result Schema

## Purpose

Richmack Learning Arcade games remain independently runnable while reporting learning activity in a consistent format.

The shared learning-result schema defines the target contract for the parent portal, browser storage, and future AWS persistence.

## Version

Current schema version: `1`

## Required Fields

- `version` — schema version
- `student_id` — student identifier
- `game_id` — stable game slug
- `subject` — broad learning subject
- `skill` — specific skill practiced
- `duration_seconds` — active session duration
- `timestamp` — UTC ISO-8601 timestamp

## Optional Fields

- `score` — numeric game score or null
- `accuracy` — normalized value from 0 through 1
- `completed` — whether the activity was completed
- `metadata` — game-specific information

## Example: Fraction Food Truck

```json
{
  "version": 1,
  "student_id": "student-123",
  "game_id": "fraction-food-truck",
  "subject": "Math",
  "skill": "Fractions",
  "score": 850,
  "accuracy": 0.92,
  "duration_seconds": 420,
  "completed": true,
  "timestamp": "2026-08-17T02:55:00Z",
  "metadata": {
    "rounds_completed": 10
  }
}
```

## Example: Clownword Desert

```json
{
  "version": 1,
  "student_id": "student-456",
  "game_id": "clownword-desert",
  "subject": "Spelling",
  "skill": "Word Recognition",
  "score": 340,
  "accuracy": 0.8,
  "duration_seconds": 275,
  "completed": true,
  "timestamp": "2026-08-17T03:02:00Z",
  "metadata": {
    "words_attempted": 15,
    "words_correct": 12
  }
}
```

## Design Rules

Keep the shared schema small. Game-specific information belongs in `metadata`.

## Storage

For local testing, results may be stored in browser storage. For a future AWS deployment, the same result shape can be sent to an authenticated backend and persisted centrally.

## Privacy

Do not include passwords, parent PINs, authentication tokens, secrets, or credentials in learning-result payloads.

## Versioning

Breaking changes require a new `version`. Additive game-specific fields should normally go inside `metadata`.
