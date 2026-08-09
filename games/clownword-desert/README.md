# ClownWord Desert 2.0

[![Version](https://img.shields.io/badge/version-2.0.0-f4af39)](../../releases/tag/v2.0.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![JavaScript Canvas](https://img.shields.io/badge/JavaScript-Canvas-f7df1e?logo=javascript&logoColor=111)](index.html)
[![Play Online](https://img.shields.io/badge/Play-GitHub%20Pages-57c7ff)](https://iamrichmack111.github.io/clownword-desert/)

**ClownWord Desert 2.0** is a standalone educational action game. Students explore a scrolling desert, spell words carried by clown villains, seal circus tents, fight Ringmaster bosses, and receive a saved grade at the end of every session.

## Major 2.0 features

- Student name entry and returning-student profiles
- Automatic numeric and letter grades
- Saved session history in browser localStorage
- CSV exports for one student session or all student records
- Individual sight words displayed above clown enemies
- Slow-motion spelling focus mode
- Spoken word pronunciation through browser speech synthesis
- Missed-word correction and spaced review
- Tent seal words and multi-phase Ringmaster bosses
- Multiple clown classes: runner, tank, mime, juggler, balloon, and standard
- Four named desert regions
- Custom word-list mode
- Mobile direction pad and on-screen spelling keyboard
- High-contrast and reduced-motion settings
- Pause, fullscreen, print report, and sound controls
- Day/night visual cycle
- Minimap, combos, healing rewards, particles, and saved statistics
- No framework, dependency, backend, account, or internet connection required

## Student grading

Each session receives a score from 0–100:

| Category | Weight |
|---|---:|
| Spelling accuracy | 70% |
| Tents sealed | 20% |
| Attempted words eventually mastered | 10% |

Letter grades use a standard scale:

- A+: 97–100
- A: 93–96
- A−: 90–92
- B range: 80–89
- C range: 70–79
- D: 60–69
- F: below 60

The session report includes:

- Student name
- Selected level
- Numeric and letter grade
- Accuracy
- Correct answers and attempts
- Tents sealed
- Ringmaster bosses defeated
- Word mastery
- Best spelling combo
- Time played
- Outcome
- Words needing review
- Recent student history

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys | Direction pad |
| Sprint | Hold `Shift` | Hold `RUN` |
| Enter spelling focus | `Space` or type a letter | `SPELL` |
| Submit spelling | `Enter` | `CAST` |
| Correct a letter | `Backspace` | `⌫` |
| Hear selected word | `H` | `HEAR` |
| Cancel spelling focus | `Escape` | `CANCEL` |
| Pause | `P` | Pause button |
| Fullscreen | Fullscreen button | Fullscreen button |

All letter keys are reserved for spelling, so words containing W, A, S, or D never conflict with movement.

## Gameplay instructions

1. Enter the student’s name.
2. Choose a built-in sight-word level or provide a custom list of at least five words.
3. Use the arrow keys to explore the desert.
4. Every clown carries a word above its head.
5. Press `Space` or begin typing to enter spelling focus. Time slows while spelling.
6. Type a complete nearby word and press `Enter`.
7. Correct spellings damage the matching clown.
8. Approach an active circus tent and spell its gold seal word.
9. Complete the tent’s seal meter to summon a Ringmaster.
10. Defeat the Ringmaster’s multiple spelling phases to seal the tent.
11. Seal all eight tents to win.
12. Review and export the automatically generated grade report.

## Enemy types

- **Standard clown:** balanced movement and word difficulty
- **Runner:** moves quickly and usually carries a short word
- **Tank:** moves slowly but needs two correct spellings
- **Mime:** hides its word after several seconds
- **Juggler:** rotates the displayed letters to increase visual difficulty
- **Balloon clown:** drifts unpredictably
- **Ringmaster:** a large boss with several word phases

## Learning system

Incorrect answers do more than punish the player:

- The typed answer and expected answer are shown.
- The first likely error position is identified.
- The correct word is spelled aloud when speech is enabled.
- The missed word is weighted to return later in the session.
- Frequently missed words carry into future sessions for that student.

## Privacy and storage

Student data remains inside the browser using `localStorage`. The game does not send names, grades, or results anywhere. Clearing browser storage or pressing **Clear All Records** removes the saved profiles.

Because localStorage belongs to a browser profile, use CSV export for permanent records or transferring results to another computer.

## Run locally

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8080
```

Visit `http://localhost:8080`.

## Upgrade an existing repository

Copy the 2.0 files over the current repository:

```bash
cd ~/clownword-desert

cp -a /path/to/clownword-desert-v2/. .

git add .
git commit -m "Add grading, student profiles, bosses, and spelling upgrades"
git tag -a v2.0.0 -m "ClownWord Desert 2.0.0"
git push origin main
git push origin v2.0.0
```

Or run the included publishing helper:

```bash
chmod +x publish_v2.sh
./publish_v2.sh
```

## Project structure

```text
clownword-desert/
├── index.html
├── README.md
├── CHANGELOG.md
├── LICENSE
├── VERSION
├── manifest.webmanifest
├── icon.svg
└── publish_v2.sh
```

## Custom word lists

Choose **Custom Word List** on the start screen. Words can be separated by spaces, commas, semicolons, or new lines. Valid words contain letters and may contain an apostrophe.

## Technical design

- HTML5 Canvas 2D rendering
- JavaScript game loop with `requestAnimationFrame`
- Browser Speech Synthesis API
- Web Audio API
- localStorage student profiles
- Blob-based CSV report export
- Responsive touch controls
- Zero runtime dependencies

## License

MIT License. See [LICENSE](LICENSE).
