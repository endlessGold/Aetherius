# Aetherius

Aetherius is a Godot-based art and game systems research project. The active visual foundation is **Artistic Rendering Architecture v2**: references and physical/PBR data are preserved as observation inputs, then intentionally interpreted into authored color, material, lighting, brush, detail and composition decisions.

## Active visual pipeline

Reference -> Observation -> Physical Reconstruction -> Semantic Scene -> Artistic Interpretation -> Painterly Representation -> Designed Lighting -> Compositing -> Frame

See `docs/artistic-rendering-architecture.md` for the canonical design and `art/blueprints/artistic_pbr_v2.json` for the executable blueprint.

## Current preview

- procedural terrain and nature scatter
- orthographic artwork workspace
- PBR-to-artistic interpretation contract
- color/value/shadow distortion controls
- specialized terrain shader
- Godot Web CI and optional verified Vercel deployment

## Local run

Open the repository in Godot 4.x and run `scenes/main.tscn`.

Controls: Q zooms in, E zooms out.
