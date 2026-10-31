# Native UI, rifle and animation

Mission01 renders its interface with native GDevelop Sprite, Text, and Panel Sprite (nine-patch) objects on a fixed HUD layer. Generated icon controls cover play, pause, resume, replay, help and close. The generated panel crop supplies the nine-patch artwork. Native cursor, visibility and mouse-release conditions write `UIAction` in the event sheet; the network event forwards permitted commands to the server. There is no HTML/CSS mission overlay or DOM hit testing. The JavaScript events still handle networking and bind server snapshots to native objects, as in the referenced Animal Hunter project.

The compact HUD shows shield pips, time, fuse state, next objective and AND signals. Controls live in the help dialog instead of a permanent text strip. Help pauses a running mission and resumes it on close; opening help from an existing pause preserves that pause. Only the nearest contextual puzzle prompt is visible. The camera keeps the floor above the bottom HUD. Dialogs dim the world and the briefing previews the armed cyborg.

The rifle and muzzle flash are separate generated 40x24 sprites. J or left mouse fires horizontally in the last movement direction. Running, jumping, falling and stationary firing keep their locomotion pose. A short 120ms hurt response is independent of the one-second damage immunity window. Jump/fall hold a readable frame; landing has a brief settle. Player position and camera are smoothed between snapshots; collision and damage remain authoritative. Pause freezes sprite animations as well as server time, bots and projectiles.

`PULSE_RIFLE` and `rifleMuzzle()` in `shared/mission.js` define mirrored gun offsets, barrel hardpoints, speed and the 350ms cooldown. The server supplies this configuration with the level. Projectile hits and cooldowns cannot be claimed by the browser. Native release flags preserve taps completed between frames without turning release after a held interaction into a second toggle.

## Folder and editing guide

- `src/events/mission-network.js`: connection, native input and command forwarding.
- `src/events/mission-world.js`: actor, weapon and world sprite presentation.
- `src/events/mission-hud.js`: native text/state binding, dialog visibility and hover feedback.
- `src/events/workshop.js`: retained earlier workshop prototype.
- `scripts/native-ui.js`: editable GDevelop object/event definitions and layout generation.
- `assets/sources/`: original sheets grouped by art family; JSON generation records retain prompts and paths.
- `assets/runtime/`: generated character, weapon, UI, effect and environment folders. `manifest.json` records source crops, dimensions, animation metadata and relative directories.

Run `python scripts/export-mission-art.py` after changing art exports, then `python scripts/check-mission-art.py`. The rifle exporter thresholds alpha before tight bounds so faint generator ghosts do not flatten the weapon. The final muzzle frame is intentionally clear. Source PNGs are preserved. Rebuild with `npm run build:client`, then reopen `LogicGate.json` in GDevelop. Save editor changes first: Mission01 objects, native click events and bindings are generated, so edits to generated sections must be reflected in their sources before rebuilding. Sandbox remains separate.

## Verification

Unit checks cover left/right ground/airborne hardpoints and server firing cooldowns. The real exported GDevelop browser run clicks native controls, verifies help/pause/resume, uses keyboard/mouse fire, checks idle/run/airborne animation selection, plays the complete mission and confirms saved unlock after server restart and failure/retry. It runs against JSON or PostgreSQL in WSL Docker. Runtime art checks cover preserved sources, exact sizes, alpha, palettes and explicitly declared clear tails. Screenshots are reviewed at 960x540; resized canvas input is checked separately.

Later levels, audio and final artist polish remain separate work. This rework does not add free aiming or co-op.
