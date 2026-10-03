# Forest Village 01

A source-controlled Aetherius resource pack. Every asset is an individual repository file rather than a sprite-sheet mockup.

- `terrain/*.svg`: tileable source textures for terrain semantics.
- `foliage/*.obj`, `rocks/*.obj`, `props/*.obj`: lightweight source meshes.
- `decals/*.svg`: transparent detail decals.
- `manifest.json`: canonical family/variant registry.

SVG and OBJ are used as Git-native source formats so assets remain reviewable in GitHub. Godot imports them; optimized PNG/WebP/GLB derivatives belong in the build/import pipeline.
