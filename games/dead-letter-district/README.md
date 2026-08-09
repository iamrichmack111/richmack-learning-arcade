# Dead Letter District

A first-person 3D zombie spelling game built with JavaScript, CSS, HTML, and Three.js.

## Game rules

- You begin with **20 bullets**.
- Press **F** to open a spelling challenge.
- Every correctly spelled word awards ammunition:
  - Basic word: **10 bullets**
  - Advanced word: **15 bullets**
  - Expert word: **25 bullets**
- Every **10 correct words** upgrades your gun.
- Zombies become tougher and spawn faster as waves increase.
- The game ends when your health reaches zero.

## Controls

- `W A S D` — Move
- `Mouse` — Aim
- `Left click` — Shoot
- `F` — Spell a word for ammunition
- `Shift` — Sprint
- `Esc` — Pause / release mouse

## Run the game

Because the project imports Three.js as a browser module, run it from a small local web server instead of double-clicking `index.html`.

### Linux or macOS

```bash
cd zombie_spelling_3d
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000
```

### Windows

```powershell
cd zombie_spelling_3d
py -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `index.html` — Game interface
- `style.css` — Visual design and responsive HUD
- `game.js` — Three.js world, zombies, shooting, spelling, ammo, waves, and upgrades

## Customize the spelling words

Open `game.js` and edit the `WORDS` array near the top:

```js
{ word: "example", tier: "basic", bullets: 10 }
```

Available tiers are `basic`, `advanced`, and `expert`.
