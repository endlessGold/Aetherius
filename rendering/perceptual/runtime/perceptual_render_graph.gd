class_name PerceptualRenderGraph
extends RefCounted

const PASSES=[
	{"id":"evidence","inputs":[],"outputs":["color_hdr","depth","normal_roughness","motion_vector"]},
	{"id":"boundary","inputs":["depth","normal_roughness"],"outputs":["boundary"]},
	{"id":"complexity","inputs":["color_hdr","depth","normal_roughness"],"outputs":["complexity"]},
	{"id":"saliency","inputs":["color_hdr","motion_vector"],"outputs":["importance"]},
	{"id":"detail_budget","inputs":["complexity","importance","depth"],"outputs":["detail_budget"]},
	{"id":"visual_mass","inputs":["boundary","detail_budget"],"outputs":["mass_labels","mass_stats"]},
	{"id":"form_separation","inputs":["mass_labels","boundary","importance"],"outputs":["operator_weights"]},
	{"id":"temporal_paint","inputs":["motion_vector","object_id","paint_history"],"outputs":["paint_state"]},
	{"id":"composite","inputs":["color_hdr","detail_budget","operator_weights","paint_state"],"outputs":["final_hdr"]}
]
func describe()->Array:return PASSES.duplicate(true)
func validate()->bool:
	var available:Dictionary={}
	for pass_def in PASSES:
		for input in pass_def.inputs:
			if input in ["object_id","paint_history"]:continue
			if not available.has(input):return false
		for output in pass_def.outputs:available[output]=true
	return true
