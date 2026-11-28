# Circuit Rescue campaign

The game is now an eight-sector pixel-art station adventure. Open **Animal Hunter.json** (the filename is retained for existing tools); its display title is Circuit Rescue. Preview from `opening` or preview any sector directly in GDevelop.

## Bilingual introductions and completion flow

The default language is Indonesian. Choose English or Bahasa Indonesia through the language icon on opening/result screens, the pause menu, or an introduction. The browser remembers this preference. `localization.js` contains an explicit English-to-Indonesian catalog and dynamic-message rules. Native text and DOM challenge labels are translated without changing circuit values, object names, gate symbols, developer names or NIMs. New text should be added to this catalog. Locale initialization is the first event in every scene; `journey.js` runs last so translated text is ready before rendering.

Every sector starts with a paused introduction explaining its gate rule, what binary 0/1 mean, a worked example and the mission. The introduction covers all three terminal rules and examples for that sector, including combined gates and three-input problems.

All eight sectors can be selected from the route/level-list icon; there are no locks. Choosing a sector starts a fresh run at that sector. Finishing one records a local completion badge and opens a dialog with Next Level, Level List and Main Menu. The last sector uses View Ending. Browsing the list and choosing Back returns to the completion dialog. Main-menu Play resumes at the next sector after a completion. Run state is not persisted; language and completion badges are separate browser preferences. Blocked browser storage falls back to in-memory state.

## Sector progression

| Scene | Sector | Repair lesson | Unlock |
| --- | --- | --- | --- |
| `permainan` | 1 — Emergency Station | NOT prediction; AND repair; double-NOT build | Upper emergency airlock |
| `sector2` | 2 — Cargo Warehouse | AND prediction; OR repair; NAND build | Warehouse exit across stacked rooms |
| `sector3` | 3 — Transit Network | OR prediction; NOR repair; XOR build | Transit junction across gaps |
| `sector4` | 4 — Security Tower | XOR prediction; NOR repair; XOR build | Uplink reached by climbing |
| `sector5` | 5 — Underground Reactor | Three-input prediction; OR with inverted B repair; NAND-only AND build | Descending reactor interlock |
| `sector6` | 6 — Mecha Hangar | Three-input prediction; NAND repair; OR with inverted B build | Rideable mecha |
| `sector7` | 7 — Industrial Battlefield | Three-input prediction; XOR with inverted B repair; NOR build | Siege weapon, then guardian fight |
| `sector8` | 8 — Guardian Core | XOR followed by NOT build; inverted A AND B repair; A AND inverted B build | Three repairs, guardian and ending |

Each map contains three components and three separately named terminals, supplies, a checkpoint and an exit. Terminal 1 needs one component, terminal 2 needs two, and terminal 3 needs three. Each completion awards 150 score once. Components and repairs survive life loss and reset on sector replay. All three repairs are needed to open the airlock. Routes have no blocking gates. Climb marked rails with W/S or up/down; Space jumps off. Touch climb controls appear near rails. Rail hatches open during descent and close after the body clears. Boss and boarding conditions also apply. Parts use a count rather than a separate crafting inventory. The three materials in a sector use different artwork (fuses, wire coils, batteries, gears or energy cells) and occupy side lofts/bays. Mission targets are relays, fans, winches, scanners, valves, pumps, couplers and shield equipment rather than repeated computer terminals. Generated pixel-art PNGs share a visible floor baseline; unrepaired machines are dimmed until repaired. Crates, wall racks, supplies and checkpoint/exit artwork use explicit placement anchors.

