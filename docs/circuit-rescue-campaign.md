# Circuit Rescue campaign

The game is now an eight-sector pixel-art station adventure. Open **Animal Hunter.json** (the filename is retained for existing tools); its display title is Circuit Rescue. Preview from `opening` or preview any sector directly in GDevelop.

## Bilingual introductions and completion flow

The default language is Indonesian. Choose English or Bahasa Indonesia through the language icon on opening/result screens, the pause menu, or an introduction. The browser remembers this preference. `localization.js` contains an explicit English-to-Indonesian catalog and dynamic-message rules. Native text and DOM challenge labels are translated without changing circuit values, object names, gate symbols, developer names or NIMs. New text should be added to this catalog. Locale initialization is the first event in every scene; `journey.js` runs last so translated text is ready before rendering.

Every sector starts with a paused introduction explaining its gate rule, what binary 0/1 mean, a worked example and the mission. NOT, AND, OR, XOR, NAND/NOR, NAND→NOT composition, NOR safety logic and the three final shield phases have distinct content.

All eight sectors can be selected from the route/level-list icon; there are no locks. Choosing a sector starts a fresh run at that sector. Finishing one records a local completion badge and opens a dialog with Next Level, Level List and Main Menu. The last sector uses View Ending. Browsing the list and choosing Back returns to the completion dialog. Main-menu Play resumes at the next sector after a completion. Run state is not persisted; language and completion badges are separate browser preferences. Blocked browser storage falls back to in-memory state.

## Sector progression

| Scene | Sector | Repair lesson | Unlock |
| --- | --- | --- | --- |
| `permainan` | 1 — Emergency Station | NOT prediction, repair, build | Upper emergency airlock |
| `sector2` | 2 — Cargo Warehouse | AND prediction, repair, build | Warehouse exit across stacked rooms |
| `sector3` | 3 — Transit Network | OR prediction, repair, build | Transit junction across gaps |
| `sector4` | 4 — Security Tower | XOR prediction, repair, build | Uplink reached by climbing |
| `sector5` | 5 — Underground Reactor | Three-input prediction; NOR repair; NAND-only AND build | Descending reactor interlock |
| `sector6` | 6 — Mecha Hangar | Three-input prediction; AND repair; NAND → NOT build | Rideable mecha |
| `sector7` | 7 — Industrial Battlefield | Three-input prediction; NOR repair/build | Siege weapon, then guardian fight |
| `sector8` | 8 — Guardian Core | XOR build, AND repair, NOR build in separate rooms | Three-phase guardian and ending |

Each map contains three components and three separately named terminals, supplies, a checkpoint, an optional keycard/credits chest and an exit. Terminal 1 needs one component, terminal 2 needs two, and terminal 3 needs three. Each completion awards 150 score once. Components and repairs survive life loss and reset on sector replay. The first system activates a native moving lift; the second deactivates the exit barrier; all three are needed to power the airlock. Boss and boarding conditions also apply. Parts use a count rather than a separate crafting inventory.

Each location has its own generated background and world dimensions. Rooms are connected by native one-way platform routes, with vertical climbing, descending reactor rooms, warehouse backtracking and battlefield gaps. The camera follows X and Y while HUD/background remain fixed. [Layout data](location-layouts.json) records room positions and route measurements. Run `npm run check:maps` for supported spawns, terminal IDs and conservative platform-route reachability; this structural check supplements runtime playtesting.

## Dialog missions

Press **E** near a terminal after collecting its required components. Interaction checks vertical as well as horizontal distance. Logic challenges happen in a paused dialog; the map provides exploration, movement, combat and collection. Gates/cables are placed inside the dialog.

Levels 1–7 combine three challenge modes at different places: **predict** outputs by dragging 0/1 tokens into answer sockets; **repair** a prewired circuit with a wrong chip and missing connection; **build** a complete circuit. Levels 5–7 prediction quizzes test all eight combinations of `Y = A AND B AND NOT C`. Reactor construction allows only NAND chips and requires both sockets; tying the second NAND's inputs together produces AND. The hangar uses NAND followed by NOT. Guardian Core instead has three phase-specific circuit challenges in separate rooms.

The challenge dialog has three stages:

