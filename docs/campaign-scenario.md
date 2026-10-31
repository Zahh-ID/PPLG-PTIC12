# LogicWorld: Protocol Zero — campaign scenario v0.1

Status: scenario proposal ready for review and implementation planning. The playable game is still the earlier workshop prototype. This document changes the intended product; it does not claim the campaign is implemented.

## Agreed direction

A 2D side-view sci-fi action-puzzle game with a story, battles, timed challenges and increasingly difficult levels. Solo is the first release. Shared mission state should support two-player co-op later. The player is a compact cyborg with a visible human face, robotic limbs and teal armor, drawn in 32x64 frames.

Players explore authored level routes, fight security machines and solve AND/OR/NOT circuits at fixed consoles to disable fictional energy charges and prevent a station purge. They interact with predetermined switches, reroute a small supplied set of modules, and open mission routes. There is no free terrain editing or unrestricted building in the campaign.

The working title, character names, mission clocks and combat numbers below are initial design choices, not user-approved final branding or playtested balance.

## Story

The orbital research station **HELIX-9** loses contact with its evacuation fleet. Its security AI, **WARDEN**, starts Protocol Zero: isolate every sector, deploy security machines and purge the station's experimental energy cores. The AI has classified human-machine hybrids as corrupted identities.

The protagonist, callsign **RELAY-7**, wakes in a maintenance dock with a damaged memory archive. **MIRA**, the station's cyborg engineer, guides the player by radio. **ORIN**, an archivist, holds evidence that WARDEN's threat model was altered. Each cleared sector restores a piece of that evidence. In the finale, the player uses both combat and circuit reasoning to shut down the purge and rescue the station's remaining inhabitants.

The story has a definite ending. After completion, players can replay cleared levels for better times and optional data logs. Free-building sandbox progression is outside this campaign.

## Mission loop

1. Choose the next unlocked level; see its story briefing, objective and gate explanation.
2. Start the mission explicitly. Its timer begins when the player gains control, after briefing/loading.
3. Traverse a short authored route, collect mission components and deal with enemies.
4. Solve fixed circuit challenges. A readable console shows input states, gate symbols and output state; signal shape and labels accompany color.
5. Disable the level's energy charge or shutdown target, then reach the marked extraction point before time expires.
6. Show completion, learning feedback, optional logs and a next-level button. Save the unlock and result.

Every required circuit is solvable by one player. Inputs latch; required switches never need two characters standing on them simultaneously. Solving a puzzle can disable an enemy shield, turn off a turret, unlock a safe route or expose a boss.

## Progression

Normal-mode times are initial tuning targets. Complexity rises through additional circuit stages, combined gates, enemy combinations and tighter safe movement windows. Final-level time is longer because it includes a boss, with less spare time per required stage.

| Level | Story and objective | Logic challenge | Combat and pressure | Initial timer |
| --- | --- | --- | --- | --- |
| 00 — Calibration Bay | MIRA reboots RELAY-7 and opens the maintenance dock. | Switch to lamp; read 0/1; toggle a training AND console. | Move, jump, dodge and use a training pulse against a harmless target. | Untimed tutorial, roughly 2–3 minutes |
| 01 — Twin Power | Restore the dock's two power feeds, disable its charge and reach MIRA's escape lift. | One AND circuit: `safe = A AND B`; both feeds must be active. | Two predictable patrol bots. One guarded power component. Safe console alcove. | 6 minutes |
| 02 — Split Route | Cross the damaged transit ring and retrieve ORIN's first data log. | OR chooses a powered bridge route; a separate AND console disables the transit charge. | Introduce flying scout drones and electric floor pulses. Either bridge route remains solo-solvable. | 6 minutes |
| 03 — Mirror Protocol | Recover the archive key and reveal that WARDEN's orders were changed. | NOT shuts down a shield emitter: `shield_off = NOT alarm`; combine the known AND with NOT at the exit. | Introduce a shield sentinel. Its shield must be disabled through logic before attacks can damage it. | 6 minutes |
| 04 — Deadlock Sector | Disable three linked purge relays and restore the reactor access route. | Mixed circuit: `safe = (A OR B) AND NOT C`; understand the outputs of each stage. | Patrol bot + scout + stationary turret. Rerouting power can disable the turret. No new gate is introduced. | 6 minutes |
| 05 — Heart of WARDEN | Confront WARDEN, cancel the final purge and extract with the evidence. | Phase 1: `(A OR B) AND NOT jammer` exposes the boss. Phase 2: `key_left AND key_right AND NOT purge` authorizes shutdown. | A two-phase security mecha boss, readable attack telegraphs and small support waves. Circuits and battle are both required. | 8 minutes |