Each location has its own generated background and world dimensions. Rooms have solid decks, door lintels, service lofts, native climbing rails. Primary shafts connect the three machinery rooms. Repair-powered return loops and separate material bays provide backtracking and alternate routes. The reactor descends through its rooms; the battlefield/core open into broad arenas with elevated gantries. The core has an explicit return shaft to its terminal rooms. The camera follows X and Y while HUD/background remain fixed. [Layout data](location-layouts.json) records room positions and route measurements. Run `npm run check:maps` for supported spawns, terminal IDs and conservative platform-route reachability; this structural check supplements runtime playtesting. `npm run test:routes` walks and jumps through every sector with native controls, checks all three parts and terminals, boards the level-6 mecha and reaches the final terminals. Combat is removed and puzzle results are supplied in this route-only test. Native jump speed is 850: held jumps rise approximately 168–174px at 20–60fps, leaving clearance above the 120px steps. All authored spawns start 12px above their floor so collision platforms register before landing.

## Dialog missions

Press **E** near a terminal after collecting its required components. Interaction checks vertical as well as horizontal distance. Logic challenges happen in a paused dialog; the map provides exploration, movement, combat and collection. Gates/cables are placed inside the dialog.

Levels 1–7 combine three challenge modes at different places: **predict** outputs by dragging 0/1 tokens into answer sockets; **repair** a prewired circuit with a wrong chip and missing connection; **build** a complete circuit. Levels 5–7 prediction quizzes each test all eight three-input combinations: `(A AND B) AND NOT C`, `(A OR B) AND NOT C`, and `(A XOR B) AND NOT C` respectively. Reactor construction allows only NAND chips and requires both sockets; tying the second NAND's inputs together produces AND. Guardian Core has three distinct circuit challenges in separate rooms, all completed before the guardian can be damaged.

The challenge dialog has three stages:

1. **Mission brief:** objective, lesson, recovered components and instructions. Start Challenge opens the board; Return to Adventure closes the dialog.
2. **Predict/build & test:** output cards or the circuit grid appear for the selected challenge. Hint provides progressive guidance. Tests, hints, answers, boards and undo histories are tracked separately per terminal. Mission Brief and closing/reopening preserve progress in the current scene.
3. **Repair complete:** after all input cases pass, Complete Repair grants 150 score once, activates the terminal and displays the unlocked objective with test/hint totals. The adventure remains paused until Return to Adventure or Escape.

Escape closes any stage. Tab/Shift+Tab stay within visible dialog buttons. Final guardian briefs and explanations follow each terminal's distinct combined-gate target. No new artwork is required; the shell reuses the existing chip and trophy icons.

The workbench uses explicit component ports. Place gates in the marked sockets, then drag from one port to another or tap the two ports. A connection can start at either end. Both gate inputs are on the left; the output is on the right. NOT and buffer expose one input. Cables route automatically; painting grid cells is no longer part of the interaction.

Each input accepts one source. Connecting a different output replaces its existing cable and can be undone. Outputs support fan-out: the NAND-only AND lesson connects the first NAND output to both inputs of the second NAND. Crossing cables remain independent; there are no accidental electrical junctions. Validation evaluates the actual directed port graph and detects missing connections and feedback cycles.

Select Trim and tap a cable or port to disconnect it. Right-clicking a cable also removes it. Keyboard users can focus ports and press Enter/Space to connect; Delete/Backspace disconnects a focused port or cable. Undo/redo and Clear preserve complete gate/link snapshots. Closing or changing stages cancels a pending connection and preserves completed edits. Escape cancels a pending cable before closing the dialog.

The truth table previews each input case. Passing every case enables Complete Repair. The same interactions work with desktop pointers and touch; direct and reverse gestures, fan-out, rewiring, trimming, undo and cancellation are browser-tested.

## Actor collision and animation

The small-robot resources now use `assets/circuit-rescue-v1/player-v3/`: 64 recreated frames in eight dedicated sheets (Idle, Run, Jump, Fall, Land, Shoot, Hurt, Death). The run cycle visibly moves the legs and arms; landing has its own sequence. All frames remain 128×128 with a common ground baseline at y112 and shared body mask (45,32)–(83,112). Muzzle effects render separately so they do not force the robot to shrink. Original player/ and corrected player-v2/ images are preserved for reference. The new source sheets and final generation/edit prompts are in player-v3/.

