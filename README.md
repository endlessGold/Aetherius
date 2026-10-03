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

The old implementation remains preserved on `legacy/main-v1`.

Open the repository in Godot 4.x and run `scenes/main.tscn`.

Controls: WASD/arrows move, Q zooms in, E zooms out.

The map definition is executable game IR. Future Aetherius MCP agents should mutate the runtime representation directly, run it, validate it, and commit a ChangeSet.
