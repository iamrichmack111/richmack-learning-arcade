# Richmack Learning Arcade

A local-first educational arcade containing 13 browser games in one launcher. The collection combines math, spelling, calendars, fractions, and other learning tasks with horror, adventure, racing, survival, and arcade-style game loops.

## Features

- 13 educational games in one launcher
- Horror, Math, Spelling, and Adventure filters
- Search and random-game launch
- Local Python web server that automatically selects an available port
- No application build step or third-party runtime dependency
- Linux / Pop!_OS desktop launcher installer
- macOS launcher support
- Automated repository integrity validation
- Structured GitHub issue templates for bugs, features, and new games

## Quick start

```bash
chmod +x start.sh
./start.sh
```

Or run the server directly:

```bash
python3 arcade.py
```

The server binds to `127.0.0.1`, chooses an available port, and opens the arcade in your default browser.

## Validate the arcade

```bash
python3 scripts/validate_arcade.py
```

If Node/npm is installed, the same check is available through:

```bash
npm test
```

The validator confirms that every game registered in `arcade.js` has a game directory, `index.html`, and README, and that registered slugs and titles are unique.

## Desktop launcher on Linux

```bash
chmod +x install-linux-desktop.sh
./install-linux-desktop.sh
```

## Games

- The Backrooms: Math Levels
- Dead Letter District
- Equation Outbreak: Road Scholar
- Cabin 13
- Fraction Food Truck
- Snow Calendar Rider 3D
- Scary Elevator 3D
- Lights Out
- The Abandoned School 3D
- Math Heist
- Color Current 3D
- Clownword Desert
- Laundry Night

## Project structure

```text
.
├── arcade.py                  # Local launcher server
├── arcade.js                  # Game registry and launcher behavior
├── arcade.css                 # Arcade launcher styling
├── index.html                 # Arcade launcher UI
├── games/                     # Self-contained games
├── scripts/validate_arcade.py # Integrity checks
├── .github/                   # Issue forms, PR template, CI workflow
├── docs/ROADMAP.md            # Planned improvements
├── CONTRIBUTING.md
├── CHANGELOG.md
└── package.json               # Standard start/test commands; no npm deps
```

## Project workflow

Bugs, feature ideas, and new-game proposals have dedicated GitHub issue forms. Before a pull request, run the validator and manually test every affected game. See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ROADMAP.md](docs/ROADMAP.md).

## Created by Richmack
