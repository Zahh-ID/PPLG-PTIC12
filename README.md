# LogicWorld / LogicGate

Educational side-view sandbox about Boolean logic gates, built with GDevelop.

## Open and run

Open `LogicGate.json` in GDevelop. This is a folder project; keep `layouts/` alongside it. Launch Preview. Use arrow keys to move and Space or Shift to jump (GDevelop default platformer controls).

## Layout

- `LogicGate.json`: project entry point, settings and resources.
- `layouts/`: split scene files; `Sandbox` is the initial scene.
- `assets/placeholders/`: original solid-color PNGs for development, replace with final pixel art.

## Current scaffold

960 x 540 test scene, 16 x 32 player with platformer behavior, solid ground, nearest-neighbor scaling. No multiplayer, circuits, inventory, quests or persistence yet.

First milestone: two players operate two switches connected to an AND gate and door, with state preserved after reconnecting.

Generated exports, backups, dependencies and local secrets are excluded from Git. Save scene changes in GDevelop before committing.
