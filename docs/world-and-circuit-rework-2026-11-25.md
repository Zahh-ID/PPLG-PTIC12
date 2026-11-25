> Historical report: elevators and blocking route gates were removed after this audit. Current controls and layout are described in the campaign guide.

# Rooms, machinery and circuit ports — 25 November 2026

This pass changes the adventure layout and circuit interaction together. Existing modal motion, dark UI, language preference, credits and eight-level progression are retained. Work stays local; no Trello, merge or deployment action is part of this pass.

## Adventure spaces and consistent placement

- All 24 system locations are machinery rooms with solid decks, door lintels, wall-mounted equipment and service lofts. Climbing shafts replace diagonal staircase chains. The reactor descends through its rooms; the guardian arenas have elevated gantries. The final arena has a dedicated return shaft for its later phase rooms.
- First repairs power an elevator and return-route gates. Climbing rails remain available without a completed puzzle. Elevator decks are native Jumpthru platforms with a configured travel speed and dwell at both stops. Rail hatches open during descent and close once the player's body clears. W/S or up/down climbs, Space jumps off, and nearby touch controls provide up/down. Native movement gently centers a robot on its rail while allowing manual exits.
- Mecha sectors use taller material lofts with their own service rails, providing clearance for the larger robot. Roof surfaces are also walkable. Shaft openings account for body width and headroom, including lintels and gantry intersections.
- Mission targets use relays, fans, winches, scanners, levers, pumps, valves, reactors, couplers, shield pylons and weapon equipment. Twenty-four compact SVG state assets share a visible floor baseline. Repeated monitor props and processor-only pickups are replaced with floor crates, wall racks and a mix of fuses, coils, batteries, gears and energy cells.
- Device scales, floor props, wall mounts, supplies, exits and checkpoints have explicit anchors. Parked and mounted mecha use the same scale; normal guards use 96×96 throughout. Charged arena cover uses shield machinery with a common body mask rather than a stretched computer graphic. The airlock visibly opens when its conditions are met.
- Layout metadata and regeneration instructions are in the campaign guide. `world:rebuild` is an intentional reset of generated room geometry and placement, with a recovery copy made first.

## Circuit interaction

Both gate inputs are on the left, with the output on the right. Drag between ports or tap them in either order. Curved cables route automatically; individual wire cells no longer need to be painted. Rewiring an input replaces its old connection, outputs support fan-out, and crossing cables stay independent. Trim, right-click, keyboard deletion, complete undo/redo snapshots and Escape cancellation are supported.

The evaluator follows explicit directed port links. It checks actual gate values and rejects missing connections, duplicate input drivers and feedback loops. All 24 lessons retain their gate restrictions and truth-table targets, including NAND-only AND and the composed mecha startup circuit. Repair challenges begin with a wrong gate and a missing connection.

## Enemy and runtime corrections

Normal sentries detect within 560 world units, aim before shooting, and fire horizontally within 440 units. The gun lane must intersect the player's body to acquire an aim; the released shot retains its heading and expires at its configured travel distance. Walls block detection and projectiles. Their controller no longer selects melee weapon attacks; bosses retain their separate missiles, waves, sword attacks and leaps.

Projectile and actor cleanup now iterates snapshots of GDevelop's live object lists. Deleting from a live list previously skipped subsequent objects, affecting projectile movement, transient effects, death cleanup and phase clearing. Player death clears every player/hostile shot. Supplies restore normal ammunition or mecha shield energy as appropriate.

## Frame-by-frame audit

The pixel audit covers **345 unique PNG frames, 47 distinct actor clips and 2,090 scene frame references**. It records every frame's dimensions, alpha bounds, visible area, centroid, connected components, edge contacts, origin and collision mask, plus adjacent-frame measurements. No empty/opaque-matte frames or mixed canvases were found. The audit identified a landing-anchor mismatch: the mecha feet ended 15–35 source pixels above the intended ground baseline. Its eight landing frames now use compensated native drawing origins and source masks, keeping the rendered ArtFoot point and effective world collision body fixed. PNG pixels and all eight poses remain intact. The native-runtime regression checks every landing frame’s actual body polygon and ArtFoot coordinate. Every detailed robot action retains its eight distinct frames. The deliberately calm small-player idle stays a single pose.

Seven guard frames have pixels at a canvas edge:

| Action | Frames | Observation |
| --- | --- | --- |
| Shoot | 3–6 | 2–3 edge pixels per frame; frame 6 contacts only through detached pixels |
| Death | 5–6 | 7 detached edge pixels in frame 5; 12 main-component edge pixels in frame 6 |
| Melee, retained source clip | 5 | 4 edge pixels |

These are review candidates, not proof that a limb is missing. Numeric checks cannot decide whether a border contact is intended muzzle/debris art or a visible crop. No game screenshots were visually reviewed. The per-frame JSON is generated by `npm run check:frame-pixels` at `.local/reports/actor-frame-audit.json`; original art is preserved.

## Validation commands

`npm test` checks project structure, all 102 circuit cases, localization, actors, every animation definition, per-frame pixels, placement/shaft clearance, asset integrity, maps, workflows and SVG UI. After `build:web`, `test:world` exercises native elevator behavior and sentry firing/range; `test:ports` exercises desktop/touch connections; `test:routes` traverses the sectors with native controls. Route checks remove combat and supply puzzle results to isolate access; the campaign and combat suites separately cover actual puzzle UI and guardian states. These automated checks supplement the developer's visual and physical-device review.

Local verification completed: all 8 native route traversals, the 24-challenge campaign through the ending, 11 gameplay regressions (including every landing pose), 22 combat checks, 15 mobile-control checks (including rail descent), 20 modal checks, 11 journey/localization-flow checks, desktop/touch port editing and elevator/sentry mechanics. Pixel, placement, project, asset and circuit-model checks pass. The GDevelop MCP validator reports no project errors; its pre-existing static catalog warnings refer to the embedded AdvancedJump extension.
