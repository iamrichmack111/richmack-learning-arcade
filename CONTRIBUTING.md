# Contributing to Richmack Learning Arcade

The arcade is intentionally dependency-light. A contribution should preserve the ability to launch the project locally with Python and play each game directly in a browser.

## Before opening a pull request

1. Run `python3 scripts/validate_arcade.py`.
2. Start the launcher with `./start.sh` or `python3 arcade.py`.
3. Test every game you changed.
4. Keep game-specific code inside that game's directory when practical.
5. Update the root launcher only when a game is added, removed, renamed, or its launcher metadata changes.

## Adding a game

A game is ready for the arcade when it has:

- `games/<slug>/index.html`
- `games/<slug>/README.md`
- A unique `slug` entry in `arcade.js`
- A title, description, category tags, emoji mark, and color pair
- A playable learning loop that works without a build step

Run the validator before committing. It checks that every registered game has an entry point and README and that no unregistered game directories were left behind.

## Issues

Use the GitHub issue forms for bugs, feature requests, and new-game proposals. Include reproducible steps and the affected game when reporting a defect.
