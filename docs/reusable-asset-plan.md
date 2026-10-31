# Protocol Zero: reusable asset replacement plan

Status: planning only, 2026-10-31. No replacement art has been generated or installed by this plan. Existing runtime art is a prototype, not the production template. This plan supersedes the separate equipped-gun approach in PR #3 and the earlier low-frame-count targets. The existing game remains playable while a new pack is developed alongside it.

Production tracking: [Trello asset V2 plan](https://trello.com/c/MhzOKQgN). Planning notes are on `docs/reusable-asset-plan`; no runtime files are changed in this planning pass.

## Confirmed direction

- Sci-fi compact cyborg explorer, visible human face, robotic limbs, teal armor.
- Keep the gameplay body 32×64. The user approved a larger animation canvas around it.
- The gun is drawn inside every relevant full-character animation. No separate runtime gun object. Separate bullets, muzzle flashes and other transient VFX are allowed.
- Every animation has at least 12 frames. Extra frames must show purposeful motion or secondary animation; repeated images do not qualify as a replacement for missing drawings. FPS and duration are separate decisions from frame count.
- Backgrounds use multiple true parallax layers, not one flattened scene image.
- Every interactable has a readable silhouette and subtle animated beacon. Nearby prompts show the action and current state. Color is supplementary to shape, symbols and text.
- The shared pack must support the tutorial and all six missions. Level 05 obtains ATLAS; Level 06 mounts it against the separate WARDEN boss.
- Plan the whole inventory now, validate a small connected sample in GDevelop, then generate in batches. Do not bulk-generate untested sheets or replace the current pack at once.

## What the reference project actually does

Inspected read-only: `C:/Users/zahid/Documents/Kuliah/PPLG/Animal Hunter.json`, its active player/pickup/prop images, and `src/events/gameplay.js`.

| Reference finding | What we reuse or improve |
| --- | --- |
| Player states Idle, Run, Jump, Fall, Land, Hurt, Shoot and Death each contain eight distinct images, all 128×128. Shoot includes the rifle. | Stable full-character canvases, named states and an integrated weapon; our replacement raises the minimum to 12. Do not copy the cowboy design or its unrelated theme. |
| Player collision mask is fixed at `(45,32)–(83,112)` across states; feet terminate at the same baseline. | Separate visible artwork from the gameplay collider. Keep stable root, body scale and pivots through all states. |
| Pickups, key, chest, checkpoint and exit have recognizably different silhouettes and intentional scene scale. | Props must communicate their purpose before a text prompt appears. Our required interactions also need explicit ready/locked/completed states. |
| Native animation events select locomotion; game rules briefly override with Shoot/Hurt/Land. | Explicit transitions. Improve the shooting behavior with RunFire and airborne fire variants so firing does not replace moving legs with a stationary pose. |
| Background and HUD cameras stay fixed while the world camera follows. | The HUD stays fixed. Replace the background approach with separate layers moving at distinct camera ratios. The reference is not evidence of true multilayer parallax. |

The current Protocol Zero pack has smaller exported frames, inconsistent source spacing and isolated art crops. Technical size validation alone has not made the visual result satisfactory. The new acceptance gate must include animation playback, character/prop scale and an actual decorated map.

## Art contract before generation

### Player canvas and coordinates

Proposed working canvas: **64×80 logical pixels**, containing the unchanged **32×64 gameplay body**. This is a blockout target to test before the full player batch.

| Field | Contract |
| --- | --- |
| Frame canvas | 64×80 for every on-foot state, including death and interaction |
| Body rectangle in art coordinates | x=16…48, y=8…72; 32×64 gameplay body |
| Root / feet anchor | (32,72), identical across frames; planted feet do not drift |
| Draw position relative to server body | (body.x−16, body.y−8); retain the gameplay body independently |
| Facing | Right-facing master; mirror around the root for left-facing art; check asymmetric details and muzzle points |
| Weapon | Same rifle, length, grip, hand placement and material palette throughout the player family |
| Firing attachment data | Per-frame `Muzzle` point and a reviewed shared shot anchor per firing stance; synchronize visual discharge to authoritative shots |
| Bounds | Rifle, recoil, limbs and death pose remain inside the canvas with transparent safety margins |

Do not scale each pose independently to fill its cell. Preserve body proportions and a common scale. Inspect both facings at 1× and the actual game zoom. A larger canvas does not enlarge the physics body or interaction range.

### Common pack rules

- One design bible for palette, pixel density, outlines, light direction and material contrast. Teal/cyan identifies friendly equipment; enemy silhouettes and warning shapes distinguish threats. Decoration is lower contrast than usable props.
- Logical pixel art, nearest-neighbor rendering, transparent character/prop/VFX backgrounds. No baked ground, ambient backdrop, labels, cell borders or neighboring objects in sprite cells.
- One animation per sheet. Default delivery is a **4-column × 3-row sheet for 12 frames**, or another declared uniform layout for larger sequences. Avoid giant sheets mixing characters, UI and animation states.
- Character root, body scale and costume details remain consistent across sheets. Raw generated output is provisional: actual sheet dimensions and subject boundaries must be inspected before slicing.
- Static tiles, static icons and fixed pose assets do not need 12 redundant copies. Every animated state/transition does meet the 12-frame minimum. Stable endpoints may be held by the engine after the sequence; do not count those holds as new drawings.
- Frame count does not dictate gameplay delay. Input stays responsive, shot cooldowns and damage remain authoritative, and long visual clips cannot extend invulnerability or block movement.

## Player animation inventory

All rows below include the rifle as part of the character drawing. During interaction or mounting it is visibly slung/stowed within that same sprite.

| State | Frames | Playback and purpose |
| --- | --- | --- |
| IdleArmed | 12 | Gentle breathing, stable stance and grip; no large head/body wobble |
| RunArmed | 12 | Clear foot contact, passing and airborne phases; rifle held coherently |
| FireIdle | 12 | Aim, discharge, recoil and recovery; full cycle fits the current 350ms fire interval; discharge is immediate |
| RunFire | 12 minimum; 24 if needed | Full-body armed running with compatible leg phases; preserve stride when entering/leaving fire and do not reset legs for every shot |
| JumpStart | 12 | Responsive takeoff; animation never delays the jump impulse |
| JumpRise | 12 | Controlled ascent pose and secondary motion; transition on velocity, not clip completion |
| Fall | 12 | Distinct descent pose, stable weapon grip; loop only where motion supports it |
| AirFireRise | 12 | Integrated rifle firing while rising; preserve trajectory and body scale |
| AirFireFall | 12 | Integrated rifle firing while falling; preserve trajectory and body scale |
| Land | 12 | Absorb impact and settle; movement can interrupt promptly |
| Dash | 12 | Braced thruster dodge, gun retained; match the short gameplay dash rather than stretching it to one second |
| Interact | 12 | Operate a panel, with the rifle visibly slung or lowered |
| InsertComponent | 12 | Readable fuse/module insertion and hand contact |
| Hurt | 12 | Brief recoil/recovery; visual duration must not trap movement through the full immunity window |
| Death | 18 | Collapse/deactivation with final held pose; no frame clipped by a standing-only crop |
| Mount / dismount | 12 each | Level 05–06 cockpit transitions; align to the ATLAS cockpit anchor |

This is a baseline of **210 player frames** across 17 sequences, before increasing RunFire or other clips. During the proof pass, establish an explicit animation/state transition table. In particular, RunFire must preserve leg phase, use coherent hand contact, and synchronize its discharge cues with the server without a separate runtime rifle. If the proof fails, revise that row before generating the remaining states.

## Reusable interactable system

Each placed interactive instance uses a stable gameplay ID, an art-family ID, an interaction anchor, a prompt anchor and an explicit state. Artwork never defines puzzle rules by its pixels.

### Visibility rules

1. At normal camera zoom, every on-screen interactable is recognizable without opening help or walking into it. Critical objects have a clear silhouette, contrast, grounding and sufficient native size.
2. A small 12-frame beacon identifies a usable mission prop from a distance. It moves subtly; it does not flash rapidly or cover the prop.
3. Nearby, a native GDevelop prompt displays the correct action: **E Activate**, **E Install fuse**, **Hold E Disable charge**, **E Board ATLAS**. Automatic pickups say **Collect** and do not falsely request E.
4. Locked props stay visible. Show a lock/missing-component shape and the reason; do not hide them until they become usable. Completed props remain visibly completed, with the action prompt removed or changed.
5. Readiness, missing power, wrong circuit and completed state differ through shape/animation plus labels. Never rely on red/green alone.
6. Keep signals, interaction markers and prompts above scenery. No foreground prop or HUD panel may hide an essential control, item, enemy telegraph or player feet. Clamp prompts into the safe screen area and resolve nearby overlaps.
7. Required objectives can have a small edge-of-screen direction marker when off-screen; this is not a beacon drawn through every wall. Optional logs get a quieter marker. Reuse the same marker family across levels.

### Interactive art families

| Family | Animated states; every named animation ≥12 frames | Reuse |
| --- | --- | --- |
| Power switch | Off idle, on idle, switching on/off | Training; A/B feeds; later relays |
| Component / fuse socket | Empty idle, insert, powered idle, fault | L01 fuse; later authorization modules |
| Carryable component | Available idle, collect | Fuses, keys and mission modules; variant silhouettes |
| Logic console shell | Idle, reading, valid output, invalid output, committed | AND/OR/NOT and compound consoles; glyphs remain readable static overlays |
| Purge charge / core | Armed idle, disarm, safe idle, failure discharge | Missions 01–04; varied casing and environment dressing |
| Security door / lift | Locked idle, unlocking, opening, ready idle, closing | All on-foot sectors and extraction |
| Bridge power unit | Inactive idle, enabling, active idle, disabling | L02 OR routes; hangar access |
| Shield emitter | Active idle, shutdown, disabled idle, reboot | L03 sentinel; WARDEN shield puzzles |
| Relay / power selector | Idle, reroute, energized, fault | L04 combined circuits; L05 hangar; L06 cannon authorization |
| Coolant valve / pump | Locked idle, ready idle, operating, flow, fault | L04 reactor; L05 cooling; L06 emergency phase |
| Archive / radio terminal | Available idle, access, collected/complete idle | Story logs, MIRA/ORIN conversations, tutorial |
| Checkpoint / mission beacon | Inactive idle, activation, active idle | Reuse where the scenario actually includes a checkpoint; do not silently change retry rules |
| Mech cradle / cockpit / sockets | Dormant beacon, boot, authorized, boarding, occupied, opening | Obtain ATLAS in L05, board in L06 |
| Cannon / anchor / EMP controls | Locked idle, authorized idle, activation, cooldown, fault | L06 mechanisms; shell/prompt language reused from earlier consoles |

Use a shared shell and common interaction language with distinct handles, silhouettes and glyphs. A fuse must not resemble a tiny anonymous pipe, nor a console blend into a decorative wall monitor. For each family, approve a side-by-side idle/locked/ready/completed view before generating all transitions.

## Enemy, NPC, mech and effect inventory

| Family | Required animation set | Frame target |
| --- | --- | --- |
| Patrol robot | Idle, walk, alert, telegraph, attack, recover, hurt, defeat | ≥12 each; defeat 18 |
| Scout drone | Hover, move, alert, charge, fire, recover, hurt, defeat | ≥12 each; defeat 18 |
| Shield sentinel | Idle, walk, shielded, telegraph, attack, stagger, hurt, defeat; shield activation/break effects | ≥12 each; defeat 18 |
| Circuit-linked turret | Idle, tracking, telegraph, fire, cooldown, disabled, destroyed | ≥12 each; destroyed 18 |
| MIRA / ORIN | Idle, talk, gesture, interact, alert; walking only if their scene requires it | ≥12 each; consistent portrait and world-sprite identity |
| ATLAS-01 | Dormant/boot, mount, idle, walk, dodge, cannon charge/fire, anchor launch/pull, piston strike, hurt, critical, EMP, defeat, dismount | ≥12 per animated sequence; defeat 24; own large body and hardpoints |
| WARDEN siege body | Arrival, idle, advance, shield break/recover, beam telegraph/fire/recover, slam, missiles, charge, stagger, joint damage, phase transition, overload, core exposure, defeat | ≥12 per sequence; transitions 18 and defeat 24; independent boss family |
| Shared VFX | Muzzle, pulse travel, impact, pickup, interact confirmation, signal flow, warning, shield hit/break, dash, death sparks | ≥12 per animated effect; keep readable effects brief through FPS, not padded copies |
| Giant VFX | Cannon, anchor/cable endpoint, piston impact, missiles, EMP, coolant, reactor overload, destruction | ≥12 per animated effect; distinct boss/player attack silhouettes |

Large mechs retain separate sprite families and gameplay bodies. ATLAS 192×192 and WARDEN 256×256 are provisional canvas targets; arena blockouts decide whether larger effect/recoil margins are necessary. Do not scale up the human player to create either giant.

## Parallax and map kit

Each environment is delivered as separate horizontally repeatable layers. Suggested camera ratios are starting values for the blockout, not final tuning.

| Layer | Ratio to world camera movement | Contents |
| --- | --- | --- |
| Sky / deep space | 0.00–0.05 | Lowest-contrast distant color field, stars or atmosphere |
| Far silhouette | 0.15 | Station exterior, distant towers, giant structures |
| Mid architecture | 0.35 | Structural bays, transit supports, distant machinery |
| Near background | 0.65 | Pipes, windows and wall structures behind the route |
| Gameplay | 1.00 | Player, platforms, enemies and every required interactable |
| Optional foreground | 1.10 | Sparse edge framing only; fade/omit when it would obscure play |
| HUD | Fixed screen coordinates | Native UI and clamped prompts/markers |

Use one camera anchor and wrap layers with a positive modulo so leftward travel does not reveal a seam. Extend vertical coverage for jumps and camera bounds. No collision on scenic layers. Background features remain lower contrast than actors, objects and enemy telegraphs. Test a full horizontal traversal and both camera edges; confirm distinct layer motion rather than merely having separately named layers.

| Environment kit | Missions | Reusable pieces / unique dressing |
| --- | --- | --- |
| Calibration / maintenance dock | Tutorial, L01 | Shared steel floors, gantries, cargo, instructional terminals; window views and broken dock dressing |
| Transit ring | L02 | Shared steel kit plus rail supports, bridge endpoints, electric hazard modules and transit signage |
| Archive / shield labs | L03 | Shared walls/consoles plus archive racks, glass bays and shield machinery |
| Reactor / relay sector | L04 | Shared pipes/relays plus reactor housings, coolant routing and stronger hazard bands |
| Mech hangar | L05 | Shared industrial kit plus giant cradle, lifts, cockpit access and authorization sockets |
| Siege arena | L06 | Common station materials plus arena bounds, ATLAS/WARDEN staging, boss machinery and distant siege silhouettes |

Terrain uses a common 16×16 logical grid, with corners/edges/fill, platforms, slopes only where physics supports them, ladders only where movement supports them, and separate decorative trims. Large props use whole-component crops and consistent grid multiples. Static tiles and backdrop layers are static images; animate only intentional devices/lights/hazards, with ≥12-frame sequences for those animated parts.

## UI and future reuse

Keep native GDevelop objects, layers and event groups. The replacement UI kit includes compatible nine-patch panel sizes, icon-only controls, shields/health, fuse/module slots, timer, objective markers, AND/OR/NOT symbols, dialogue/radio portrait frames, mission brief/result/help panels, mech/boss health and phase/overload indicators. Reuse these components across missions rather than drawing a new HUD per map. Static button states are normal/hover/pressed/disabled images; any animated indicator uses ≥12 frames. Reserve a tested safe area for the engine watermark and window/canvas resizing.

Assets are referenced by stable family/state IDs, not level filenames. An instance selects its visual variant separately from puzzle ID and server state. Player/co-op accents can be palette or badge variants later; they must not change dimensions, anchors or animation names. Do not add multiplayer mechanics during the art migration.

## Files and metadata

```text
assets/
  sources/v2/{characters,enemies,npcs,interactables,environments,mechs,bosses,ui,vfx}/
  runtime/v2/{same families}/
  manifests/v2/                 pack inventory, generation provenance and animation metadata
docs/reusable-asset-plan.md     production contract and review gates
```

The existing runtime pack stays intact until a whole tested migration is ready. Do not create a separate copied asset pack per level. Each family has a versioned source, readable animation names, exact-size exported frames/sheets and metadata recording: ID/version, source and crop, logical canvas/body size, frame count/order, FPS/loop/hold, root, facing/mirroring policy, muzzle/interaction/prompt points, visual bounds, palette, alpha, event cues and intended mission uses. Record the source prompt and technical cleanup; do not overwrite previous generated sources.

## Production order and review gates

1. **Reference and contract — this plan.** Agree on the character/weapon silhouette, larger canvas, minimum-frame rule and interaction visibility. Record the full campaign inventory and reuse mapping.
2. **Connected proof pack.** Produce player IdleArmed, RunArmed, FireIdle and RunFire (at least 48 real frames), one complete switch family, one fuse/socket family, one console, one patrol walk/telegraph, one native UI panel/button and the dock's separated parallax layers. This is a small playable art sample, not just an atlas preview.
3. **GDevelop proof scene.** Play at the real camera zoom. Compare character proportions, gun/hand contact, foot sliding, stride continuity during fire, roots/masks, muzzle origin, interaction recognition, state readability, background seams and parallax. Show animated previews plus an actual map screenshot. Resolve problems here before any bulk generation.
4. **Complete shared on-foot pack.** Generate the remaining player/enemy/NPC/interaction/VFX/UI sequences using the approved references and metadata. Every animated sequence passes the 12-frame minimum. Reuse the same families across levels.
5. **Environment variants.** Derive the transit, archive, reactor, hangar and siege kits using the approved pixel density and shared props. Check each in a representative map arrangement; do not leave the new assets unused in folders.
6. **Independent giant families.** Block out ATLAS and WARDEN in the boss arena, approve scale/hardpoints and first attack cycles, then finish their animation and mechanism kits. Update the older giant-asset inventory to this plan's frame rules.
7. **Migration.** Replace the old independent rifle with integrated character sprites, update resource paths and state bindings, and preserve authoritative gameplay timing. Remove old registrations only after usage checks; preserve previous source art and a rollback path. Finish native interaction cues and parallax for each map as it is implemented.
8. **Acceptance.** Run asset/source checks and GDevelop validation, review animation loops at native scale, and test firing/interaction/pause/retry plus a full mission with PostgreSQL in WSL Docker. Record evidence and remaining work in Trello. Feature branches/PRs only.

### Acceptance checklist

- Every animation has ≥12 exported frames with purposeful motion. Player/body dimensions, pivots, palette and identity stay consistent; no neighboring-cell fragments, cut limbs/guns or independent pose stretching.
- The player gun is visibly held/stowed in every relevant animation; no equipped-gun object remains. Bullets and muzzle VFX align in both facings, and running fire does not reset stride or force a standing pose.
- Every essential interactive item can be identified from its on-screen silhouette and beacon. Ready/locked/completed states and required action are understandable without color alone. Decor and HUD never hide it.
- Background layers move at visibly different ratios and repeat without obvious seams across the full map. They contain no baked-in gameplay objects.
- Shared assets have stable IDs and at least a documented second mission use where appropriate; level-only set pieces are explicitly named. All required L00–L06 families are accounted for, while only implemented levels are claimed playable.
- Static assets remain static where appropriate; frame padding, fake duplicates and slow uninterruptible clips are not used to satisfy the minimum.
- A proof scene and animated previews pass visual review before mass generation. Technical validation is necessary but does not replace that review.

Next concrete step after planning: the connected proof pack and GDevelop proof scene, beginning with the integrated-rifle player states and readable dock interactions. Do not start generating the entire campaign in a single batch.
