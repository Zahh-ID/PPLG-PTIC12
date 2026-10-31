# V2 preserved sources

Original image_gen outputs for the connected art proof. `assets/manifests/v2/generation.json` records prompts, identity references and draft/selected status; `proof-spec.json` declares the intended exports. These are not exact-size runtime sheets. The initial idle source remains as a reference draft; its cleaned derivative is the runtime master.

The character sheets have uneven column placement and some poses cross nominal grid boundaries. Adjacent `*.crops.json` files cache whole-silhouette bounds tied to the source SHA-256. `scripts/export-proof-art.py` performs technical slicing, shared-scale alignment, binary-alpha cleanup and 32-color family export without modifying these PNGs. Reviewed outputs live in `assets/runtime/v2/`, their geometry is recorded in `assets/manifests/v2/proof.json`, and preview artifacts live in `assets/previews/v2/`.

See `docs/asset-proof.md`. No later-level or giant-robot art is claimed complete by this proof.
