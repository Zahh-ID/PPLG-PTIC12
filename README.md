# LogicWorld / LogicGate

Protocol Zero: a solo-first sci-fi action/puzzle game built with GDevelop, Node.js and PostgreSQL in WSL Docker. Level 01 is now playable.

Current campaign design: [Protocol Zero](docs/campaign-scenario.md), an untimed tutorial plus six logic/combat missions. Level 01 has a complete prototype loop; the tutorial and Levels 02–06 remain planned. Level 05 obtains a giant robot; Level 06 pilots it against an independent giant boss.

## Open and run

Requires Node.js 22+ and GDevelop 5.6.283+. Run `npm ci`, `npm run db:configure`, `npm run db:up`, `npm run db:migrate`, `npm run build:client`, then `npm start`. PostgreSQL runs through Docker inside WSL Ubuntu. Open `LogicGate.json` in GDevelop and launch Preview. Keep `layouts/` beside the project. `Mission01` is the initial scene; `Sandbox` preserves the earlier shared-workshop prototype.

After editing files in `src/events/`, save editor changes, run `npm run build:client` and reload the GDevelop project. The build generates Mission01 layout/art placements, native HUD objects and click events, and the scene snapshot bindings. `scripts/native-ui.js` authors the native UI. Save editor changes before rebuilding: generated Mission01 changes are replaced by the builder. Edit authored geometry in `shared/mission.js`, not the generated mission layout. Art exports can be reproduced with `python scripts/export-mission-art.py` (Pillow required).

For standalone browser play, export GDevelop as an HTML5 folder into `exports/web` (containing `index.html`). With the server running, open <http://127.0.0.1:8787>. Campaign attempts are solo and isolated per profile. Reconnecting pauses the current in-memory attempt; restarting the server offers a fresh briefing while keeping saved campaign progress.

Copy `.env.example` to `.env` for server overrides. `?server=ws://HOST:PORT` overrides the browser's endpoint. Default server binding is local-only. LAN testing requires `HOST=0.0.0.0` and the server's reachable address in the browser URL. This prototype is for trusted peers; HTTPS hosting needs a secure WebSocket endpoint.

## Play

- Start Mission begins the six-minute clock. Escape/Pause freezes the solo simulation; losing focus pauses too.
- Arrows or A/D move, Space jumps, J or left mouse fires the pulse rifle in the last movement direction, K/Shift dashes, E interacts. H opens help and pauses a running mission. R retries a finished, saved attempt.
- Jump the broken loading bridge. At feed A, press E. Recover the guarded fuse and install it at feed B with E, then press E again to toggle B.
- Both feeds must be ON. Hold E at the protected AND console for three uninterrupted seconds, then reach the lift before timeout.
- Patrols take three pulse hits and telegraph attacks. Health, damage, movement, time and outcomes are simulated by the server.
- Optional raised gantries lead to an archive log. Death or timeout fails the attempt; retry resets its clock, enemies and items. Completion unlocks Level 02 in PostgreSQL, but Level 02 is not implemented yet.

## Layout

- `LogicGate.json`: project entry point, settings and resources.
- `layouts/`: split scenes; generated `Mission01` plus the legacy `Sandbox`.
- `assets/sources/`: preserved image_gen source sheets and prompts; `assets/runtime/`: exact-size derivatives grouped into characters, weapons, UI, effects, and environment; `assets/placeholders/`: legacy workshop art.
- `src/events/`: mission network/input, native sprite presentation, native HUD bindings, and the retained workshop source.
- `server/`, `shared/`: authoritative commands, circuit evaluator and world rules.
- `scripts/`, `tests/`, `docs/`: build tooling, verification and implementation notes.

## Current implementation

Level 01 includes briefing/start, authoritative movement/combat/clock, fixed feeds and fuse, AND defusal, extraction, pause, failure/retry and idempotent campaign saves. Its interface uses native GDevelop panel sprites, generated icon buttons and Text objects, with no HTML/CSS overlay. The rifle and muzzle flash are independent sprites, so shooting keeps idle/run/airborne animation intact. See [UI and animation](docs/native-ui-and-animation.md). Its four map zones use generated terrain, architecture and props with a raised optional route and parallax background. See [map design](docs/map-design.md) and [mission implementation](docs/level-one-implementation.md). The legacy workshop remains a separate scene. [Database setup and backups](docs/postgresql.md).

## Verify

`npm test` covers mission transitions, deadlines, pause, defusal interruption, combat, jumps, the optional route, idempotent progress, invalid socket commands, and legacy circuit/network behavior. `python scripts/check-mission-art.py` verifies exported sprite dimensions, alpha, palettes and nonempty frames (apart from the declared clear muzzle-flash tail).

`npm run test:postgres` checks PostgreSQL storage in isolated worlds. `npm run test:mission:postgres` plays the complete exported Level 01 using native icon clicks, mouse and keyboard input, verifies saved unlock after a server restart, then tests failure/retry. Tests remove only their own worlds.

After exporting Mission01 into `exports/web`, run `npx puppeteer browsers install chrome`, then `npm run test:mission:browser` for JSON-mode browser testing. Set `CHROME_PATH` to use an existing Chrome executable. For legacy two-tab workshop tests, export Sandbox as the initial scene into `exports/workshop`, then run `npm run test:browser` or `npm run test:browser:postgres`. Screenshots go in `.cache/`.

Generated exports, local saves, backups, dependencies and secrets are excluded from Git. The database and legacy `data/world.json` contain reconnect tokens: never publish them. PostgreSQL uses the `logicworld_postgres_data` Docker volume on WSL's Linux filesystem. Stopping the container preserves it. See the database guide for backup and recovery. Moving the legacy JSON file no longer resets an imported PostgreSQL world.

Later missions, tutorial, final animation/seam polish, audio, staging deployment and future co-op remain on Trello. Use feature branches and PR review; never push directly to main.
