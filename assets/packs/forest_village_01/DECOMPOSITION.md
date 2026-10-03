# Source-sheet decomposition contract

Canonical input: the approved 1536x1024 Aetherius Forest Village resource-pack sheet.

Fake SVG/OBJ substitution is forbidden. Raster outputs are valid only when pixel-derived from the canonical sheet or regenerated from an explicit reference crop.

## Panel rectangles
terrain_tiles [7,372,960,510]
terrain_variants [7,511,960,665]
foliage [7,667,390,884]
rocks_cliffs [392,667,660,884]
buildings [662,667,958,884]
props [960,667,1220,884]
decals [1221,667,1528,884]
water [7,885,445,1017]
lod_variants [447,885,1087,1017]

## Material grid
Columns: grass [1034,1103], soil [1112,1182], rock [1191,1261], cliff [1271,1341], path [1350,1421], water [1430,1501].
Rows: albedo [420,479], normal [480,536], roughness [538,595], height_ao [597,652].

2D crops are source/reference textures. Single-view buildings, cliffs, rocks and props must pass image-to-3D/multi-view reconstruction before receiving complete status.