1. **Mission brief:** objective, lesson, recovered components and instructions. Start Challenge opens the board; Return to Adventure closes the dialog.
2. **Predict/build & test:** output cards or the circuit grid appear for the selected challenge. Hint provides progressive guidance. Tests, hints, answers, boards and undo histories are tracked separately per terminal. Mission Brief and closing/reopening preserve progress in the current scene.
3. **Repair complete:** after all input cases pass, Complete Repair grants 150 score once, activates the terminal and displays the unlocked objective with test/hint totals. The adventure remains paused until Return to Adventure or Escape.

Escape closes any stage. Tab/Shift+Tab stay within visible dialog buttons. Boss-phase briefs and explanations follow the current XOR/AND/NOR target. No new artwork is required; the shell reuses the existing chip and trophy icons.

The workbench is a 10×7 grid. Drag a tool onto a cell, or select a tool and click cells. Gates go in marked sockets. Wires occupy ordinary empty cells. Right-click or use Erase to remove a piece. Clear board resets the puzzle. Closing the dialog preserves the current board for that sector and restores focus to the game canvas.

Gate **input 1 enters from the left**, **input 2 enters from below**, and **output leaves to the right**. NOT and buffer use only the left input. Source A/B cells emit from the right; Y receives from the left. Gates are directional. Cables connect in all four cardinal directions; junctions join all arms electrically. Separate the A, B and output networks to prevent short circuits.

The wire graphic is chosen from a four-bit mask: up=1, right=2, down=4, left=8. Every board edit refreshes the connection shapes. Signal evaluation follows the actual wire networks and gate ports, detects missing connections, multiple drivers and feedback loops, and calculates output values. This is not a gate-name-only answer check.

The workbench reuses the generated metal dialog, board and inventory-tray frames, blank button states, socket artwork and completion badge. Transparent margins are trimmed into three derived frame PNGs; original artwork remains intact. Gate sockets show gold inputs and a cyan output.

### Wire editing

- Select **WIRE** or press **W**, then drag to extend a cable. Fast pointer movement fills intermediate cells; corners and junctions update automatically.
- Select **TRIM** or press **E**, then drag to shorten/remove cables. Right-drag trims without changing the selected tool. Trimming protects gates, sources and output nodes.
- One drag is one undo step. Use **Undo / Ctrl+Z** and **Redo / Ctrl+Y / Ctrl+Shift+Z**. Clear Board is also undoable. The last 50 undo states are retained for the current board, including when closing/reopening the dialog.
- Drag gate tools into sockets, or select a gate and click its socket. Dragging displays a ghost and highlights its target.
- Focus a cell and use arrow keys to navigate. Delete/Backspace removes the focused gate or cable; fixed sources/output remain protected.
- Click an A/B source with Wire selected, or use the A/B controls, to inspect the live signal.

The 10×7 board uses exact 44-pixel cells. Small screens stack the panels and allow horizontal board scrolling; touch-specific usability still needs device testing.

**Test circuit** evaluates every input combination and shows expected versus actual Y. A/B controls let the learner inspect powered wires in one case. **Complete repair** appears only after all cases pass. Any edit invalidates the previous result. Wrong answers do not consume components or lives. The sixth-sector puzzle requires both sockets, with NAND and NOT providing the intended solution.

The workbench uses HTML/CSS/DOM in a GDevelop JavaScript event so it can handle drag/drop, selectable tools, a grid, truth tables and accessible buttons. Native Platformer/Platform behaviors still handle map movement/collision. HTML5/browser and desktop previews are the current target. The responsive dialog can shrink on smaller screens, but phone/touch interaction has not been validated.

## Actor collision and animation

The small-robot resources now use `assets/circuit-rescue-v1/player-v3/`: 64 recreated frames in eight dedicated sheets (Idle, Run, Jump, Fall, Land, Shoot, Hurt, Death). The run cycle visibly moves the legs and arms; landing has its own sequence. All frames remain 128×128 with a common ground baseline at y112 and shared body mask (45,32)–(83,112). Muzzle effects render separately so they do not force the robot to shrink. Original player/ and corrected player-v2/ images are preserved for reference. The new source sheets and final generation/edit prompts are in player-v3/.

