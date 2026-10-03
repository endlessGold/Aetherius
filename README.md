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
- Vercel container build path for automatic Godot Web export and preview deployments

The old implementation remains preserved on `legacy/main-v1`.

## Local run

Open the repository in Godot 4.x and run `scenes/main.tscn`.

Controls: WASD/arrows move, Q zooms in, E zooms out.

## Web build

The repository includes `Dockerfile.vercel` and `export_presets.cfg`. Vercel can build the container, run pinned Godot 4.7.2 headlessly, export the Web target, and serve the resulting WebAssembly build. See `docs/web-build.md`.

The map definition is executable game IR. Future Aetherius MCP agents should mutate the runtime representation directly, run it, validate it, and commit a ChangeSet.
