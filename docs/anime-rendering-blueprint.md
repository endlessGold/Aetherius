# Aetherius Anime Rendering Blueprint v1

The renderer is data-driven: editor and future MCP clients modify the same blueprint; runtime code compiles that blueprint into Godot shader/environment parameters.

Flow:
ArtStyle + Material + Environment + Composition + WorldArt -> AnimeRenderPipeline -> Godot shaders -> live preview.

## Contracts
- ArtStyle: palette/shadow/rim/painted and macro variation.
- Material: semantic surface families (terrain first; foliage/water descriptors reserved).
- Environment: sky, ambient, sun and atmosphere.
- Composition: camera and foreground/midground/background detail hierarchy.
- WorldArt: generator seed and terrain/scatter parameters.

The first executable preset is art/blueprints/anime_clear_day.json.
The first compiler is scripts/art/anime_render_pipeline.gd.
The first generic family shader is shaders/anime_surface.gdshader.

Terrain remains a specialized family because it requires world-height, slope and macro masks.
