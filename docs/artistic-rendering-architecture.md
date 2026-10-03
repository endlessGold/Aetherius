# Aetherius Artistic Rendering Architecture v2

## Goal
Aetherius does not define Japanese animation aesthetics as a cel-shader preset. It reconstructs observed reality into an authored image. PBR remains an observation/measurement language; artistic interpretation is allowed to distort it before presentation.

## Canonical pipeline
Reference Sources -> Observation -> Physical Reconstruction -> Semantic Scene -> Artistic Interpretation -> Painterly Representation -> Designed Lighting -> Compositing -> Frame

### 1. Reference Sources
Photographs, location studies, measured geometry, scanned/PBR materials, weather/light references, vegetation/ecology references and generated assets. References are evidence, not output targets.

### 2. Observation
Extract camera/lens, scale, geometry, material identity, physical albedo/roughness/metalness/normal/AO/height, light direction, atmospheric depth, color relationships, vegetation distribution, aging/weathering and composition.

### 3. Physical Reconstruction
Maintain a recoverable physical representation. Never destroy source PBR data merely to achieve a style.

### 4. Semantic Scene
Every renderable carries semantic roles such as terrain, foliage, architecture, water, character, prop, sky and FX plus depth band and focal importance. Art rules target meaning rather than arbitrary meshes.

### 5. Artistic Interpretation
This is the primary style layer:
- Color warp: scene palette, hue paths, value masses, saturation hierarchy and distance response.
- Material warp: translate roughness/metalness into material readability rather than literal BRDF output.
- Normal warp: preserve macro form, selectively retain medium form and suppress micro noise.
- Light warp: physical light proposes illumination; per-semantic effective-light bias may improve readability.
- Shadow design: physical visibility proposes shadows; simplify, merge, recolor or suppress shapes.
- Specular design: highlights communicate material and composition; they need not reproduce every reflection.
- AO reinterpretation: use proximity as contact/color/brush information instead of unconditional black multiplication.
- Perceptual reduction: omit, merge or exaggerate detail by depth and focal importance.
- Geometry/composition warp: controlled perspective, silhouette and scale adjustments are legal art operations.

### 6. Painterly Representation
Brush fields are anchored in world/object/UV space for temporal stability. Stroke direction can derive from slope, curvature, growth direction, flow or authored vectors. Detail density decreases from focal/foreground toward background.

### 7. Designed Lighting
Lighting is a hierarchy, not only energy conservation. Scene contrast, local color, main/secondary shadow, backlight, rim and selected accents are independently art-directable.

### 8. Compositing
Atmospheric perspective, designed focus/detail merging, bloom/glow where motivated, depth color, exposure/value compression and final color script integration happen after material interpretation.

## PBR distortion contract
Physical channels are immutable inputs:
- physical_albedo
- physical_normal
- physical_roughness
- physical_metallic
- physical_ao
- physical_height

Artistic channels are derived:
- palette_role / artistic_albedo
- art_normal
- art_roughness
- highlight_grammar
- contact_color
- value_mass
- shadow_palette
- effective_light
- brush_field
- detail_density

The renderer must permit bypassing artistic interpretation for diagnostics.

## Data ownership
Reference Board -> Observation Records -> Artistic Blueprint -> Renderer. Human editor and future MCP tools modify the same blueprint schema. Shader code is an implementation detail behind the blueprint.

## Runtime modules
- ArtisticBlueprint: loads/validates canonical art data.
- ArtisticMaterialInterpreter: converts physical material signals into artistic signals.
- ArtisticLightingInterpreter: converts physical lighting/visibility into designed light/shadow signals.
- BrushField: generates stable painterly coordinates/directions.
- CompositionInterpreter: depth/focal/detail policy.
- Godot adapters: bind interpreted signals to shader families and compositor.
- Diagnostics: Physical / Interpreted / Final views.

## Shader families
Terrain, Foliage, Structure, Water, Character, Prop and FX may use specialized shaders. They share interpretation contracts; they are not forced through one universal cel shader.

## Authoring UI
Reference -> Observe -> Interpret -> Render is the primary workflow. Inspector controls should expose semantic concepts such as palette role, hue path, value grouping, omission, exaggeration, brush direction, focal importance, shadow color and atmosphere before low-level shader parameters.

## AI/MCP boundary
Agents operate on observations and blueprints, not arbitrary shader source in normal operation. A request such as "late-summer afternoon, quieter background, stronger focus on the character" resolves to structured palette, value, detail, atmosphere and hierarchy edits.

## Non-goals
- photo-to-anime filter
- one universal toon shader
- destructive conversion of PBR textures
- screen-space random noise masquerading as brushwork
- physically correct lighting as an immutable final authority
