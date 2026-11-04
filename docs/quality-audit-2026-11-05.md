# Animation and gameplay quality pass — 5 November 2026

Branch: `fix/gameplay-readability`. Candidate changes; not merged or deployed.
Tracking: [Trello](https://trello.com/c/aItePU9t) / [PPLG12-86](https://pplg12.atlassian.net/browse/PPLG12-86).

## Coverage

`node scripts/audit-animations.mjs` inventories every sprite object/action/direction across all eleven scenes: 786 definitions and 434 referenced images. It checks resources, positive timing and consistent frame canvases, writing the complete inventory to ignored `.local/reports/animation-inventory.json`. Static inventory does not prove motion quality.

Visual review included player-v3 and combat-v2 contact sheets, original guard/mecha/Bastion atlases, replacement atlases and exported combat screenshots. Static backgrounds, props, pickups, menu artwork and generated controls deliberately remain single-frame assets. The small player retains its stable idle pose; its seven active actions retain eight frames. Bastion retains nine eight-frame actions; four projectile animations remain visually distinct.

Replaced the mecha's nine actions, guard's six actions and Crimson Warden's twelve actions: **216 frames, eight per action**, in `assets/circuit-rescue-v1/combat-v3/`. Full source atlases, prompts and manifest are preserved. Existing resource names resolve to the new files; old packs remain available. Fixed canvas origins and collision masks remain unchanged. Cells are extracted at a fixed scale/offset per actor, never individually centered or normalized. The Warden source has 128px cells expanded with nearest-neighbor sampling to the established 256px runtime canvas; this does not add native detail.

## Corrections

| Problem | Candidate behavior |
| --- | --- |
| Contacts and simultaneous shots summed into excessive damage | Queue the strongest individual impact; preserve invulnerability and shield protection |
| Guard melee hit before its animation | Windup enters an action; damage/projectile release occurs 0.30 seconds into that action |
| Shot repeats reset the shield animation | Shield presentation takes precedence and holds its final pose |
| Falling/shield loops repeatedly return to their initial pose | Play once and hold; keep walking/idle loops |
| Knockback reverses facing | Preserve facing throughout hurt |
| Cover notices overwrite important feedback | Wait for the existing notice to expire; attack warnings retain priority |
| Stale hard-coded 3/3 briefing placeholder | Use actual count in initial markup too; existing runtime text already reported the count |
| Editor obscures the board on small screens | Responsive medium-width layout; expandable localized wiring guide; full board fits portrait width |
| Resume and respawn can carry delayed hits | Clear pending damage on dialog return; grant 1.5 seconds safety; clear old hostile shots on respawn and grant 2 seconds safety |
| Short boss punish windows | Recovery 1.5 seconds, reduced by 0.1 seconds per final-boss phase |

Boss hull remains 24/60; Warden shields still return at 40/20. Player health/lives/ammo, mecha hull, shield reserve/recharge, component requirements and all 24 Boolean challenges remain intact. Puzzles still pause combat and wrong tests cost no materials. Guard incidental contact cannot pre-empt its readable windup/action/recovery; valid stomps still work.

## Research and rationale

[GDevelop sprite documentation](https://wiki.gdevelop.io/gdevelop5/objects/sprite/) describes separate animations, frame timing and looping. The fixes use those controls rather than repeatedly switching between competing states.
[Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/offer-a-wide-choice-of-difficulty-levels/) recommends flexibility in challenge; this pass first corrects unintended punishment and response windows. It does not claim to implement a difficulty selector or certify accessibility.

Compared with [GDD player rules](https://trello.com/c/ZyWV28Ya), [enemy rules](https://trello.com/c/YTGbt1d1) and [UI rules](https://trello.com/c/3ewSdnwy). These candidate tuning details must be reviewed before being described as shipped GDD behavior.

## Validation and remaining acceptance

Repository/circuit/localization/actor/map/workflow checks pass. 102 circuit cases and 98 browser assertions passed across campaign (33), combat (22), mobile (14), journey (11), browser policy (14) and readability (4). Browser suites cover campaign progression, damage/shield/attack behavior, touch controls, navigation/languages and fullscreen policy. Combat regressions include simultaneous hostile shots and firing while holding a stable shield. Generated asset hashes, dimensions, eight distinct frame files per action and runtime references are checked by `check:combat`.

These tests use controlled positioning and some state overrides for fast coverage. They do **not** establish that a new learner can complete an uninterrupted run, that every action feels smooth, or that physical Safari/Android performance is acceptable. Keep PPLG12-1 through PPLG12-5 and this quality pass open for human/device review. No merge, publish, learning-gain claim or Done acceptance is implied.
