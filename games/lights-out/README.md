# Lights Out 🔦

A horror-education browser game where the flashlight battery is tied directly to question performance.

## Gameplay

- Move with **WASD** or **Arrow Keys**.
- Walk near a glowing power terminal and press **E**.
- **Correct answers recharge the flashlight** and add score.
- **Wrong answers drain the battery** and reduce score.
- The flashlight slowly drains while you move.
- At **0% battery**, the screen goes nearly black and you must navigate using audio beeps.
- Reach the green **EXIT** to escape.
- Choose Easy, Medium, or Hard difficulty.

## Run locally

Because this game is plain HTML/CSS/JavaScript, you can open `index.html` directly, or run a small local server:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080
```

## Controls

- `WASD` / Arrow keys — move
- `E` — use nearby power terminal
- `M` — mute/unmute sound

## Files

- `index.html` — game UI
- `style.css` — styling
- `game.js` — game logic

## GitHub

Create a new repository and push from this folder:

```bash
git init
git add .
git commit -m "Initial commit: Lights Out game"
git branch -M main
gh repo create lights-out-game --public --source=. --remote=origin --push
```
