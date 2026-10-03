# Terrain material resources

The runtime material resource generator implements the earlier reference-sheet vocabulary without baking copyrighted source imagery into the repository.

Generated semantic sets:
- grass
- soil
- rock
- cliff
- path

Each set produces:
- artistic albedo
- simplified normal
- roughness
- height

The terrain shader consumes these as world-space triplanar-like XZ samples and combines them with generated semantic masks. The original physical/material intent remains separable from Artistic PBR interpretation.

The next resource families are foliage masks/backlight, water flow/foam, structure trim/decal and seasonal/regional variants.
