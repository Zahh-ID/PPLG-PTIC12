# Giant robot animation pack

18 action sheets × 8 unique frames = 144 transparent PNG frames. No action is represented by a single pose or borrowed frames. Mecha frames are 256×256; boss frames are 512×512. Detailed original generated sheets are retained in sources/.

Mecha: Idle, Walk, Jump, Fall, Land, Shoot, Shield, Hurt, Death.

Core Guardian: Idle, Walk, Windup, Shoot, Slam, Shield, Exposed, Hurt, Death.

Each source sheet is a 4-column, 2-row animation, read left to right then top to bottom. Frames use nearest-neighbor scaling, a fixed scale for the entire action, a top-left origin and a canvas baseline at 87.5% height. See manifest.json for order, timing, loops and frame hashes. All frames were checked for visible content, transparency and distinct hashes within each animation. The generated artwork should still receive human animation review before release.

Use Walk as the mecha Run animation and Death as boss Defeated in GDevelop. Collision masks belong to the actor body, excluding cannon flashes, shield bubbles, sparks and smoke. No audio included.
