extends Node3D

const TERRAIN_SHADER = preload("res://shaders/terrain_art.gdshader")

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

func _build_environment() -> void:
	sun=DirectionalLight3D.new(); sun.rotation_degrees=Vector3(-52,-38,0); sun.light_energy=1.0; sun.shadow_enabled=true; add_child(sun)
	var we=WorldEnvironment.new(); environment=Environment.new()
	environment.background_mode=Environment.BG_COLOR; environment.background_color=Color("#b7d0d0")
	environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color=Color("#b9c6b1"); environment.ambient_light_energy=0.72
	environment.tonemap_mode=Environment.TONE_MAPPER_FILMIC
	we.environment=environment; add_child(we)

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

func _slider(parent: VBoxContainer,label_text:String,min_v:float,max_v:float,value:float,step:float,callback:Callable) -> void:
	var row=HBoxContainer.new(); parent.add_child(row)
	var label=Label.new(); label.text=label_text; label.custom_minimum_size.x=145; row.add_child(label)
	var slider=HSlider.new(); slider.min_value=min_v; slider.max_value=max_v; slider.value=value; slider.step=step; slider.custom_minimum_size.x=210; row.add_child(slider)
	var value_label=Label.new(); value_label.text=str(value); value_label.custom_minimum_size.x=55; row.add_child(value_label)
	slider.value_changed.connect(func(v): value_label.text="%.2f"%v; callback.call(v))

func _build_editor() -> void:
	var layer=CanvasLayer.new(); add_child(layer)
	var panel=PanelContainer.new(); panel.position=Vector2(18,18); panel.custom_minimum_size=Vector2(460,0); layer.add_child(panel)
	var box=VBoxContainer.new(); box.add_theme_constant_override("separation",8); panel.add_child(box)
	var title=Label.new(); title.text="AETHERIUS // TERRAIN ART LAB"; title.add_theme_font_size_override("font_size",22); box.add_child(title)
	var sub=Label.new(); sub.text="Terrain → Material → Nature → Lighting\nQ/E zoom · live procedural preview"; box.add_child(sub)
	_slider(box,"Terrain Height",0.5,10.0,height_scale,0.1,func(v): height_scale=v; _rebuild_geometry())
	_slider(box,"Landform Scale",0.025,0.18,frequency,0.005,func(v): frequency=v; _rebuild_geometry())
	_slider(box,"Ridge",0.0,1.0,ridge_strength,0.01,func(v): ridge_strength=v; _rebuild_geometry())
	_slider(box,"Terracing",0.0,0.85,terrace_strength,0.01,func(v): terrace_strength=v; _rebuild_geometry())
	_slider(box,"Macro Variation",0.0,0.4,0.12,0.01,func(v): terrain_material.set_shader_parameter("macro_strength",v))
	_slider(box,"Rock Slope",0.1,0.9,0.55,0.01,func(v): terrain_material.set_shader_parameter("slope_start",v))
	_slider(box,"Shadow Bands",2.0,7.0,4.0,1.0,func(v): terrain_material.set_shader_parameter("shadow_steps",v))
	_slider(box,"Sun Energy",0.15,2.0,1.0,0.05,func(v): sun.light_energy=v)
	_slider(box,"Atmosphere",0.1,1.5,0.72,0.02,func(v): environment.ambient_light_energy=v)
	var buttons=HBoxContainer.new(); box.add_child(buttons)
	var randomize=Button.new(); randomize.text="Randomize Terrain"; buttons.add_child(randomize)
	randomize.pressed.connect(func(): seed_value=randi(); _rebuild_geometry())
	var nature=Button.new(); nature.text="Regenerate Nature"; buttons.add_child(nature)
	nature.pressed.connect(_build_scatter)
	var note=Label.new(); note.text="v0: geometry + slope blend + macro variation + foliage scatter + lighting"; box.add_child(note)

func _rebuild_geometry() -> void:
	_build_terrain()
	_build_scatter()
