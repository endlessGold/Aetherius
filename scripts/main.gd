extends Node3D

const TERRAIN_SHADER = preload("res://shaders/terrain_art.gdshader")
const BLUEPRINT_PATH = "res://art/blueprints/anime_clear_day.json"

var art_blueprint: AnimeBlueprint
var render_pipeline := AnimeRenderPipeline.new()

var terrain: MeshInstance3D
var terrain_material: ShaderMaterial
var camera: Camera3D
var sun: DirectionalLight3D
var environment: Environment
var controls := {}
var seed_value := 1337
var terrain_size := 34.0
var resolution := 72
var height_scale := 5.2
var frequency := 0.075
var ridge_strength := 0.38
var terrace_strength := 0.12
var scatter_root: Node3D

func _ready() -> void:
	art_blueprint = AnimeBlueprint.new()
	art_blueprint.load_from_path(BLUEPRINT_PATH)
	_apply_world_blueprint()
	_build_environment()
	_build_terrain()
	_build_scatter()
	_build_camera()
	_build_editor()

func _process(delta: float) -> void:
	if Input.is_action_pressed("zoom_in"):
		camera.size=max(10.0,camera.size-delta*12.0)
	if Input.is_action_pressed("zoom_out"):
		camera.size=min(42.0,camera.size+delta*12.0)

func _hash(x: int, z: int, seed: int) -> float:
	var n = x*374761393 + z*668265263 + seed*69069
	n = (n ^ (n >> 13))*1274126177
	return float(n & 0x7fffffff)/2147483647.0

func _noise2(x: float, z: float) -> float:
	var xi=int(floor(x)); var zi=int(floor(z))
	var tx=x-float(xi); var tz=z-float(zi)
	tx=tx*tx*(3.0-2.0*tx); tz=tz*tz*(3.0-2.0*tz)
	var a=lerp(_hash(xi,zi,seed_value),_hash(xi+1,zi,seed_value),tx)
	var b=lerp(_hash(xi,zi+1,seed_value),_hash(xi+1,zi+1,seed_value),tx)
	return lerp(a,b,tz)

func _fbm(x: float,z: float) -> float:
	var total=0.0; var amp=0.55; var freq=1.0; var norm=0.0
	for i in range(5):
		total += _noise2(x*freq,z*freq)*amp
		norm += amp; amp*=0.5; freq*=2.03
	return total/norm

func _height(x: float,z: float) -> float:
	var n=_fbm(x*frequency,z*frequency)
	var ridge=1.0-abs(2.0*n-1.0)
	var h=lerp(n,ridge,ridge_strength)
	if terrace_strength>0.001:
		var stepped=floor(h*7.0)/7.0
		h=lerp(h,stepped,terrace_strength)
	var edge=max(abs(x),abs(z))/(terrain_size*0.5)
	return (h-0.48)*height_scale - smoothstep(0.72,1.0,edge)*1.8

func _build_terrain() -> void:
	if terrain: terrain.queue_free()
	terrain=MeshInstance3D.new(); terrain.name="TerrainArtwork"; add_child(terrain)
	var st=SurfaceTool.new(); st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var step=terrain_size/float(resolution)
	for z in range(resolution):
		for x in range(resolution):
			var x0=-terrain_size*0.5+x*step; var x1=x0+step
			var z0=-terrain_size*0.5+z*step; var z1=z0+step
			var p00=Vector3(x0,_height(x0,z0),z0); var p10=Vector3(x1,_height(x1,z0),z0)
			var p01=Vector3(x0,_height(x0,z1),z1); var p11=Vector3(x1,_height(x1,z1),z1)
			for p in [p00,p01,p10,p10,p01,p11]: st.set_uv(Vector2(p.x,p.z)); st.add_vertex(p)
	st.generate_normals(); terrain.mesh=st.commit()
	terrain_material=ShaderMaterial.new(); terrain_material.shader=TERRAIN_SHADER
	terrain.material_override=terrain_material
	if art_blueprint: render_pipeline.apply_terrain(terrain_material, art_blueprint)

func _build_environment() -> void:
	sun=DirectionalLight3D.new(); sun.rotation_degrees=Vector3(-52,-38,0); sun.light_energy=1.0; sun.shadow_enabled=true; add_child(sun)
	var we=WorldEnvironment.new(); environment=Environment.new()
	environment.background_mode=Environment.BG_COLOR; environment.background_color=Color("#b7d0d0")
	environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color=Color("#b9c6b1"); environment.ambient_light_energy=0.72
	environment.tonemap_mode=Environment.TONE_MAPPER_FILMIC
	we.environment=environment; add_child(we)
	if art_blueprint: render_pipeline.apply_environment(sun, environment, art_blueprint)

