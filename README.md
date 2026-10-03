# Aetherius

Aetherius is being rebuilt as an executable game-system platform rather than a document-first design tool.

## Current vertical slice

- Godot 4.x 3D world with orthographic 2.5D camera
- 8-direction movement
- wide tactical to close character-scale camera zoom
- Web-friendly Compatibility renderer baseline
- 2D illustration-style material shader prototype
- executable Trigger -> Condition -> Action map definition
- playable ancient-gate sample interaction with runtime event logging
- GitHub Actions Godot Web build and validation pipeline

The old implementation remains preserved on `legacy/main-v1`.

## Web build

`.github/workflows/godot-web.yml` is the canonical Web build runner. Every main push and pull request builds the Godot Web target and uploads the verified `aetherius-web` artifact.

Vercel is intended to host a build that already passed GitHub CI rather than acting as the Godot compiler.