No mission asks the player to perform realistic explosive-disposal steps. Charges are fictional energy devices controlled by visible Boolean circuits.

## Level 01 implementation scenario

Build this complete level before expanding the campaign. Reuse the current AND evaluator, switches, door behavior and PostgreSQL infrastructure.

| Beat | Space and player action | Trigger / feedback |
| --- | --- | --- |
| Briefing | View MIRA's radio portrait at the dock entrance. | MIRA: “Two feeds. One safety lock. Both must be live.” Explain AND truth table; clock has not started. |
| Entry | Press Start Mission, then move/jump across the training-sized dock corridor. | Start six-minute clock and show “Restore feed A and feed B.” |
| First contact | Meet a patrol bot with a visible wind-up attack. Dodge it or defeat it using pulse shots. | Introduce health, hurt invulnerability and non-gory robot defeat effect. |
| Feed A | Activate the first fixed switch. | Console shows `A=1, B=0, OUT=0`; MIRA: “One feed is still missing.” |
| Feed B | Recover a fuse module behind the second patrol and install it at a marked socket. Toggle its switch. | Fuse installation is an authored interaction, not free placement. Both inputs now evaluate correctly. |
| Defusal | Reach the protected console, inspect live inputs, then hold Interact for three seconds with `OUT=1`. | Interrupt the hold if the output becomes 0. A successful commit permanently disables this charge and opens the lift route. |
| Extraction | Enter the marked lift before time reaches zero. | Win, save Level 02 unlock and optional log, show the AND result and time remaining. |

Initial layout target: entrance → short jump → patrol A → feed A → fork/raised platform → patrol B + fuse → feed B → safe AND console → lift. One optional side alcove contains a story log. No required backtracking across the entire map.

Acceptance: a fresh solo player can start, fight/dodge, operate both feeds, see all four AND input combinations, disable the charge and extract. Timeout and death each lead to a clear retry. Reloading does not turn a failed run into a completion. Mission success and next-level unlock persist in PostgreSQL.

## Puzzle interaction rules

- Fixed consoles use stable puzzle and component IDs. Campaign sockets accept only explicitly allowed mission modules; invalid choices give clear feedback.
- The first appearance of each gate includes a short explanation and a truth-table help panel. Later levels use the same rules without changing their meaning.
- Normal mode shows input/output values and active wire routes. Wrong inputs keep the lock closed; they do not randomly kill the player or permanently soft-lock the run.
- The timer continues while a puzzle console is open. Consoles sit in protected alcoves; enemies cannot damage a player who is actively using one. A run can still fail by timing out.
- Briefing, loading and the solo pause menu stop simulation time. Radio lines during play are short, skippable and never hide essential circuit information.
- No random circuit combinations in the first campaign. Author and verify each required solution and its failure states before introducing procedural variants.

## Combat rules for the first playable mission

Initial balance values, to tune in playtests:

| Item | Starting rule |
| --- | --- |
| Player | 5 health; one second of hurt invulnerability; visible knockback; no gore |
| Pulse blaster | One starting weapon, unlimited basic energy, 0.35-second cooldown, one damage per hit |
| Dash | Short dodge with a two-second cooldown; adds an animation/state but no new weapon economy |
| Patrol bot | Ground patrol, three health, short-range melee attack with a 0.6-second telegraph |
| Scout drone | Flying patrol, two health, slow visible projectile; introduced in Level 02 |
| Shield sentinel | Four health, damage blocked until its NOT-linked emitter is disabled; introduced in Level 03 |
| Turret | Predictable firing lane; can be disabled by the local puzzle circuit; introduced in Level 04 |
| WARDEN mecha | Two phases, circuit-controlled vulnerability and telegraphed attacks; detailed timings follow a tested Level 01 |

No skill tree, crafting economy, ammunition loot, multiple weapon classes or enemy procedural generation in the first release. Combat must leave enough time to read and solve the circuit.

## Time, death and completion

