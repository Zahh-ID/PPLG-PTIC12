# Circuit Rescue — Pixel Pack v1

The active small robot is recreated in [player-v3](player-v3/README.md): 64 frames across eight dedicated action sheets. The original player/ and corrected player-v2/ folders are retained for reference. The manifest uses current paths and records fixed collision masks.

A cyan/navy/amber space-station theme for the logic-gate adventure. Individual PNGs and original generated sheets are included. See manifest.json for dimensions, frame order and source rectangles.

## Contents

64 recreated player source frames; 64 station/gameplay sprites; 64 interface/circuit icons; six large interface graphics; eight location backgrounds; two opaque terrain surfaces; three derived UI frames; 34 exact-grid cable tiles; 144 giant-robot frames. Preserved earlier versions, original sheets and previews are also included.

## GDevelop use

Player: 128×128, ground baseline y=112, top-left origin. Collision rectangle x45–83, y32–112. Mirror for left. Source actions each have eight frames; live Idle uses the calm ready pose, while movement/combat retain eight frames. Muzzle effects render separately to preserve body scale. Drone has eight frames and a fixed body mask. Original terrain blocks have transparent margins; use the opaque floor/platform surface textures for repeated native platforms. The workbench uses derived -frame panel PNGs as CSS border images while preserving the original complete panel artwork.

AND, OR, NOT, XOR, NAND, NOR, XNOR and buffer artwork uses standard silhouettes. Gate names, educational prompts, truth tables and button labels use live text. The workbench selects exact-grid cable tiles by four-neighbor connection masks; earlier framed wire icons remain decorative. Inventory and circuit dialog frames are supplied.

This pack is integrated into the Circuit Rescue campaign. See ../../docs/circuit-rescue-campaign.md for mission, circuit dialog, mecha and boss behavior. Original developer portraits remain unchanged. No audio is included.

Generated with the built-in image generation tool, then cropped and normalized without smoothing. Original PNG alpha is preserved. Generation prompts are in PROMPTS.md.

## Auto-connecting cable supplement

See [cables/README.md](cables/README.md) and [cables/manifest.json](cables/manifest.json) for all 16 four-neighbor masks in powered/unpowered states, plus insulated crossings. These are seamless 64×64 board tiles; the earlier framed wire icons remain available for menus. Generated deterministically as original pixel geometry; no additional AI generation was needed.

## Detailed giant robot supplement

[Combat pack](combat/README.md): 18 actions with eight frames each (144 frames). Mecha frames are 256×256; boss frames are 512×512. Original detailed sheets and prompts are included.

## Distinct location backgrounds

Level 1 uses `background/station.png`. Levels 2–8 use `background/locations/2.png` through `8.png`: warehouse, transit, tower, reactor, hangar, battlefield and guardian core. [Generation prompts](background/locations/PROMPTS.md) are retained. These images provide scenery; native GDevelop platforms define collision and traversable routes.
