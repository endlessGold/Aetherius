extends SceneTree
func _init()->void:
	assert(ProjectSettings.get_setting("rendering/renderer/rendering_method")=="forward_plus")
	var graph:=PerceptualRenderGraph.new()
	assert(graph.validate())
	var ids:=graph.describe().map(func(p):return p.id)
	for required in ["evidence","boundary","complexity","saliency","detail_budget","visual_mass","form_separation","temporal_paint","composite"]:
		assert(required in ids)
	var profile:=PerceptualShotProfile.new()
	assert(profile.paint_persistence>0.0)
	print("perceptual-render-contract: OK")
	quit(0)