func _build_camera() -> void:
	camera=Camera3D.new(); camera.projection=Camera3D.PROJECTION_ORTHOGONAL; camera.size=27.0
	camera.position=Vector3(19,19,19); camera.look_at(Vector3(0,1,0)); camera.current=true; add_child(camera)

func _build_scatter() -> void:
	if scatter_root: scatter_root.queue_free()
	scatter_root=Node3D.new(); scatter_root.name="NatureScatter"; add_child(scatter_root)
	var rng=RandomNumberGenerator.new(); rng.seed=seed_value
	for i in range(34):
		var x=rng.randf_range(-14.0,14.0); var z=rng.randf_range(-14.0,14.0); var y=_height(x,z)
		var trunk=MeshInstance3D.new(); var tm=CylinderMesh.new(); tm.top_radius=0.12; tm.bottom_radius=0.18; tm.height=1.4
		trunk.mesh=tm; trunk.position=Vector3(x,y+0.7,z); scatter_root.add_child(trunk)
		var crown=MeshInstance3D.new(); var cm=SphereMesh.new(); cm.radius=rng.randf_range(0.55,0.95); cm.height=cm.radius*1.8
		crown.mesh=cm; crown.position=Vector3(x,y+1.7,z); var mat=StandardMaterial3D.new(); mat.albedo_color=Color("#587c46"); mat.roughness=1.0
		crown.material_override=mat; scatter_root.add_child(crown)

func _make_panel_style(color: Color, border: Color) -> StyleBoxFlat:
	var style=StyleBoxFlat.new()
	style.bg_color=color
	style.border_color=border
	style.set_border_width_all(1)
	style.corner_radius_top_left=6; style.corner_radius_top_right=6
	style.corner_radius_bottom_left=6; style.corner_radius_bottom_right=6
	style.content_margin_left=12; style.content_margin_right=12
	style.content_margin_top=10; style.content_margin_bottom=10
	return style

func _slider(parent: VBoxContainer,label_text:String,min_v:float,max_v:float,value:float,step:float,callback:Callable) -> void:
	var label=Label.new(); label.text=label_text; label.modulate=Color("#b7c6d6"); parent.add_child(label)
	var row=HBoxContainer.new(); parent.add_child(row)
	var slider=HSlider.new(); slider.min_value=min_v; slider.max_value=max_v; slider.value=value; slider.step=step; slider.size_flags_horizontal=Control.SIZE_EXPAND_FILL; row.add_child(slider)
	var value_label=Label.new(); value_label.text="%.2f"%value; value_label.custom_minimum_size.x=48; row.add_child(value_label)
	slider.value_changed.connect(func(v): value_label.text="%.2f"%v; callback.call(v))

func _section(parent: VBoxContainer, text: String) -> void:
	var label=Label.new(); label.text=text.to_upper(); label.modulate=Color("#6fd6ff"); label.add_theme_font_size_override("font_size",12); parent.add_child(label)
	var line=HSeparator.new(); parent.add_child(line)