The live small-robot Idle action uses only the calm ready stance (`idle-03.png`), including menu portraits. The exaggerated crouch/head-tilt sequence is retained as source artwork but no longer plays. Moving, combat and mecha clips are unchanged.

Patrol robots (internally named `Crab` for compatibility) render at 72×72. Every animation frame uses the same centered body mask (32,26)–(96,120) on its 128×128 source canvas, excluding transparent margins and the antenna. The symmetric mask stays aligned when mirrored. Their spawn feet align with the floor.

Player animation is selected once per frame in `gameplay.js` from the native Platformer movement state and combat state. The previous native SetAnimationName actions have been removed to prevent competing controllers. Landing is canceled when moving or airborne; continuous fire does not briefly return to Idle between shots. The normal robot Shoot action uses 16 fps so all eight frames fit its 0.52-second firing interval. Invulnerability uses steady translucency instead of rapid blinking. Run `npm run check:actors` after changing actor frames, masks or animation events.

## Mecha and guardian fights

In sector 6, repair all three hangar systems, approach the mecha and press **E** to board. The mecha replaces the player's visible animations and body collision mask while retaining native platformer movement. Boarding is required before leaving. Sectors 7–8 start mounted.

- **J / X:** cannon, unlimited mecha energy shots; normal robot ammunition remains finite.
- **K:** shield with a three-second reserve; releasing K regenerates it at 0.4 seconds per second.
- Mecha hull is 6 health. Each HUD heart represents two hull points. The normal robot has 3 health; each heart represents one.
- Three lives and checkpoints still apply. Boarding restores hull and supplies; checkpoints restore health.
- Bastion uses aimed missile salvos, physical rams and stomps. The Crimson Warden chooses sword sweeps, lunges, targeted leaps/slams and violet waves based on distance and elevated targets. Marked windups precede damage; attacks lock facing and target positions. Exposed recovery and EMP stagger windows take double cannon damage.
- Sector 7 Bastion: 24 hull; complete all three systems to disable its shield. Sector 8 Crimson Warden: 60 hull, three phases. Its shield returns at 40 and 20 hull. Visit the separate Core Stabilizer and Final Shield terminals for the AND repair and NOR build. Future phase terminals stay locked until needed. Combat freezes while solving.
- Defeat the guardian and reach the airlock. The final sector leads to `winner`.

## Detailed giant-robot art

The [current combat asset guide](../assets/circuit-rescue-v1/combat-v2/README.md) documents **36 actor actions plus four projectile types × 8 frames = 320 frames**. Mecha has Idle, Walk, Jump, Fall, Land, Shoot, Shield, Hurt and Death. Guardian has Idle, Walk, Windup, Shoot, Slam, Shield, Exposed, Hurt and Death. Walk is mapped to MechaRun and guardian Death to Defeated. Original high-detail sheets and generation prompts are retained. Sentries have Idle, Walk, Shoot, Hurt, Death and Melee; the final boss also has Slash, Jump and Dash. One common scale and anchor per actor preserves proportions across actions. Body masks exclude sword blades and muzzle effects. Frame counts, per-action unique hashes, transparency and visible content are checked during packaging; human art/animation review is still appropriate before release.

## Menus, replay and credits

Play continues the current sector in the running session, or the next sector after a completion. The separate replay icon on the opening menu begins a new campaign. R or replay during gameplay restarts the current sector, including its components, puzzle and combat. Home returns to opening. Active-run progress lives in GDevelop global variables and resets after closing the game. Browser storage retains language and completion badges; it does not save the run.

The supplied developer portraits, names, roles and NIMs are unchanged. Collect the optional keycard and open the chest to see its reveal followed by credits. Credits are also available through menu/pause/result icons. Do not alter the supplied NIM lengths.

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

Sector 8 is 6000 × 2200. Its boss is 640 world units tall, compared with the 192-unit mecha. Elevated routes, a checkpoint and supplies support a longer fight. The camera widens in the arena and frames both combatants when close. Three cover pylons power up after the first repair. Charged pylons block hostile shots; E/mobile Interact discharges an EMP, clears nearby shots, refills shield energy and staggers a nearby vulnerable boss. A pylon recharges over 16 seconds of unpaused game time. Boss missiles/waves clear when its shield returns, and combat pauses inside learning dialogs.
