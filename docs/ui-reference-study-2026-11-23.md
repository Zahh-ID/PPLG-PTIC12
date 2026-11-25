# Modal reference study — 23 November 2026

User rejected the current candidate modals as generic website UI. Automated correctness does not establish visual acceptance. The current candidate styling remains unapproved.

Reference supplied by the user: https://images.motion.dev/examples/stage/vue/pokopia-modal/v-21804f79c1a7/stage.mp4

The downloaded reference is 1440×900, 60 fps, approximately 4.22 seconds. Examined 24 selected frames from roughly 253 frames, concentrating on the opening and checking the later reset. Source clip, samples, contact sheets and approximate pixel measurements remain in ignored `.local/references/pokopia-modal/`. No game screenshots were inspected during this study.

## Visible sequence

| Clip time | Observation |
| --- | --- |
| 0.10–0.30 s | Small central emblem/control; background goes from sharp toward blurred. |
| 0.35–0.50 s | Compact colored tile settles before the large expansion. |
| 0.60 s | Colored shell is already substantial; the white inner surface is still small. |
| 0.70–0.90 s | Outer shell approaches final extent while the inner surface catches up. The emblem remains central and begins fading. |
| 1.00–1.40 s | Inner panel settles into a stable colored rim and white outline. |
| About 2.60 s | Preview resets to the background and begins another opening. This does not establish a matching animated close. |

These are sampled observations, not the gated implementation's timing/easing parameters. The source code was not accessed or reconstructed.

## Visual treatment, separate from geometry

The dominant shell is approximately coral `#ff3849`, paired with a white inner surface and a thin white outline. The saturated world remains visible through blur; it is not replaced by an opaque dark overlay. Layer separation and coordinated colors carry much of the identity. The clip's panel interior is blank, so it does not establish typography, content layout or a complete interface system.

Colorfulness is the palette's saturation and variety. A coherent aesthetic also depends on materials, edges, contrast, icon language, type and motion. Copying rounded rectangles, increasing saturation, or changing one accent color would not address the user's feedback.

For Circuit Rescue, develop a coordinated sci-fi palette around the existing cyan energy, amber hardware and readable light surfaces with dark ink. Keep the circuit board's signal contrast deliberate. Use a colored shell and delayed inner reveal as independent layers; reveal readable content once settled, retain reduced-motion support and preserve input/pause/focus guarantees. SVG geometry, JSON palette/motion metadata and CSS/native browser animation can express this without new large raster UI images or a framework migration.

No replacement implementation was approved or visually verified in this study. The user performs game visual review.

## Implemented candidate

The first local candidate used cyan `#3bc8be`, cream `#fff8e7`, navy ink and amber primary actions, with extruded button edges and colored level tiles. A locally bundled Anime.js 4.5.0 timeline animates separate shell, paper and chip-emblem layers over a 480 ms entry; dismissal takes 140 ms. Guidance came from the configured Anime.js MCP's performance and timeline examples, adapted to the installed v4 API using official Anime.js documentation. The workbench retains a dark circuit board and collapsible mission/wiring guidance.

SVG source geometry and timing metadata live in `assets/circuit-rescue-v1/vector-ui/manifest.json`; styling lives in `src/ui/modal-theme.css`, and the web controller in `src/ui/modal-motion.js`. No new raster UI artwork was generated for this pass. Automated tests cover layout bounds and interaction lifecycle. No game screenshot was inspected, and appearance still needs the user's review. Trello was not updated for this pass.

## ConnectKit palette revision

The user subsequently requested [ConnectKit](https://github.com/family/connectkit) as the dark color reference. Inspected its [base dark tokens](https://github.com/family/connectkit/blob/main/packages/connectkit/src/styles/themes/base.ts) and [midnight preset](https://github.com/family/connectkit/blob/main/packages/connectkit/src/styles/themes/midnight.ts) directly, without adding the wallet library. The current palette follows the base dark theme: `#2B2B2B` modal surfaces, `#333333` secondary surfaces, `#383838` buttons, `#404040` hover, `#4D4D4D` active states, white text and `#1A88F8` focus/selection accents. Muted instructions use `#B8B8B8` rather than low-opacity white. Circuit power, socket, success and error cues retain their distinct signal colors. Geometry, the Anime.js timeline and game behavior remain unchanged. Palette values now generate CSS variables and SVG colors from the same manifest.

## Logo, typography and interaction revision

The abstract brand mark is an angular C-shaped circuit whose open terminals are joined by a blue signal path. The SVG and Lottie geometry derive from the manifest. The mark leads the existing 480 ms entry, followed by the shell and inner surface, and fades before content becomes active. A small static mark remains beside modal headings.

Following the user's Lottie request, the HTML export bundles Lottie Web's light SVG player locally. Twenty-nine icon files, a traced logo and text-button feedback are vector-only JSON. Feedback plays once on interaction; it does not loop. SVGs stay available on loading failure and under reduced motion. Native GDevelop icons continue using SVG textures. The HTML controller releases players when targets disappear, become inert, scroll, resize, lose visibility or the motion preference changes.

The user also requested ConnectKit's typography. Inspected its [font stack](https://github.com/family/connectkit/blob/main/packages/connectkit/src/styles/index.ts) and [modal typography](https://github.com/family/connectkit/blob/main/packages/connectkit/src/components/Common/Modal/styles.ts): 17px/600 header, 19px/600 content heading, 16px/21px body, 13px supporting text. Removed heavy Trebuchet headings and tracked uppercase labels. English and Indonesian introductions now use short real-world examples rather than equations. Combat advice is optional, and navigation uses text instead of arrow icons. Arrow glyphs were removed from event-source instructions and button labels. Binary input/output values remain in the interactive circuit board.

Behavioral validation uses the exported players and DOM state. It does not inspect game screenshots or establish visual acceptance. These changes remain local and do not update Trello.
