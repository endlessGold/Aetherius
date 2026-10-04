class_name AnimeRenderCompositor
extends Node
const OCCLUSION_SHADER=preload("res://shaders/stylized_occlusion.gdshader")
const COMPOSITE_SHADER=preload("res://shaders/anime_composite.gdshader")
var layer:CanvasLayer
var occlusion_rect:ColorRect
var composite_rect:ColorRect
func install(root:Node)->void:
	if layer:return
	layer=CanvasLayer.new();layer.name="AnimeRenderCompositor";layer.layer=50;root.add_child(layer)
	occlusion_rect=_pass_rect("StylizedOcclusion",OCCLUSION_SHADER);composite_rect=_pass_rect("AnimeComposite",COMPOSITE_SHADER)
	layer.add_child(occlusion_rect);layer.add_child(composite_rect)
func _pass_rect(label:String,shader:Shader)->ColorRect:
	var rect=ColorRect.new();rect.name=label;rect.mouse_filter=Control.MOUSE_FILTER_IGNORE;rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var material=ShaderMaterial.new();material.shader=shader;rect.material=material;return rect
func set_enabled(value:bool)->void:
	if layer:layer.visible=value
func configure_occlusion(radius:float,strength:float,micro_suppression:float)->void:
	if not occlusion_rect:return
	var m:=occlusion_rect.material as ShaderMaterial;m.set_shader_parameter("radius",radius);m.set_shader_parameter("strength",strength);m.set_shader_parameter("micro_suppression",micro_suppression)
func capture_metadata()->Dictionary:
	return {"buffers":["depth","screen_color"],"semantic_passes":["stylized_occlusion","anime_composite"],"temporal":{"status":"contract_ready","motion_vectors":"requires Forward+ compositor/RD backend","object_ids":"requires explicit ID render target"}}