The live small-robot Idle action uses only the calm ready stance (`idle-03.png`), including menu portraits. The exaggerated crouch/head-tilt sequence is retained as source artwork but no longer plays. Moving, combat and mecha clips are unchanged.

Patrol robots (internally named `Crab` for compatibility) render at a consistent 96×96 in every sector. Every animation frame uses the same centered body mask (32,26)–(96,120) on its 128×128 source canvas, excluding transparent margins and the antenna. The symmetric mask stays aligned when mirrored. Their spawn feet align with the floor.

Player animation is selected once per frame in `gameplay.js` from the native Platformer movement state and combat state. The previous native SetAnimationName actions have been removed to prevent competing controllers. Locomotion takes priority while running or airborne, so firing does not freeze the legs in a standing shooting pose. A stationary robot plays Shoot; landing is canceled when moving or airborne. The normal robot Shoot action uses 16 fps so all eight frames fit its 0.52-second firing interval. Invulnerability uses steady translucency instead of rapid blinking. Run `npm run check:actors` after changing actor frames, masks or animation events.

## Mecha and guardian fights

In sector 6, repair all three hangar systems, approach the mecha and press **E** to board. The mecha replaces the player's visible animations and body collision mask while retaining native platformer movement. Boarding is required before leaving. Sectors 7–8 start mounted.

- **J / X:** cannon, unlimited mecha energy shots; normal robot ammunition remains finite.
- **K or the shield button:** in levels 7 and 8, tap for a brief shield or hold it to keep shielding; it can be activated repeatedly without waiting for energy. In level 6 the mecha retains its rechargeable three-second reserve.
- Mecha hull is 6 health. Each HUD heart represents two hull points. The normal robot has 3 health; each heart represents one.
- Three lives and checkpoints still apply. Boarding restores hull and supplies; checkpoints restore health. Checkpoints retain the floor height so returning in the larger mecha preserves body clearance.
- Bastion uses aimed missile salvos, physical rams and stomps. The Crimson Warden chooses sword sweeps, lunges, targeted leaps/slams and violet waves based on distance and elevated targets. Marked windups precede damage; attacks lock facing and target positions. The larger cannon deals 12 damage per hit in level 7, doubled during exposed recovery or EMP stagger. In level 8 each cannon hit deals 20 damage consistently, so the guardian is defeated by three confirmed hits. Exposed recovery does not inflict incidental contact damage.
- Sector 7 Bastion: 24 hull; complete all three systems to disable its shield. Sector 8 Crimson Warden: 60 hull. Complete all three terminals first to remove its shield; three ordinary cannon hits then defeat it. Combat freezes while solving.
- Defeat the guardian and reach the airlock. The final sector leads to `winner`.

## Detailed giant-robot art

The [current combat asset guide](../assets/circuit-rescue-v1/combat-v2/README.md) documents **36 actor actions plus four projectile types × 8 frames = 320 frames**. Mecha has Idle, Walk, Jump, Fall, Land, Shoot, Shield, Hurt and Death. Guardian has Idle, Walk, Windup, Shoot, Slam, Shield, Exposed, Hurt and Death. Walk is mapped to MechaRun and guardian Death to Defeated. Original high-detail sheets and generation prompts are retained. Sentries have Idle, Walk, Shoot, Hurt, Death and Melee; the final boss also has Slash, Jump and Dash. One common scale and anchor per actor preserves proportions across actions. Body masks exclude sword blades and muzzle effects. Frame counts, per-action unique hashes, transparency and visible content are checked during packaging; human art/animation review is still appropriate before release.

## Menus, replay and credits

Play continues the current sector in the running session, or the next sector after a completion. The separate replay icon on the opening menu begins a new campaign. R or replay during gameplay restarts the current sector, including its components, puzzle and combat. Home returns to opening. Active-run progress lives in GDevelop global variables and resets after closing the game. Browser storage retains language and completion badges; it does not save the run.

