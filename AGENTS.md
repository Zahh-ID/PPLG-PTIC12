# Project collaboration rules

- Never push directly to `main`. Use a feature branch and a pull request; the user owns approval/merge.
- Keep Trello updated with active work, evidence, blockers and remaining acceptance criteria. Do not mark a card Done for a partial implementation.
- Keep the repository root tidy. Put design documents in `docs/`, art in `assets/`, infrastructure in `infra/`, and tooling in `scripts/`.
- Current product direction: solo-first, level-based sci-fi story, Boolean-logic puzzles, timed challenges and combat. Future co-op must be possible. Free building is an old technical prototype, not the product's core loop.
- Character direction: compact cyborg explorer, visible human face, robotic limbs, teal armor. Gameplay body stays 32x64; the user approved a larger art canvas and the V2 proof uses 96x80 with root (48,72). The rifle is integrated into V2 character sprites; animated V2 sequences have at least 12 distinct frames. Keep generated sources separate from runtime exports, validate in AssetProof before bulk production, and preserve the existing campaign until migration is reviewed.
- PostgreSQL runs in Docker inside WSL Ubuntu. Keep credentials, saves, backups and generated exports out of Git.
