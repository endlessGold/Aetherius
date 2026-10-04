extends SceneTree

func _init() -> void:
	assert(ProjectSettings.get_setting("rendering/renderer/rendering_method") == "forward_plus")
	var graph := PerceptualRenderGraph.new()
	assert(graph.validate())
	var effect := PerceptualCompositorEffect.new()
	var contract := effect.diagnostic_contract()
	assert(contract["renderer"] == "forward_plus")
	assert(contract["live_inputs"] == ["color_hdr", "depth", "normal_roughness"])
	for required in ["boundary", "detail_budget", "form_separation", "composite"]:
		assert(required in contract["live_operations"])
	assert(contract["temporal"] == false)
	var shader_source := FileAccess.get_file_as_string("res://rendering/perceptual/compute/perceptual_composite.glsl")
	assert("binding=1" in shader_source)
	assert("depth_tex" in shader_source)
	assert("binding=2" in shader_source)
	assert("normal_roughness_tex" in shader_source)
	assert("depth_boundary" in shader_source)
	assert("normal_boundary" in shader_source)
	print("perceptual-render-contract: LIVE INPUT CONTRACT OK")
	quit(0)
