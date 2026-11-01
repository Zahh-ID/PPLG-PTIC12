# Auto-connecting cables

34 transparent, exact-grid 64×64 PNGs. No tile padding or UI frames. All 16 neighbor combinations exist in off/on states; isolated cables use mask 0. Two additional insulated crossing images are provided. Generated as original pixel geometry with scripts/generate-circuit-cables.mjs; existing generated art is unchanged.

## Selection

mask = (up ? 1 : 0) | (right ? 2 : 0) | (down ? 4 : 0) | (left ? 8 : 0). Use cable-{mask padded to two digits}-{off or on}.png. Example: up+right = 3; horizontal = 10; vertical = 5; all directions = 15. Place without gaps on a 64-pixel grid. Recompute the placed/removed cell and its four neighbors after every edit. Only connect gate sides with a compatible exposed port.

Ordinary T/cross tiles join all their arms electrically. Insulated crossings keep horizontal and vertical networks separate; for independently powered crossing lanes, layer a horizontal and vertical cable on separate render layers instead of relying on the single-state crossing image. Neighbor detection and signal simulation still require game code.

Signal color is additional feedback: retain visible 0/1 output labels in the puzzle. Node generator checks edge-pixel compatibility for every connected horizontal and vertical seam. Preview rows: masks 0–7 off, 8–15 off, 0–7 on, 8–15 on.
