# Independent giant-robot asset plan

Status: planned assets for the Level 05 recovery / Level 06 mounted boss scenario. None of these giant-robot sheets have been generated or implemented yet. Existing cyborg/NPC sheets are on-foot references only.

## Families and scale

| Family | Proposed native frame | Role |
| --- | --- | --- |
| `assets/mechs/atlas/` | 192x192 | Player-piloted ATLAS-01, obtained in Level 05, mounted in Level 06 |
| `assets/bosses/warden/` | 256x256 | WARDEN's independent giant siege body; three-phase enemy boss |
| `assets/props/mech_hangar/` | Multiples of 16 | Cradle, cockpit-entry marker, authorization sockets, maintenance terminals |
| `assets/logic/mech_systems/` | Multiples of 16 | Shield relays, power selectors, coolant valves and fixed circuit devices |
| `assets/ui/mech/` | Component-specific | Mounted controls, weapon readiness, circuits, mech/boss health, phase and overload indicators |
| `assets/vfx/mech/` | Effect-specific | Cannon, anchor/cable, missile, shield, EMP, coolant steam and destruction |

Frame sizes are blockout targets. Test readable proportions in the arena before committing final atlas sizes. Keep right-facing base art and mirror only when hardpoints and asymmetric parts are handled. Separate families, palettes and silhouettes must distinguish the player's mech from the boss at a glance.

## Animation inventory

Suggested frame counts are production targets, not generated outputs or final playback timings. One animation per uniformly spaced sheet; keep large effects and detached parts outside the body sheets.

| ATLAS animation | Frames | Loop |
| --- | --- | --- |
| Dormant | 1 | No |
| Boot | 8 | No |
| Mount / cockpit close | 8 | No |
| Idle | 6 | Yes |
| Walk | 8 | Yes |
| Thruster dodge | 6 | No |
| Cannon charge | 8 | Yes while readying |
| Cannon fire / recoil | 6 | No |
| Anchor launch | 6 | No |
| Anchor pull / recovery | 8 | No |
| Piston strike | 8 | No |
| Hurt | 4 | No |
| Critical reactor | 6 | Yes |
| EMP release | 8 | No |
| Defeat | 10 | No |
| Dismount / cockpit open | 8 | No |

| WARDEN animation | Frames | Loop |
| --- | --- | --- |
| Arrival / deployment | 10 | No |
| Idle | 6 | Yes |
| Advance | 8 | Yes |
| Shield active | 6 | Yes, separate overlay |
| Shield break / recovery | 8 each | No |
| Beam telegraph / fire / recovery | 6 / 8 / 6 | Fire can loop |
| Ground slam | 10 | No |
| Missile launch | 6 | No |
| Charge attack | 8 | No |
| Reflective carapace | 6 | Yes, separate overlay |
| Anchor stagger | 8 | No |
| Joint damage | 4 | No |
| Phase transition | 10 | No |
| Overload charge | 8 | Yes, separate effect |
| EMP stagger | 8 | No |
| Core exposed | 6 | Yes |
| Defeat | 12 | No |
| Wreck | 1 | No |

## Metadata and acceptance

- Each exported animation records native frame size/count/order, FPS, loop range, facing, feet/root pivot, alpha, palette and source prompt/version.
- ATLAS hardpoints: cockpit, cannon muzzle, anchor launcher, cable attachment, piston contact, thrusters and reactor. WARDEN: shield/core/joints, beam emitter, missile pods and floor-contact areas.
- Export root/body hitboxes and weak-point areas separately from art bounds. Authoritative attack timings and damage volumes must not change when visual frame count changes.
- Shield, core, reflection and reactor states use shapes/animation plus UI text/icons, with color as an additional cue.
- Atlas rows cannot overlap; transparent margins contain recoil and limbs. Validate native-scale readability, pivot consistency and both facings in GDevelop.
- Generate and inspect one body family and its first attack loop before producing every boss animation. Never combine the two robots into one giant unstructured sheet.

This work follows the tested Level 01 and Level 05/06 blockouts; it does not replace the next mission-state/first-level implementation task.
