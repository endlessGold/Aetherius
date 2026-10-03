@tool
class_name PerceptualCompositorEffect
extends CompositorEffect

var rd:RenderingDevice
var shader:RID
var pipeline:RID
var ready:=false
var detail_strength:=0.42
var separation_strength:=0.55

func _init()->void:
	effect_callback_type=EFFECT_CALLBACK_TYPE_POST_TRANSPARENT
	needs_motion_vectors=true
	needs_normal_roughness=true
	access_resolved_color=true
	access_resolved_depth=true
	rd=RenderingServer.get_rendering_device()
	if rd==null:return
	var file:RDShaderFile=load("res://rendering/perceptual/compute/perceptual_composite.glsl")
	if file==null:return
	shader=rd.shader_create_from_spirv(file.get_spirv())
	if not shader.is_valid():return
	pipeline=rd.compute_pipeline_create(shader)
	ready=pipeline.is_valid()

func _render_callback(callback_type:int,render_data:RenderData)->void:
	if not ready or callback_type!=EFFECT_CALLBACK_TYPE_POST_TRANSPARENT:return
	var buffers:=render_data.get_render_scene_buffers() as RenderSceneBuffersRD
	if buffers==null:return
	var size:=buffers.get_internal_size()
	if size.x<=0 or size.y<=0:return
	# Requesting these buffers is intentional even before all perception passes consume them.
	var depth:=buffers.get_texture("render_buffers","depth")
	var normal_roughness:=buffers.get_texture("forward_clustered","normal_roughness")
	var velocity:=buffers.get_velocity_texture()
	if not depth.is_valid() or not normal_roughness.is_valid() or not velocity.is_valid():return
	for view in range(buffers.get_view_count()):
		var color:=buffers.get_color_layer(view)
		var u:=RDUniform.new();u.uniform_type=RenderingDevice.UNIFORM_TYPE_IMAGE;u.binding=0;u.add_id(color)
		var set:=UniformSetCacheRD.get_cache(shader,0,[u])
		var pc:=PackedFloat32Array([float(size.x),float(size.y),detail_strength,separation_strength])
		var list:=rd.compute_list_begin()
		rd.compute_list_bind_compute_pipeline(list,pipeline)
		rd.compute_list_bind_uniform_set(list,set,0)
		rd.compute_list_set_push_constant(list,pc.to_byte_array(),16)
		rd.compute_list_dispatch(list,(size.x+7)/8,(size.y+7)/8,1)
		rd.compute_list_end()

func diagnostic_contract()->Dictionary:
	return {"renderer":"forward_plus","evidence":["color_hdr","depth","normal_roughness","motion_vector"],"fields":["complexity","detail_budget","form_separation"],"temporal":{"motion_vectors":true,"object_id":"next auxiliary pass"}}
