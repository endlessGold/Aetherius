# Perceptual Painting Renderer

This directory is the executable GPU core described by the Aetherius Perceptual Painting architecture.

## Current implementation

- Forward+ is enabled at project level.
- `PerceptualCompositorEffect` requests resolved color/depth, normal-roughness and motion vectors from Godot.
- A precompiled GLSL compute pass performs the first live information-editing operation on HDR color.
- Compute kernels are present for boundary energy, detail budget, form-separation operator weights and object-ID-gated paint-history reprojection.
- `PerceptualRenderGraph` defines the dependency contract for the complete renderer.
- `PerceptualShotProfile` moves artistic intent into measurable parameters rather than a named style preset.

## Important implementation boundary

The current live compositor dispatches the fused perception/composite kernel first. The additional kernels are explicit GPU modules but require resource-pool/intermediate texture wiring before they execute as a multi-pass graph. Object/Semantic ID auxiliary rendering is also required before temporal paint history is enabled.

The previous CanvasLayer anime compositor remains a fallback/debug path only and should not be enabled together with the Forward+ compositor.

## Next wiring order

1. GPUResourcePool for R16F/RG16F/RGBA16F/R32UI transient targets.
2. ID auxiliary render pass.
3. Boundary → Complexity → Saliency → DetailBudget dispatch chain.
4. Visual-mass labels/statistics at reduced resolution.
5. Form-separation operator composite.
6. Object-ID-gated temporal paint history.
7. Diagnostic export and BBIDE metrics.
