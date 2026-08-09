# Spelling Séance

A standalone educational horror spelling game where a ghost communicates through misspelled words.

## Story

You sit at an old séance table and ask one question:

**“What happened here?”**

A ghost answers — but its messages are broken.

Every word appears misspelled.

To understand the spirit, the player must correct each word. Every corrected spelling reveals more of the message. At the end of each chapter, a new clue explains part of the ghost's story.

The mystery grows across six chapters:

1. **The Empty Chair**
2. **The Locked Hall**
3. **The Missing Photograph**
4. **The Basement Tape**
5. **The Last Warning**
6. **What Was Behind the Door**

The final chapter reveals that the ghost may not have died in the séance room at all.

## Gameplay

The ghost displays a misspelled word.

The student types the correct spelling and presses **Enter** or clicks **Submit**.

Correct answers:

- advance the message
- reveal the chapter clue
- improve the student's grade

Wrong answers:

- increase the haunting meter
- darken the room
- make the ghost more visible
- cause visual disturbances
- can trigger brief jumpscares

## Features

- Student name entry
- Typed spelling answers
- Six mystery chapters
- Escalating horror effects
- Animated ghost
- Candle-lit séance room
- Recovered-message system
- Accuracy percentage
- Letter grades
- Saved grade history
- CSV grade export
- Browser localStorage
- No npm install required
- Works offline after download

## Grading

The grade is based on spelling accuracy:

```text
Score = Correct Answers / Total Attempts × 100
```

| Score | Grade |
|------:|:-----:|
| 90–100% | A |
| 80–89% | B |
| 70–79% | C |
| 60–69% | D |
| Below 60% | F |

## Linux / Pop!_OS

```bash
chmod +x start.sh
./start.sh
```

## macOS

```bash
chmod +x start.command
./start.command
```

## Manual Start

```bash
python3 -m http.server 8110 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8110
```

## Grade Storage

Grades are saved locally in the browser.

Use **View Grades → Export CSV** to save the gradebook as a spreadsheet-compatible file.
