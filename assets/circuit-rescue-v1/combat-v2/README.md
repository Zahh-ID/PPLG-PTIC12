# Robot combat v2

320 frames: mecha 9 actions, Bastion 9, Crimson Warden 12, sentry 6, plus 4 projectile types; eight frames per action. All actor cells use one common scale and canvas anchor across actions. Full-cell extraction preserves limb motion and collapse size; no per-frame normalization. Fixed body collision masks exclude blades, shields and muzzle flashes.

Original generated atlases and prompts are included. Actor atlases are 8×3; projectile atlas is 8×4. Nearest-neighbor extraction creates 256px mecha, 256px bosses and 128px guards/projectiles. The contact sheet shows all 36 actor actions.