The supplied developer portraits, names, roles and NIMs are unchanged. Credits are available through menu/pause/result icons. The optional keycard, chest reveal and chest rewards have been removed from every level. Do not alter the supplied NIM lengths.

## Event sources and validation

- `src/events/campaign.js`: sector definitions, terminal and boarding controller, circuit model and workbench dialog; embedded in all eight sectors.
- `src/events/gameplay.js`: movement presentation, collection, health/lives, shooting, boss hit handling and sector transitions; embedded in all eight sectors.
- `src/events/combat.js`: guard perception/attacks, boss states, telegraphs, projectiles and interactive cover; embedded in all eight sectors.
- `src/events/ui.js`: menus, HUD, help, pause, results and credits; embedded in all eleven scenes.
- `src/events/localization.js`: Indonesian default, persistent language preference, catalog and text translation; first event in all eleven scenes.
- `src/events/journey.js`: concept introductions, unrestricted level selection and completion navigation; last event in all eleven scenes.

Run `npm run events:push -- --dry-run`, `npm run check`, and `npm run test:circuits`. Close GDevelop before pushing source edits, then reopen the project. The synchronization tool requires all shared copies to agree on pull. Original pre-campaign project backups are ignored under `.local/backups/campaign/`.

This is a playable first campaign pass. Audio, persistent saves, a full inventory/crafting interface and release balancing are not implemented.

## Final arena interactions

Sector 8 is 6000 × 2200. Its boss is 640 world units tall, compared with the 192-unit mecha. Elevated routes, a checkpoint and supplies support a longer fight. The camera widens in the arena and frames both combatants when close. Three cover pylons power up after the first repair. Charged pylons block hostile shots; E/mobile Interact discharges an EMP, clears nearby shots and staggers a nearby vulnerable boss. A pylon recharges over 16 seconds of unpaused game time. Combat pauses inside learning dialogs.

## Normal sentries and world authoring

Normal sentries have a 560-unit detection radius and a 440-unit horizontal firing range, editable on the Crab object's FireRange/DetectionRange variables. They aim before firing, shoot flat along their facing and do not track a target above/below their gun lane. Plasma expires after its configured distance. These sentries use ranged attacks; the retained Melee clip is not selected by the sentry controller. Bosses retain their distinct missiles, waves and melee attacks.

World layout and placement metadata is in `docs/location-layouts.json`. `scripts/rework-worlds.mjs` rebuilds generated room architecture and placements with `npm run world:rebuild`, after creating a recovery copy under `.local/backups/world-rework`. It preserves event sources, UI, portraits and actor art. Treat that command as an intentional layout reset; reconcile manual editor changes before rerunning it. Generated machinery PNGs and their source atlas are in `assets/circuit-rescue-v1/world-devices-pixel/`. The former SVG variants remain as archived sources.

Run `npm run check:placements`, `npm run check:frame-pixels`, `npm run test:world`, `npm run test:ports` and `npm run test:routes` for the added coverage. Full pixel-frame metrics and candidate border contacts are saved under `.local/reports`; appearance remains a developer review.

Mecha landing frames use compensated drawing origins and source collision coordinates to align their visible feet without changing the effective world body. `scripts/normalize-actor-anchors.mjs` derives these anchors from the pixel audit and keeps an ArtFoot point on each frame. `test:gameplay` verifies the native polygon and ArtFoot coordinate for all eight landing poses. Run-cycle frames that lift both feet retain that intended stride motion.

Generated ladder art is in `assets/circuit-rescue-v1/climb-v1/`; rear-facing robot frames derived from the original player reference are in `assets/circuit-rescue-v1/climb-v2/`. The climbing pose pauses while stationary; mecha holds its idle pose on rails. Elevators have been removed from all levels.
