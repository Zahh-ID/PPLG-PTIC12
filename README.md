# LogicWorld / LogicGate

Shared educational platformer prototype built with GDevelop and a Node.js WebSocket server.

Current campaign design: [Protocol Zero](docs/campaign-scenario.md), an untimed tutorial plus six solo-first logic/combat missions. Level 05 obtains a giant robot; Level 06 pilots it against an independent giant boss. These missions are planned; the playable workshop is still a technical prototype.

## Open and run

Requires Node.js 22+ and GDevelop 5.6.283+. Run `npm ci`, `npm run db:configure`, `npm run db:up`, `npm run db:migrate`, `npm run build:client`, then `npm start`. PostgreSQL runs through Docker inside WSL Ubuntu. Open `LogicGate.json` in GDevelop and launch Preview. Keep `layouts/` beside the project. Open two separate preview tabs for two players.

After editing `client/game.js`, save editor changes, run `npm run build:client` and reload the GDevelop project. This regenerates the Sandbox JavaScript event from the source file.

For standalone browser play, export GDevelop as an HTML5 folder into `exports/web` (containing `index.html`). With the server running, open <http://127.0.0.1:8787> in two tabs. Each tab has a separate identity; refreshing restores its inventory.

Copy `.env.example` to `.env` for server overrides. `?server=ws://HOST:PORT` overrides the browser's endpoint. Default server binding is local-only. LAN testing requires `HOST=0.0.0.0` and the server's reachable address in the browser URL. This prototype is for trusted peers; HTTPS hosting needs a secure WebSocket endpoint.

## Play

- Arrows move, Space jumps, R reconnects at spawn.
- Click **Build AND example** once in a fresh world. Click its switches: both ON opens the door.
- Toolbar or keys 1–9 select interaction or an item. Click to place; right-click to remove and reclaim it.
- Build on the 16px workshop grid, columns 12–109 and rows 17–28, within reach. Terrain is protected.
- Wires connect in four directions. Gate inputs are left/top and left/bottom with an empty row between; output is right/top. NOT uses its upper input only. Keep input networks separated.

## Layout

- `LogicGate.json`: project entry point, settings and resources.
- `layouts/`: split scene files; `Sandbox` is the initial scene.
- `assets/placeholders/`: original development sprites.
- `client/`, `server/`, `shared/`: scene code, authoritative commands, circuit evaluator and world rules.
- `scripts/`, `tests/`, `docs/`: build tooling, verification and implementation notes.

## Current scaffold

Shared workshop, movement/camera, placement/removal/inventory, switch/wire/AND/OR/NOT/lamp/door/block objects and saved world edits. Server controls circuit results and edits. Positions use client physics with server speed/bounds checks. PostgreSQL transactions persist worlds, devices and inventories; a legacy JSON save is imported once into a new database world. [Database setup and backups](docs/postgresql.md).

## Verify

`npm test` covers gate truth tables through wire networks, feedback rejection, protected cells, matching two-client circuit states, invalid edits and restart persistence.

`npm run test:postgres` checks the real WSL PostgreSQL database using isolated test worlds. `npm run test:browser:postgres` runs the two-tab GDevelop browser test against it. Tests clean up their own worlds and never overwrite the playable workshop.

After exporting into `exports/web`, run `npx puppeteer browsers install chrome`, then `npm run test:browser`. Set `CHROME_PATH` to use an existing Chrome executable. Browser tests use two real GDevelop tabs and an isolated temporary save; screenshots go in `.cache/`.

Generated exports, local saves, backups, dependencies and secrets are excluded from Git. The database and legacy `data/world.json` contain reconnect tokens: never publish them. PostgreSQL uses the `logicworld_postgres_data` Docker volume on WSL's Linux filesystem. Stopping the container preserves it. See the database guide for backup and recovery. Moving the legacy JSON file no longer resets an imported PostgreSQL world.

Three finished regions, quests, final art, staging deployment and eight-player soak testing remain on Trello. See [implementation notes](docs/implementation.md). Use feature branches and run tests before merging.