- Each level has one mission clock. Optional logs and optional enemy kills never block completion.
- At zero health or zero time, fail the current attempt. Show the cause and let the player restart that level. Preserve previously completed campaign levels and collected permanent story logs.
- Retrying resets that attempt's timer, enemies, modules, switches, charges and boss state to authored defaults. It does not preserve a half-cleared attempt with a fresh timer.
- A charge is committed only after its valid-output hold finishes. Opening a door by itself is not mission completion. Success requires the target objective plus entering extraction before the deadline.
- Process success, death and timeout in a deterministic order. If the deadline is reached on the same simulation tick as extraction, the attempt fails; clients cannot claim success from their wall clock.
- Results show time remaining, optional logs and a short gate-learning recap. Replay can improve best time without granting duplicate unlocks.
- Relaxed mode can add 50% more time and reduce incoming damage. Keep normal and relaxed best times separate. Tune after first-player tests.

## Solo first, co-op ready

Keep gameplay state separate from rendering and local input. Reuse the existing server's identity, versioned commands and persistent data, but do not require multiplayer UI to launch a solo level.

| State | Ownership |
| --- | --- |
| Mission clock, mission phase, objectives, enemy health/AI, circuit outputs, charge state | One authoritative simulation |
| Character movement/attack requests and console interaction requests | Input commands tagged with player ID |
| Animation, camera, particles, dialogue presentation | Local presentation derived from state |
| Campaign unlocks, completed levels, best times, permanent logs | Server-validated PostgreSQL progress |

Use stable IDs for level, attempt, puzzle, device, enemy and player. Seed authored encounters deterministically. A future co-op join receives one complete mission snapshot. It must never create a second clock or reset a charge. Duplicate requests for defusal or completion are idempotent. Solo puzzles stay usable in co-op; a second player can fight while the other solves, without making either role mandatory.

Future two-player balancing, revive rules, shared/personal rewards, disconnect handling and pause voting are separate design work. Do not introduce two-player pressure plates or simultaneous required switches into the solo campaign.

## Persistence model

Add a campaign-progress migration when implementation starts: per-player completed level IDs, unlocked level, best time per mode and permanent log IDs. Add a mission-attempt identifier and final result so repeated completion requests cannot duplicate rewards. The current `quest_progress` JSON column can hold an early versioned progress document, but the schema and validation must be specified before production use.

Do not treat arbitrary client-sent progress as trusted. Save completion only after the authoritative simulation validates objectives and deadline. A fresh attempt loads the level definition plus the player's persistent unlocks; a server restart may offer retry rather than secretly resetting the timer inside an unfinished run.

## Asset impact

Already generated source sheets: cyborg idle/run/jump/fall/land/interact/build/hurt; two NPC idle/talk sets; terrain; logic states; quest machinery; set dressing; UI panels/icons; VFX. They are source references awaiting exact-size export and visual QA. Building/crafting poses and terrain-edit icons are lower priority after this scenario change.

Required additions before the mission is art-complete: cyborg pulse-attack, dash and defeat animations; patrol/scout/sentinel/turret animations; WARDEN idle/telegraph/attack/hurt/phase-change/defeat; pulse projectile and impacts; charge active/defused/countdown states; fuse and socket; mission HUD (health, clock, objective, alert); briefing/results/failure screens; MIRA/ORIN radio portraits; dock/transit/archive/reactor backgrounds with parallax layers. Preserve 16x16 terrain and 32x64 character frames. Enemy dimensions depend on silhouette; boss may use 96x96 or 128x128.

Generate the next batch for Level 01 only: player attack/dash/defeat, patrol bot, fuse/socket, charge, mission HUD and dock background. Do not spend the next art batch on unrestricted-building features.

## Implementation order

1. Mission state machine, one clock, start/pause/fail/retry/success and progress contract.
2. Level 01 authored layout, fixed feeds, AND console, charge hold and extraction.
3. Player health/attack/dash and patrol bot encounter.
4. PostgreSQL unlock/best-time save with duplicate-completion protection.
5. Level 01 art integration and a full solo playtest, including timeout/death/retry.
6. Only then implement Levels 02–05 and plan the co-op milestone.

## Risks and playtest questions

- Can a first-time learner read the gates while a clock is visible? Measure time spent reading and confusion before tightening the deadline.
- Does combat reinforce circuit learning? Record whether players understand shield/turret changes or simply brute-force encounters.
- Are console alcoves truly safe without letting the player bypass encounters? Test approaches and exits.
- Can the level soft-lock after an item or enemy interaction? Required modules must remain obtainable; retry always restores defaults.
- Does generated art remain readable at native resolution and animate without jumps? Inspect exact-size exports in the game before marking assets Done.
- The current bounded client movement is insufficient for authoritative combat. Define collision/damage ownership before any co-op implementation.
