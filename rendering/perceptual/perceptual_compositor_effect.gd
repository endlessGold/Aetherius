@tool
class_name PerceptualCompositorEffect
extends CompositorEffect

var rd: RenderingDevice
var shader: RID
var pipeline: RID
var sampler: RID
var ready := false
var detail_strength := 0.42
var separation_strength := 0.55
var depth_strength := 0.75
var normal_strength := 0.65

func _init() -> void:
	effect_callback_type = EFFECT_CALLBACK_TYPE_POST_TRANSPARENT
	needs_motion_vectors = true
	needs_normal_roughness = true
	access_resolved_color = true
	access_resolved_depth = true
	rd = RenderingServer.get_rendering_device()
	if rd == null:
		return
	var file: RDShaderFile = load("res://rendering/perceptual/compute/perceptual_composite.glsl")
	if file == null:
		return
	shader = rd.shader_create_from_spirv(file.get_spirv())
	if not shader.is_valid():
		return
	pipeline = rd.compute_pipeline_create(shader)
	var sampler_state := RDSamplerState.new()
	sampler_state.min_filter = RenderingDevice.SAMPLER_FILTER_NEAREST
	sampler_state.mag_filter = RenderingDevice.SAMPLER_FILTER_NEAREST
	sampler_state.repeat_u = RenderingDevice.SAMPLER_REPEAT_MODE_CLAMP_TO_EDGE
	sampler_state.repeat_v = RenderingDevice.SAMPLER_REPEAT_MODE_CLAMP_TO_EDGE
	sampler = rd.sampler_create(sampler_state)
	ready = pipeline.is_valid() and sampler.is_valid()

func _sampled(binding: int, texture: RID) -> RDUniform:
	var u := RDUniform.new()
	u.uniform_type = RenderingDevice.UNIFORM_TYPE_SAMPLER_WITH_TEXTURE
	u.binding = binding
	u.add_id(sampler)
	u.add_id(texture)
	return u

func _image(binding: int, texture: RID) -> RDUniform:
	var u := RDUniform.new()
	u.uniform_type = RenderingDevice.UNIFORM_TYPE_IMAGE
	u.binding = binding
	u.add_id(texture)
	return u

func _render_callback(callback_type: int, render_data: RenderData) -> void:
	if not ready or callback_type != EFFECT_CALLBACK_TYPE_POST_TRANSPARENT:
		return
	var buffers := render_data.get_render_scene_buffers() as RenderSceneBuffersRD
	if buffers == null:
		return
	var size := buffers.get_internal_size()
	if size.x <= 0 or size.y <= 0:
		return
	var depth := buffers.get_texture("render_buffers", "depth")
	var normal_roughness := buffers.get_texture("forward_clustered", "normal_roughness")
	if not depth.is_valid() or not normal_roughness.is_valid():
		return
	for view in range(buffers.get_view_count()):
		var color := buffers.get_color_layer(view)
		if not color.is_valid():
			continue
		var uniforms := [
			_image(0, color),
			_sampled(1, depth),
			_sampled(2, normal_roughness),
		]
		var set := UniformSetCacheRD.get_cache(shader, 0, uniforms)
		var pc := PackedFloat32Array([
			float(size.x), float(size.y),
			detail_strength, separation_strength,
			depth_strength, normal_strength, 0.0, 0.0
		])
		var list := rd.compute_list_begin()
		rd.compute_list_bind_compute_pipeline(list, pipeline)
		rd.compute_list_bind_uniform_set(list, set, 0)
		rd.compute_list_set_push_constant(list, pc.to_byte_array(), 32)
		rd.compute_list_dispatch(list, int((size.x + 7) / 8), int((size.y + 7) / 8), 1)
		rd.compute_list_end()

func diagnostic_contract() -> Dictionary:
	return {
		"renderer": "forward_plus",
		"live_inputs": ["color_hdr", "depth", "normal_roughness"],
		"live_operations": ["boundary", "detail_budget", "form_separation", "composite"],
		"requested_but_not_live": ["motion_vector", "object_id", "temporal_history"],
		"temporal": false
	}

func _notification(what: int) -> void:
	if what != NOTIFICATION_PREDELETE or rd == null:
		return
	if sampler.is_valid():
		rd.free_rid(sampler)
	if pipeline.is_valid():
		rd.free_rid(pipeline)
	if shader.is_valid():
		rd.free_rid(shader)
