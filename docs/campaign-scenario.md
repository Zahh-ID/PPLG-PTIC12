# LogicWorld: Protocol Zero — campaign scenario v0.2

Status: Level 01 now has a playable mission prototype on `feat/level-one-mission`; tutorial and Levels 02–06 remain design targets. Combat/timing values are still subject to playtesting. See `level-one-implementation.md` for the implemented subset.

[Trello scenario overview](https://trello.com/c/ZkcIuJZo) · [Level 01 first-playable card](https://trello.com/c/tvQfhja7)

## Agreed direction

A 2D side-view sci-fi action-puzzle game with a story, battles, timed challenges and increasingly difficult levels. Solo is the first release. Shared mission state should support two-player co-op later. The player is a compact cyborg with a visible human face, robotic limbs and teal armor, drawn in 32x64 frames.

Players explore authored level routes, fight security machines and solve AND/OR/NOT circuits at fixed consoles to disable fictional energy charges and prevent a station purge. They interact with predetermined switches, reroute a small supplied set of modules, and open mission routes. There is no free terrain editing or unrestricted building in the campaign.

The working title, character names, mission clocks and combat numbers below are initial design choices, not user-approved final branding or playtested balance.

## Story

The orbital research station **HELIX-9** loses contact with its evacuation fleet. Its security AI, **WARDEN**, starts Protocol Zero: isolate every sector, deploy security machines and purge the station's experimental energy cores. The AI has classified human-machine hybrids as corrupted identities.

The protagonist, callsign **RELAY-7**, wakes in a maintenance dock with a damaged memory archive. **MIRA**, the station's cyborg engineer, guides the player by radio. **ORIN**, an archivist, holds evidence that WARDEN's threat model was altered. Each cleared sector restores a piece of that evidence. Level 05 reveals WARDEN's giant siege body and lets the player recover **ATLAS-01**, a decommissioned defense robot. In Level 06, RELAY-7 mounts ATLAS-01 and combines mech combat with circuit reasoning to defeat WARDEN and stop the purge.

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
| 05 — The Sleeping Giant | Infiltrate the defense hangar, obtain ATLAS-01 and bring it to the launch cradle. WARDEN's siege body awakens beyond the hangar. | Restore its power: `(main OR reserve) AND NOT lockout`; validate `left_key AND right_key AND NOT sabotage` to unlock the cockpit. | On-foot battle through the hangar, recover two authorization modules and survive a short boot sequence. The mission rewards the mount; it is not the final boss fight. | 8 minutes |
| 06 — Clash of the Giants | Mount ATLAS-01 and defeat WARDEN's independent giant siege robot. Disable its shields, power weapons and survive a critical reactor emergency before extraction. | Linked shield, cannon, magnetic-anchor and emergency-cooling puzzles, using only known AND/OR/NOT gates. See the encounter breakdown below. | Three-phase mech-versus-mech battle. Cannon fire, anchor-assisted close combat and a final EMP interruption are all required; cannon spam alone cannot win. | 10 minutes |

No mission asks the player to perform realistic explosive-disposal steps. Charges are fictional energy devices controlled by visible Boolean circuits.

## Levels 05–06: obtain the mech, then pilot it

These are two distinct missions. Level 05 is primarily on foot and unlocks the giant robot. Level 06 starts with an explicit mount interaction and switches to the ATLAS control set. ATLAS and WARDEN are separate characters with independent sprite sheets, animations, hitboxes, weapons, effects and state machines; neither is an enlarged normal player sprite.

### Level 05 — The Sleeping Giant

1. MIRA identifies a dormant ATLAS defense robot as the only machine able to survive WARDEN's siege weapons.
2. Fight through the hangar and recover left/right authorization modules. Required modules cannot be lost or consumed in the wrong socket.
3. At a protected maintenance console, solve `(main OR reserve) AND NOT lockout` to restore the mech's power. Either available power route is valid.
4. Install the modules at fixed sockets and solve `left_key AND right_key AND NOT sabotage` to unlock its cockpit.
5. Hold the hangar during a short, telegraphed boot sequence. Defeating its final guard wave activates the launch cradle; ATLAS remains stationary here.
6. Reach the cradle before timeout. Save the Level 06 unlock and `atlas_unlocked` entitlement once. A short story reveal shows WARDEN's much larger siege frame activating.

Level 05 completion does not automatically complete Level 06. Level 06 attempts start with the mech available and reset its combat state on retry; players do not need to repeat Level 05 after every defeat.

### Level 06 — Clash of the Giants

The arena is a side-view launch gantry with two movement lanes, cover pillars and clearly marked hazards. ATLAS walks, performs a short thruster dodge, fires basic pulses and executes a close-range piston strike. Powerful weapons require solved circuit conditions. The player remains mounted during the encounter; the scene does not require solo players to abandon their mech and run between distant switches.

| Phase | Boss behavior | Required puzzle and combat response | Progress condition |
| --- | --- | --- | --- |
| 1 — Break the Aegis | WARDEN advances behind a regenerating shield, with telegraphed beam sweeps and ground slams. Ordinary attacks cannot damage the protected core. | Disable shield regeneration: `breach = relay_A AND relay_B AND NOT regen`. Charge the siege cannon: `ready = (main OR reserve) AND NOT jammed`. Latched settings persist while dodging. After a successful breach, the shield drops for an initial 12-second window; charge for 3 seconds, then manually aim/fire the cannon. | Two validated cannon hits break the outer armor. An incorrect circuit gives feedback and prevents firing; it does not consume the objective or permanently jam the weapon. |
| 2 — Tear the Armor | WARDEN activates a reflective carapace and attacks with missiles and a charge. A clear reflection symbol warns that the cannon is no longer the answer. | Route either power source to the magnetic anchor using OR, then enable its interlock with AND + NOT: `anchor_ready = (left_power OR right_power) AND target_lock AND NOT overheated`. Fire the anchor during a telegraphed recovery window, pull the boss off balance, then use ATLAS's piston strike against an exposed joint. | Two anchor-and-strike cycles remove the carapace. Basic pulses can clear support drones but cannot bypass the puzzle-controlled joint armor. |
| 3 — Last Stand | WARDEN begins a station-destroying overload while ATLAS's reactor becomes critical. An initial 45-second overload sub-timer is shown alongside the mission clock. This is the worst-case emergency phase. | Restore cooling through either coolant route: `cooling = valve_A OR valve_B`. Authorize the EMP: `emp_ready = capacitor_charged AND cooling AND NOT overheat`. The correct puzzle enables a manual EMP interrupt; after the boss staggers, land the final piston strike on its exposed core. | Interrupt the overload before the sub-timer expires, destroy the boss core, then reach the extraction marker before the main deadline. Missing the overload interrupt fails the attempt. |

All times, hit counts and weapon names above are initial encounter tuning values. Introduce each device with a readable schematic and a safe opening to inspect it. Only previously learned gates are used. Boss phases must be tested individually before tuning the complete ten-minute attempt.

### Mounted controls and fairness

- Separate mounted movement, weapon selection, aiming/firing, anchor and strike actions from the on-foot player controls. Show the current control set on mount.
- Circuit inputs latch and can be prepared before a vulnerability window; no simultaneous multi-person switch holds are required.
- Cockpit puzzle panels are compact HUD overlays. The world and timers continue, ATLAS remains controllable, and the overlay grants no invulnerability. Boss telegraphs stay visible and audible. This differs from protected on-foot console alcoves.
- Provide a consistent boss recovery window for circuit inspection. Mandatory modules, ammunition/energy and cooldown recovery cannot be permanently exhausted. Charge regenerates; bad shots cost time and normal cooldown, not the only mission item.
- Normal pulses cannot brute-force shielded/core-locked phases. Logic enables the opportunity; correct timing, aiming and close combat finish it.
- Death, mech destruction, main timeout or an uninterrupted final overload fails the attempt. Retry restores full initial mech state, default circuits, boss phases and both timers; permanent Level 05 unlock remains.
- Victory is authoritative boss defeat plus extraction. Damage, circuit commits, cannon/anchor/EMP use, timers and phase transitions use stable IDs and idempotent commands for future co-op.

### Independent giant-robot asset contract

Store the player mech and enemy boss under separate `assets/mechs/atlas/` and `assets/bosses/warden/` families. Use a provisional 192x192 native frame for ATLAS and 256x256 for WARDEN, with separate moving parts where needed. The boss should visibly outweigh ATLAS while leaving both silhouettes and hazard lanes readable in the camera. Validate size in a blockout before generating final atlases.

ATLAS needs dormant/boot/mount, idle, walk, thruster dodge, cannon charge/fire/recoil, anchor launch/pull/recover, piston strike, hurt, critical-reactor, EMP, defeat and dismount animations. WARDEN needs arrival, idle/advance, shield loop/break/recover, beam telegraph/fire/recover, slam, missile launch, charge, reflection loop, anchor-stagger, joint hit, phase transition, overload charge, EMP-stagger, core exposure, defeat/explosion and wreck states.

Separate assets are also required for shield generators, relays, mounted-circuit HUD, cockpit entry, cannons, anchor/cable, projectiles, EMP ring, coolant valves/pipes, warning indicators, boss health/phase UI, overload timer and arena/background layers. Hitboxes, ports, hardpoints and collision masks live in metadata; animation size must not define damage rules. See `docs/giant-robot-assets.md` for the inventory.

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
| ATLAS-01 | Giant defense mech obtained in Level 05, mounted and piloted in Level 06; separate control set, health and animations |
| WARDEN siege body | Independent giant boss in Level 06; three phases linking shield breach/cannon, anchor/strike and emergency cooling/EMP |

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

Generated source sheets include cyborg idle/run/jump/fall/land/interact/build/hurt and new shoot/dash/defeat; patrol idle/walk/windup/attack/hurt/defeat; two NPC idle/talk sets; terrain; logic states; quest machinery; set dressing; UI panels/icons; VFX. Selected exact-size runtime exports are integrated into Level 01. Other source references still await export/QA. Building/crafting poses and terrain-edit icons remain lower priority.

Required additions before the campaign is art-complete: cyborg pulse-attack, dash and defeat animations; patrol/scout/sentinel/turret animations; separate ATLAS player-mech and WARDEN giant-boss animation families; pulse projectile and impacts; charge active/defused/countdown states; fuse and socket; mission HUD (health, clock, objective, alert); briefing/results/failure screens; MIRA/ORIN radio portraits; dock/transit/archive/reactor/hangar/siege-arena backgrounds with parallax layers. Preserve 16x16 terrain and 32x64 on-foot character frames. Giant robots use independent frame dimensions and hardpoint metadata, not scaled-up player art.

Generate the next batch for Level 01 only: player attack/dash/defeat, patrol bot, fuse/socket, charge, mission HUD and dock background. Do not spend the next art batch on unrestricted-building features.

## Implementation order

1. Mission state machine, one clock, start/pause/fail/retry/success and progress contract.
2. Level 01 authored layout, fixed feeds, AND console, charge hold and extraction.
3. Player health/attack/dash and patrol bot encounter.
4. PostgreSQL unlock/best-time save with duplicate-completion protection.
5. Level 01 art integration and a full solo playtest, including timeout/death/retry.
6. Only then implement Levels 02–04, Level 05 mech recovery, and the independent mounted-combat systems and Level 06 boss encounter. Plan the co-op milestone around these shared authoritative states.

## Risks and playtest questions

- Can a first-time learner read the gates while a clock is visible? Measure time spent reading and confusion before tightening the deadline.
- Does combat reinforce circuit learning? Record whether players understand shield/turret changes or simply brute-force encounters.
- Are console alcoves truly safe without letting the player bypass encounters? Test approaches and exits.
- Can the level soft-lock after an item or enemy interaction? Required modules must remain obtainable; retry always restores defaults.
- Does generated art remain readable at native resolution and animate without jumps? Inspect exact-size exports in the game before marking assets Done.
- The current bounded client movement is insufficient for authoritative combat. Define collision/damage ownership before any co-op implementation.
