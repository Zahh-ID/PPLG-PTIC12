# Project collaboration rules

- Never push directly to `main`. Use a feature branch and a pull request; the user owns approval/merge.
- Keep Trello updated with active work, evidence, blockers and remaining acceptance criteria. Do not mark a card Done for a partial implementation.
- Keep the repository root tidy. Put design documents in `docs/`, art in `assets/`, infrastructure in `infra/`, and tooling in `scripts/`.
- Current product direction: solo-first, level-based sci-fi story, Boolean-logic puzzles, timed challenges and combat. Future co-op must be possible. Free building is an old technical prototype, not the product's core loop.
- Character direction: compact cyborg explorer, visible human face, robotic limbs, teal armor; logical animation frames are 32x64. Keep generated source art and distinguish it from validated runtime sprites.
- PostgreSQL runs in Docker inside WSL Ubuntu. Keep credentials, saves, backups and generated exports out of Git.
