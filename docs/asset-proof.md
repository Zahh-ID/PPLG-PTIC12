# V2 connected asset proof

This is the first visual gate in the [reusable asset plan](reusable-asset-plan.md), not a completed campaign art replacement. Open `LogicGate.json`, select **AssetProof** in GDevelop, and preview it. Mission01 remains the default playable campaign scene; its existing art and PostgreSQL progression are preserved.

The proof is a local art-review sandbox with no campaign save commands. Walk through power → fuse pickup → socket installation → console authorization, then inspect the patrol's walking/warning poses and fire at it. A/D or arrows move, J or left mouse fires, E interacts, Escape pauses and R or the native replay icon resets. Only the four approved ground locomotion/fire states are included here; jumping and the remaining player/enemy/mech animations belong to later batches.

## What is present

- Four integrated-rifle player animations: idle, run, stationary fire and running fire, 12 distinct frames each. There is no equipped-rifle object in AssetProof. Frame-based muzzle points mirror with the character. Running/fire switching preserves the running phase rather than restarting the legs.
- Switch toggle, fuse hover/charge, fuse insertion, console activation, patrol walk/telegraph and interaction beacon: 12 distinct frames per sequence. Stable device states hold sequence endpoints instead of inventing duplicate frames.
- Generated dock far/mid/near layers at camera ratios 0.15/0.35/0.65, a platform strip and a native nine-patch HUD panel. Adjacent background repeats alternate native horizontal mirroring to join identical source edges; a two-tile modulo period supports both camera directions. This is not a claim that the raw generator produced mathematically seamless tiles.
- Always-visible item state labels and subtle beacons; nearby prompts distinguish activation, automatic collection, missing fuse, fitted socket, ready console and accepted lock. The generated props are actually placed in the map.
- Native GDevelop objects, layers, object folders and a native replay click event. Existing replay-icon and static pulse textures are reused while their full V2 UI/VFX families remain pending.

The pack contains **137 runtime images: 11×12 animation frames and five static images**, plus technical sheets and review previews. All files are grouped under versioned V2 folders alongside the previous pack. The generation manifest preserves prompts, references and original source filenames.

## Canvas decision from actual export review

The planning canvas was 64×80. Runtime checks exposed source-column drift, overlapping nominal cells and rifle/firing effects crossing the proposed bounds. The proof uses a **96×80 art canvas** so the character's pixel scale can stay consistent without cutting limbs or the rifle. The **32×64 body is unchanged**, at `(32,8)–(64,72)` inside the art frame. The root is `(48,72)`; the draw offset from the body is `(-32,-8)`.

Player sources use recorded whole-silhouette crops rather than assumed nominal cells. A common family pixel scale and rigid head/root registration remove unequal source spacing; feet share the baseline. No pose is independently stretched to fill its cell. The exporter records crop rectangles, bounds, clipping flags, muzzle points, FPS, loop, root, family palette and preserved source paths. A crop cache is tied to the source SHA-256 and can be reviewed beside each source image. Other proof sheets use their verified 4×3 layout.

## Rebuild and verify

Run `npm run art:proof`, `npm run check:art:proof`, `python scripts/preview-proof-art.py`, then `npm run build:client`. Save any GDevelop editor changes first and reopen the project afterward. Generated `layouts/asset-proof.json` comes from `scripts/build-asset-proof.js`, `shared/asset-proof.js` and `src/events/asset-proof.js`.

The builder also writes `.cache/asset-proof-preview.json` for the single-file MCP exporter. Export that scene into ignored `exports/proof`, then run `npm run test:art:browser` (set `CHROME_PATH` if needed). The test exercises the real GDevelop canvas, integrated-fire locomotion, interaction route, animation endpoints, distinct parallax movement, pause, mirrored fire and native replay after resizing. The proof does not read/write PostgreSQL; the separate Mission01 regression continues to verify PostgreSQL in WSL Docker.

Art checks require 12 distinct frame hashes, exact sizes, binary alpha, nonempty images, family palette limits, preserved source references, root/muzzle data and no clipped source bounds. These checks supplement visual review; unique hashes alone do not prove animation quality. See the [full contact sheet](../assets/previews/v2/all-animation-frames.png) and [slowed player comparison](../assets/previews/v2/player-states.gif).

## Remaining gate

Review the in-engine proof and animation previews before generating the rest of the campaign. Remaining work includes airborne/interaction/hurt/death/mount player states, complete patrol combat, other enemies/NPCs, additional interaction transitions and environment kits, full UI/VFX, independent ATLAS/WARDEN families and campaign migration. Artist review may still call for smoother pose spacing and material/outline adjustments. This branch does not declare the entire V2 pack visually accepted.
