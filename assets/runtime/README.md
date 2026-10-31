# Runtime exports

Derived from preserved image_gen source sheets by `python scripts/export-mission-art.py` (Pillow required). Originals remain untouched. `manifest.json` records source crop rectangles, native dimensions, animation frame counts, FPS, pivots and alpha/palette processing.

Cyborg frames are 32x64 and patrol frames 32x48. Character animations use binary alpha and a shared 32-color palette per source family. Some generated poses still need manual animation polish; these are tested prototype exports, not final production-art acceptance.

The cyborg prone pose spans two source cells and is exported whole, then held for the final two defeat frames. The world-decor sheet uses reviewed whole-object crop bounds because its generated rows are uneven; its two second-row fence variants merged into one source object and intentionally share a crop. Terrain seams are not yet fully polished.

Ground, wall, gantry, window and hazard textures, together with cargo/pipe/server/console props, are placed by `scripts/build-client.js`. Physics comes from the separate authored level definition, never from decorative pixels. See `docs/map-design.md`.
