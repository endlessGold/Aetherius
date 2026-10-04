extends Node3D

const TERRAIN_SHADER=preload("res://shaders/rts_terrain.gdshader")
var generator:=TerrainGenerator.new()
var scatter:=SemanticScatter.new()
var terrain:MeshInstance3D
var terrain_material:ShaderMaterial
var nature:Node3D
var camera:Camera3D
var sun:DirectionalLight3D
var artistic_mode:=true
var seed_value:=1337
var mode_label:Label
var material_resources:Dictionary
var perceptual_effect:PerceptualCompositorEffect

func _ready()->void:
	generator.seed=seed_value
	material_resources=MaterialResourceGenerator.new().generate_all()
	_build_environment()
	_build_showcase()
	_build_camera()
	_build_ui()


func _process(delta:float)->void:
	if Input.is_action_pressed("zoom_in"): camera.size=max(16.0,camera.size-delta*14.0)
	if Input.is_action_pressed("zoom_out"): camera.size=min(48.0,camera.size+delta*14.0)

func _unhandled_key_input(event:InputEvent)->void:
	if not event.pressed: return
	if event.keycode==KEY_SPACE:
		artistic_mode=!artistic_mode
		terrain_material.set_shader_parameter("artistic_mode",1.0 if artistic_mode else 0.0)
		mode_label.text="FINAL / ARTISTIC PBR + ANIME PASSES" if artistic_mode else "PHYSICAL BASELINE"
		if perceptual_effect: perceptual_effect.enabled=artistic_mode
	elif event.keycode==KEY_R:
		seed_value+=7919; generator.seed=seed_value; _build_showcase()

func _build_environment()->void:
	sun=DirectionalLight3D.new(); sun.rotation_degrees=Vector3(-54,-38,0); sun.light_energy=1.05; sun.light_color=Color("#fff0c7"); sun.shadow_enabled=true; add_child(sun)
	var world=WorldEnvironment.new(); var env=Environment.new()
	env.background_mode=Environment.BG_COLOR; env.background_color=Color("#a9cbd5")
	env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR; env.ambient_light_color=Color("#afc7b7"); env.ambient_light_energy=.72
	env.tonemap_mode=Environment.TONE_MAPPER_FILMIC; world.environment=env
	var compositor:=Compositor.new(); perceptual_effect=PerceptualCompositorEffect.new(); compositor.compositor_effects=[perceptual_effect]; world.compositor=compositor
	add_child(world)

func _build_showcase()->void:
	if terrain: terrain.queue_free()
	if nature: nature.queue_free()
	terrain=MeshInstance3D.new(); terrain.name="RTSTerrainShowcase"; terrain.mesh=generator.build_mesh(); add_child(terrain)
	terrain_material=ShaderMaterial.new(); terrain_material.shader=TERRAIN_SHADER; terrain_material.set_shader_parameter("artistic_mode",1.0 if artistic_mode else 0.0)
	terrain_material.set_shader_parameter("grass_albedo",material_resources["grass"]["albedo"])
	terrain_material.set_shader_parameter("grass_normal",material_resources["grass"]["normal"])
	terrain_material.set_shader_parameter("soil_albedo",material_resources["soil"]["albedo"])
	terrain_material.set_shader_parameter("rock_albedo",material_resources["rock"]["albedo"])
	terrain_material.set_shader_parameter("cliff_albedo",material_resources["cliff"]["albedo"])
	terrain_material.set_shader_parameter("path_albedo",material_resources["path"]["albedo"])
	terrain_material.set_shader_parameter("roughness_map",material_resources["grass"]["roughness"])
	terrain.material_override=terrain_material
	nature=Node3D.new(); nature.name="SemanticDressing"; add_child(nature); scatter.populate(nature,generator,seed_value)
	_build_water()

func _build_water()->void:
	var water=MeshInstance3D.new(); water.name="BasinWater"; var pm=PlaneMesh.new(); pm.size=Vector2(8.0,6.0); water.mesh=pm
	water.position=Vector3(10.0,generator.height_at(10,9)+.45,9.0)
	var mat=StandardMaterial3D.new(); mat.albedo_color=Color("#58a9b4"); mat.metallic=.05; mat.roughness=.28; mat.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA; mat.albedo_color.a=.88
	water.material_override=mat; nature.add_child(water)

func _build_camera()->void:
	camera=Camera3D.new(); camera.projection=Camera3D.PROJECTION_ORTHOGONAL; camera.size=34.0
	camera.position=Vector3(28,29,28); camera.look_at(Vector3(0,1,0)); camera.current=true; add_child(camera)

func _panel()->StyleBoxFlat:
	var s=StyleBoxFlat.new(); s.bg_color=Color("#101822dd"); s.border_color=Color("#385066"); s.set_border_width_all(1); s.set_corner_radius_all(7); s.content_margin_left=14; s.content_margin_right=14; s.content_margin_top=10; s.content_margin_bottom=10; return s

func _build_ui()->void:
	var layer=CanvasLayer.new(); add_child(layer)
	var root=Control.new(); root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT); layer.add_child(root)
	var top=PanelContainer.new(); top.position=Vector2(18,18); top.size=Vector2(520,92); top.add_theme_stylebox_override("panel",_panel()); root.add_child(top)
	var v=VBoxContainer.new(); top.add_child(v)
	var title=Label.new(); title.text="AETHERIUS  /  RTS TERRAIN SHOWCASE"; title.add_theme_font_size_override("font_size",20); v.add_child(title)
	mode_label=Label.new(); mode_label.text="FINAL / ARTISTIC PBR + ANIME PASSES"; mode_label.modulate=Color("#7bdcff"); v.add_child(mode_label)
	var hint=Label.new(); hint.text="SPACE compare physical/final   •   R regenerate   •   Q/E zoom"; hint.modulate=Color("#a9b6c2"); v.add_child(hint)
	var badge=PanelContainer.new(); badge.position=Vector2(18,126); badge.size=Vector2(235,105); badge.add_theme_stylebox_override("panel",_panel()); root.add_child(badge)
	var info=Label.new(); info.text="TERRAIN GRAMMAR\n• upper plateau + cliff\n• authored ramp + path\n• basin + semantic clusters"; badge.add_child(info)