func _build_editor() -> void:
	var layer=CanvasLayer.new(); add_child(layer)
	var root=Control.new(); root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT); layer.add_child(root)

	var top=PanelContainer.new(); top.set_anchors_preset(Control.PRESET_TOP_WIDE); top.offset_bottom=54; top.add_theme_stylebox_override("panel",_make_panel_style(Color("#101822ee"),Color("#26384a"))); root.add_child(top)
	var top_row=HBoxContainer.new(); top_row.add_theme_constant_override("separation",14); top.add_child(top_row)
	var brand=Label.new(); brand.text="AETHERIUS  /  ARTWORK STUDIO"; brand.add_theme_font_size_override("font_size",19); brand.custom_minimum_size.x=300; top_row.add_child(brand)
	for name in ["TERRAIN","MATERIAL","FOLIAGE","WATER / FX","LIGHTING"]:
		var tab=Button.new(); tab.text=name; tab.flat=true; top_row.add_child(tab)
	var spacer=Control.new(); spacer.size_flags_horizontal=Control.SIZE_EXPAND_FILL; top_row.add_child(spacer)
	var seed_label=Label.new(); seed_label.text="SEED  "+str(seed_value); top_row.add_child(seed_label)
	var randomize=Button.new(); randomize.text="RANDOMIZE"; top_row.add_child(randomize)
	randomize.pressed.connect(func(): seed_value=randi(); seed_label.text="SEED  "+str(seed_value); _rebuild_geometry())

	var left=PanelContainer.new(); left.position=Vector2(14,68); left.size=Vector2(230,540); left.add_theme_stylebox_override("panel",_make_panel_style(Color("#101822e8"),Color("#26384a"))); root.add_child(left)
	var layers=VBoxContainer.new(); layers.add_theme_constant_override("separation",7); left.add_child(layers)
	var lt=Label.new(); lt.text="SCENE LAYERS"; lt.add_theme_font_size_override("font_size",16); layers.add_child(lt)
	for item in ["▾ ENVIRONMENT","   Terrain Surface","   Rock / Cliff Blend","▾ NATURE","   Trees / Canopy","   Ground Foliage","▾ ATMOSPHERE","   Sun & Shadow","   Ambient / Haze"]:
		var b=Button.new(); b.text=item; b.alignment=HORIZONTAL_ALIGNMENT_LEFT; b.flat=true; layers.add_child(b)
	var add=Button.new(); add.text="+ ADD LAYER"; layers.add_child(add)

	var right=PanelContainer.new(); right.set_anchors_preset(Control.PRESET_RIGHT_WIDE); right.offset_left=-330; right.offset_top=68; right.offset_right=-14; right.offset_bottom=-18; right.add_theme_stylebox_override("panel",_make_panel_style(Color("#101822ee"),Color("#26384a"))); root.add_child(right)
	var inspector=VBoxContainer.new(); inspector.add_theme_constant_override("separation",6); right.add_child(inspector)
	var it=Label.new(); it.text="TERRAIN INSPECTOR"; it.add_theme_font_size_override("font_size",17); inspector.add_child(it)
	var hint=Label.new(); hint.text="Procedural landform / live preview"; hint.modulate=Color("#8192a3"); inspector.add_child(hint)
	_section(inspector,"Geometry")
	_slider(inspector,"Height",0.5,10.0,height_scale,0.1,func(v): height_scale=v; _rebuild_geometry())
	_slider(inspector,"Landform Scale",0.025,0.18,frequency,0.005,func(v): frequency=v; _rebuild_geometry())
	_slider(inspector,"Ridge",0.0,1.0,ridge_strength,0.01,func(v): ridge_strength=v; _rebuild_geometry())
	_slider(inspector,"Terracing",0.0,0.85,terrace_strength,0.01,func(v): terrace_strength=v; _rebuild_geometry())
	_section(inspector,"Material Layers")
	_slider(inspector,"Macro Variation",0.0,0.4,0.12,0.01,func(v): terrain_material.set_shader_parameter("macro_strength",v))
	_slider(inspector,"Rock Slope",0.1,0.9,0.55,0.01,func(v): terrain_material.set_shader_parameter("slope_start",v))
	_slider(inspector,"Shadow Bands",2.0,7.0,4.0,1.0,func(v): terrain_material.set_shader_parameter("shadow_steps",v))
	_section(inspector,"Lighting")
	_slider(inspector,"Sun Energy",0.15,2.0,1.0,0.05,func(v): sun.light_energy=v)
	_slider(inspector,"Atmosphere",0.1,1.5,0.72,0.02,func(v): environment.ambient_light_energy=v)
	var regen=Button.new(); regen.text="REGENERATE NATURE"; inspector.add_child(regen); regen.pressed.connect(_build_scatter)

	var bottom=PanelContainer.new(); bottom.set_anchors_preset(Control.PRESET_BOTTOM_WIDE); bottom.offset_left=258; bottom.offset_right=-344; bottom.offset_top=-54; bottom.offset_bottom=-14; bottom.add_theme_stylebox_override("panel",_make_panel_style(Color("#101822dd"),Color("#26384a"))); root.add_child(bottom)
	var status=HBoxContainer.new(); bottom.add_child(status)
	var s=Label.new(); s.text="LIVE PREVIEW   •   72×72 TERRAIN   •   Q/E ZOOM"; status.add_child(s)
	var fill=Control.new(); fill.size_flags_horizontal=Control.SIZE_EXPAND_FILL; status.add_child(fill)
	var save=Button.new(); save.text="SAVE PRESET"; status.add_child(save)
	var bake=Button.new(); bake.text="BAKE / EXPORT"; status.add_child(bake)

func _apply_world_blueprint() -> void:
	if not art_blueprint: return
	var world := art_blueprint.section("world_art")
	seed_value = int(world.get("terrain_seed", seed_value))
	height_scale = float(world.get("height", height_scale))
	frequency = float(world.get("frequency", frequency))
	ridge_strength = float(world.get("ridge", ridge_strength))
	terrace_strength = float(world.get("terrace", terrace_strength))

func _rebuild_geometry() -> void:
	_build_terrain()
	_build_scatter()
