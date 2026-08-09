# Letter Raider 3D: The Lost Alphabet — Final Mission Update (Version 4)

A third-person browser spelling adventure built with HTML, CSS, JavaScript,
and Three.js.

## New mission system

Each uncollected letter is its own selectable mission.

1. Choose a letter from the starting mission menu, or press **M** in the
   overworld to cycle to the next unfinished mission.
2. Follow the radar to that mission's glowing letter crystal.
3. Hold **E** to mine the crystal and open its trial.
4. The explorer is teleported into a separate underground cave.
5. Four small stone soldiers spawn only after mining the letter.
6. Left-click to shoot them. Each soldier takes two hits.
7. When all four soldiers are defeated, a glowing portal opens.
8. Walk through the portal.
9. Spell any alphabetic word beginning with the mission letter to claim it.
10. Return to the overworld and select the next mission.

## Other features

- Required player name
- Full-keyboard spelling input
- Any letters-only word starting with the required letter is accepted
- Wrong spelling attempts are counted
- Final accuracy and A+ through F grade
- Animated third-person explorer, ponytail, stylish outfit, pickaxe, and gun
- Health meter and automatic cave-trial restart after health reaches zero
- Saved mission and spelling progress

## Controls

- **W A S D:** move
- **Mouse:** look around
- **Shift:** sprint
- **Space:** jump
- **E:** mine selected letter crystal
- **M:** cycle to the next unfinished letter mission
- **Left-click:** shoot during cave trials
- **Escape:** release the mouse / pause

## Run

```bash
cd letter-raider-3d
chmod +x start-game.sh
./start-game.sh
```

Then open:

```text
http://localhost:8080
```

Three.js and the title fonts load from public CDNs, so the game needs internet
access while opening.
