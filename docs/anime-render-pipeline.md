# Anime Render Pipeline

Aetherius now owns a first executable stylized render path rather than treating the final Godot frame as opaque.

Implemented now: screen/depth observation through Godot shader hints, screen-space stylized occlusion, micro-occlusion suppression, designed contact-mass emphasis, final value-mass/anime composite, and a runtime compositor controller.

The project currently uses `gl_compatibility`. Full RenderingDevice/compositor-effect motion-vector and object-ID targets require a Forward+ migration. This implementation does not fake those buffers.

Current path: `scene → physical/artistic material → depth observation → stylized occlusion → anime composite → frame`.

Next renderer path: `Forward+ → explicit render buffers → semantic/object IDs → motion vectors → temporal artistic stabilization → composite`.

External Vulkan/OpenGL buffer hooking is not the default architecture. Because Aetherius controls Godot, engine-owned passes are preferred. Hooking remains a compatibility adapter for external engines.

AO is not a universal physical darkening multiplier. The screen pass suppresses weak micro-occlusion and preserves larger contact masses. Semantic class-specific policies become available with explicit object/material ID targets.

Temporal stabilization must not be ordinary TAA. Motion vectors reproject prior artistic masks, object IDs prevent cross-object history, and disocclusion rejects stale history. Until those buffers exist, temporal blending remains disabled rather than approximated with ghost-prone screen history.
