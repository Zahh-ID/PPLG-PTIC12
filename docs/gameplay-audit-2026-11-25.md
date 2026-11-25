> Historical report: elevators and blocking route gates were removed after this audit.

# Gameplay repair pass — 25 November 2026

This pass fixes reproducible behavior and collision problems. Appearance and human difficulty acceptance remain with the developer; no game screenshots were visually reviewed.

## Changes

| Problem | Result |
| --- | --- |
| Firing continuously replaces running and jumping with a stationary shooting pose | Native locomotion selects Run/Jump/Fall while moving; stationary fire retains Shoot. All eight running frames advance while firing. Shield and damage poses retain priority. |
| A player shot checks enemies before walls, and fast shots skip thin geometry | Both projectile controllers check native collision masks along movement in steps of at most 6px. Terrain blocks a shot before a target at the same step. Player shots also check the muzzle position. |
| A stunned guard resumes an expired attack | Taking a hit cancels its committed attack and enters recovery. A later attack must aim/wind up again. |
| Standing near an exposed boss still causes contact damage | Incidental contact damage applies during pursuit; exposed recovery and stagger remain opportunities to attack. Active attacks still use their attack hitboxes. |
| Boarding in level 6 invalidates the old checkpoint height | Checkpoints retain the floor height. Respawning subtracts the current robot's foot offset, keeping the mecha out of the floor. |
| Shots survive player death and remain in the next life | Player and hostile projectiles are cleared at death/respawn. |
| The wider mecha exceeds the world boundary | Horizontal limits use the current collision body's left/right offsets. |
| 120px route steps nearly equal the maximum jump | Native jump speed increases from 700 to 850. A held jump measured about 123px before; it now measures 168px at 20fps, 168px at 30fps and 174px at 60fps. Gravity, movement acceleration and native collision behaviors remain in use. |
| Level 5 falls through its one-way spawn floor before the introduction | The authored spawn begins 12px above the platform, allowing native platform registration before landing. The route test verifies the player lands near the authored spawn with all lives. |
| Developer chest interrupts exploration in every level | All eight chests and keycard pickups, their reward/reveal logic, key HUD indicator and decorative menu chest are removed. Developer portraits, names and NIMs remain accessible through opening/pause/result menus. |

## Verification

- `npm test`: project/event syntax, 102 circuit cases across 24 challenges, localization, actor masks, combat asset integrity, maps, workflows and SVG UI.
- `npm run check:animations`: 670 object/action/direction definitions across 11 scenes, using 428 referenced image files. No empty clips, invalid timing, missing files, changing canvas dimensions or duplicated frames within animated clips. The stable small-robot idle remains a single deliberate pose.
- `npm run test:gameplay`: native-runtime regressions for chest removal, jump reach at 20/30/60fps, firing locomotion, projectile obstruction, guard interruption, mecha checkpoint respawn, death cleanup, exposed boss contact and world bounds.
- `npm run test:routes`: all eight sectors collect their three parts and reach all three terminals and the airlock using native movement. No player teleport, velocity injection or flying. The test supplies puzzle results and removes guards to isolate traversal; it boards the mecha with Interact in level 6 and returns from the final arena to both later-phase terminals and back. It handles tiled/overlapping floors as continuous walking surfaces. Fixed native 60fps steps make the checks reproducible.
- `npm run test:combat-browser`: guard detection/aim/cover/death, distinct projectiles, simultaneous-hit limits, mecha shield, both guardians, telegraphs, melee/leaps/waves, recovery damage, shield phases and EMP cover.
- Modal, journey and mobile suites verify the existing UI transitions, credits return path, introductions, level selection and touch controls after these changes.

The GDevelop MCP validator reports no project errors. Its static catalog does not list the embedded `AdvancedJump` behavior; the extension is present in the project and runs in the exported native-runtime checks.

Final local results: static checks/build and source synchronization passed; 10 gameplay regressions, all 8 route traversals, 22 combat checks, 20 modal checks, 11 journey checks and 14 mobile-control checks passed. The campaign browser suite completed all 24 terminal challenges, boarded the mecha, defeated both controlled-health guardians and reached the winner scene without runtime errors or missing local assets.

## Scope and review

No new artwork was needed for the reproduced defects. Existing detailed robot actions retain their eight frames and fixed masks. Structural/frame checks do not establish artistic smoothness. The campaign browser suite uses controlled positions and guardian health to exercise all puzzles and transitions; the route suite separately covers actual movement. Neither replaces an uninterrupted human playthrough or physical-device review.

The web build is local. This pass does not merge, publish, or update Trello. CI and the manually dispatched Pages build run the new gameplay and route regressions before packaging.
