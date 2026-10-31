# Level 01 implementation

`Mission01` is the default GDevelop scene. The server simulates a separate solo mission per player. The shared workshop remains available as `Sandbox`; its saved devices are untouched.

## Authoritative state

`shared/mission.js` defines level geometry, player/enemy physics, AND evaluation, deterministic state transitions and progress reduction. The server advances missions on a monotonic clock with 20ms maximum physics substeps and publishes snapshots every 50ms. The client only submits button states and start/pause/retry requests; it cannot submit position, damage, time remaining, defusal success or campaign unlocks. Each mission is identified by a server-generated attempt UUID.

States: briefing → running → success/failed; pause is explicit during running. Defused is a committed objective inside the running state, not an automatic victory. Deadline expiry is checked before extraction on the same physics tick. Continuous valid input/output and proximity are required for the three-second defusal hold. Wrong output or releasing Interact resets the hold. Extraction requires defusal and positive time.

Player: 32x64 physics body, 5 health, 200px/s walk, jump, pulse shot with 350ms cooldown and 2-second dash cooldown. Patrols have 3 health, a 600ms windup, strike/recovery and a damage cooldown. Hurt invulnerability and a protected-console interaction prevent unavoidable repeated damage. Physics/hitboxes are independent of animation frame count.

The interface now uses native GDevelop HUD sprites, nine-patch panels, Text objects and native icon click events. Shooting uses an independent generated rifle and muzzle flash; it keeps the locomotion animation. See [native UI and animation](native-ui-and-animation.md) for controls, shared barrel hardpoints, input handling and the source-folder guide.

## Protocol additions

- `join` with `mode: "mission"` returns profile progress and the level definition; ordinary joins retain workshop mode.
- `mission` with `action: "start"`, `"pause"` plus boolean `paused`, `"retry"`, or `"input"` plus boolean left/right/jump/shoot/dash/interact states.
- `mission` snapshots contain attempt/state/timers/player/enemies/projectiles/objective flags/output/save status and the saved progress document.
- Workshop mutation and movement commands are rejected in mission mode. Invalid input fields and client-claimed success are rejected.

Disconnect clears input and pauses the in-memory solo mission. Rejoining the same tab identity resumes at a pause screen. Active attempts are not saved as resumable combat snapshots; server restart creates a fresh briefing. Completed campaign progress remains saved. Solo pause and input separation are groundwork for co-op, not implemented co-op gameplay.

## Progress and retry

On a terminal outcome, the server reduces the authoritative mission into a versioned `quest_progress` document and commits it through the existing PostgreSQL transaction before enabling Retry or confirming the saved unlock. Save failure is visible and retried; it never falls back to a different save file.

Progress stores recent attempt UUID/results, completed level best remaining time/completion count, unlocked level and permanent archive logs. Reducing the same attempt twice is a no-op. A successful L01 unlocks level 2; it does not expose an unimplemented Level 02 button. Failure grants no completion or unlock. Retry creates a new UUID and resets health, enemies, fuse, feeds, charge and clock while keeping permanent progress.

## Art and map

`scripts/export-mission-art.py` exports 32x64 cyborg and 32x48 patrol animation frames plus terrain, props and device art. New pulse/dash/defeat and patrol combat sources were produced with built-in image_gen. Source prompts and technical crop provenance are committed. Reviewed whole-object decor bounds avoid cutting neighbors out of an uneven generated grid.

The dock, gantry, power bay and control/lift zones have distinct geometry and set dressing. Upper gantries and the optional archive log are physically reachable and tested. See `map-design.md`. Source animation and terrain-seam polish remain art work; these are tested prototype exports, not a claim that all campaign assets are finished.

## Verification

- Unit/socket tests: briefing/pause/timeout, AND combinations/fuse requirement, interrupted hold, same-tick deadline priority, combat/invulnerability, gap/jump/dash, optional route, retry defaults, progress idempotency, rejected fake wins/coordinates and reconnect pause.
- PostgreSQL tests: migrations, writer lock, rollback, import and restart persistence.
- Real GDevelop browser test: start/pause/jump, both patrol defeats, fuse/install/toggles, defusal, extraction, persisted unlock after real server restart, then fall failure/retry.
- Art validation: exact native sizes, nonempty RGBA frames, binary alpha and per-family palette limits. Runtime screenshots are inspected at game scale.

Still pending: tutorial and later levels, audio, full accessibility review, final art polish, production recovery for unfinished attempts and co-op balancing/replication rules.
