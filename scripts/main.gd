extends Node3D

var player: CharacterBody3D
var camera: Camera3D
var gate: Node3D
var crystal: MeshInstance3D
var log_label: Label
var objective_label: Label
var enemies: Array[Node3D] = []
var zoom_size := 15.0
var runtime: Node
var world_state := {}

func _ready() -> void:
	build_world()
	build_player()
	build_camera()
	build_hud()
	spawn_guardians()
	runtime = preload("res://scripts/ums_runtime.gd").new()
	add_child(runtime)
	runtime.configure(self, "res://ums/map_definition.json")
	runtime.runtime_log.connect(log_event)
	log_event("UMS runtime ready")
	log_event("Find the gate and defeat its guardians")

func _process(delta: float) -> void:
	if Input.is_action_pressed("zoom_in"): zoom_size = max(5.0, zoom_size - delta * 8.0)
	if Input.is_action_pressed("zoom_out"): zoom_size = min(22.0, zoom_size + delta * 8.0)
	camera.size = lerp(camera.size, zoom_size, delta * 7.0)
	camera.global_position = player.global_position + Vector3(9, 12, 9)
	camera.look_at(player.global_position, Vector3.UP)
	if player.global_position.x > 3.0 and not world_state.get("gate_seen", false):
		world_state["gate_seen"] = true
		runtime.emit_game_event("entity_entered", {"area":"ancient_gate"})
	update_objective()

func _physics_process(_delta: float) -> void:
	var input := Input.get_vector("move_left","move_right","move_up","move_down")
	player.velocity = Vector3(input.x,0,input.y) * 5.5
	player.move_and_slide()
	if input.length() > 0.1: player.rotation.y = lerp_angle(player.rotation.y, atan2(input.x,input.y), 0.25)

func build_world() -> void:
	var sun := DirectionalLight3D.new(); sun.rotation_degrees=Vector3(-55,-35,0); sun.light_energy=1.35; sun.shadow_enabled=true; add_child(sun)
	var env:=WorldEnvironment.new(); var e:=Environment.new(); e.background_mode=Environment.BG_COLOR; e.background_color=Color("#b9d6d1"); e.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR; e.ambient_light_color=Color("#b8cbb4"); e.ambient_light_energy=0.8; env.environment=e; add_child(env)
	add_box(Vector3(0,-0.35,0),Vector3(30,0.7,22),Color("#91a66d"))
	for p in [Vector3(-9,0.5,-7),Vector3(-8,0.5,7),Vector3(8,0.5,-7),Vector3(9,0.5,7),Vector3(0,0.5,-8)]: add_ruin(p)
	for i in range(12): add_box(Vector3(-11.0+float(i)*2.0,0.05,-1),Vector3(1.55,0.12,1.55),Color("#d0c49b"))
	for p in [Vector3(-5,0.25,-5),Vector3(-3,0.25,6),Vector3(3,0.25,-6),Vector3(10,0.25,5)]:
		add_box(p,Vector3(2.8,0.35,2.0),Color("#78905f"))
	gate=Node3D.new(); gate.position=Vector3(5,0,0); add_child(gate)
	var left:=box_mesh(Vector3(0.8,4,1),Color("#66736a")); var right:=box_mesh(Vector3(0.8,4,1),Color("#66736a"))
	left.position=Vector3(0,2,-2); right.position=Vector3(0,2,2); gate.add_child(left); gate.add_child(right)
	var bar:=box_mesh(Vector3(0.8,0.8,3.2),Color("#35414a")); bar.position=Vector3(0,1.3,0); bar.name="Barrier"; gate.add_child(bar)
	crystal=MeshInstance3D.new(); var cm:=SphereMesh.new(); cm.radius=0.65; cm.height=1.3; crystal.mesh=cm; crystal.position=Vector3(9,0.8,0); crystal.material_override=illustration_material(Color("#70d9ff"),Color("#3cbcff")); add_child(crystal)

func build_player() -> void:
	player=CharacterBody3D.new(); player.position=Vector3(-9,0.9,0)
	var body:=MeshInstance3D.new(); var cap:=CapsuleMesh.new(); cap.radius=0.48; cap.height=1.7; body.mesh=cap; body.material_override=illustration_material(Color("#f2c7b5")); player.add_child(body)
	var cape:=box_mesh(Vector3(0.8,1,0.18),Color("#5d497e")); cape.position=Vector3(0,0.15,0.42); player.add_child(cape)
	var cs:=CollisionShape3D.new(); var sh:=CapsuleShape3D.new(); sh.radius=0.45; sh.height=1.7; cs.shape=sh; player.add_child(cs); add_child(player)

func build_camera() -> void:
	camera=Camera3D.new(); camera.projection=Camera3D.PROJECTION_ORTHOGONAL; camera.size=zoom_size; camera.current=true; add_child(camera)

func build_hud() -> void:
	var layer:=CanvasLayer.new(); add_child(layer)
	var panel:=ColorRect.new(); panel.position=Vector2(20,20); panel.size=Vector2(455,120); panel.color=Color(0.02,0.04,0.06,0.82); layer.add_child(panel)
	var title:=Label.new(); title.position=Vector2(36,32); title.text="AETHERIUS // ANCIENT GATE\nExecutable UMS vertical slice\nWASD move | Q/E camera scale"; title.add_theme_font_size_override("font_size",18); layer.add_child(title)
	objective_label=Label.new(); objective_label.position=Vector2(36,150); objective_label.add_theme_font_size_override("font_size",16); layer.add_child(objective_label)
	log_label=Label.new(); log_label.position=Vector2(36,185); log_label.size=Vector2(680,190); log_label.add_theme_font_size_override("font_size",14); layer.add_child(log_label)

func spawn_guardians() -> void:
	for z in [-2.0,2.0]:
		var enemy:=box_mesh(Vector3(0.9,1.4,0.9),Color("#b14f54")); enemy.position=Vector3(2,0.7,z); add_child(enemy); enemies.append(enemy)
		var area:=Area3D.new(); var cs:=CollisionShape3D.new(); var sh:=SphereShape3D.new(); sh.radius=1.15; cs.shape=sh; area.add_child(cs); enemy.add_child(area)
		area.body_entered.connect(func(body):
			if body==player and is_instance_valid(enemy):
				enemies.erase(enemy); enemy.queue_free(); log_event("guardian defeated")
				runtime.emit_game_event("enemy_count_changed", {"group":"gate_guardians"})
		)

func get_enemy_count(group_id:String) -> int:
	if group_id=="gate_guardians": return enemies.size()
	return 0

func execute_ums_action(action:Dictionary) -> void:
	if action.has("open_gate") and action["open_gate"]=="ancient_gate":
		gate.get_node("Barrier").visible=false
	if action.has("activate") and action["activate"]=="crystal":
		crystal.material_override=illustration_material(Color("#c97cff"),Color("#b23cff"))
	if action.has("set_world_state"):
		for key in action["set_world_state"]: world_state[key]=action["set_world_state"][key]

func update_objective() -> void:
	if not objective_label: return
	if world_state.get("gate_restored",false): objective_label.text="OBJECTIVE // Gate restored"
	elif enemies.is_empty(): objective_label.text="OBJECTIVE // Approach the ancient gate"
	else: objective_label.text="OBJECTIVE // Guardians remaining: "+str(enemies.size())

func add_ruin(pos:Vector3) -> void:
	add_box(pos,Vector3(1.1,2.2,1.1),Color("#707c69")); add_box(pos+Vector3(0,1.3,0),Vector3(1.5,0.35,1.5),Color("#9aa17c"))

func add_box(pos:Vector3,size:Vector3,color:Color) -> MeshInstance3D:
	var n:=box_mesh(size,color); n.position=pos; add_child(n); return n

func box_mesh(size:Vector3,color:Color) -> MeshInstance3D:
	var n:=MeshInstance3D.new(); var m:=BoxMesh.new(); m.size=size; n.mesh=m; n.material_override=illustration_material(color); return n

func illustration_material(color:Color, emission:Color=Color(0,0,0,1)) -> ShaderMaterial:
	var mat:=ShaderMaterial.new(); mat.shader=preload("res://shaders/illustration.gdshader"); mat.set_shader_parameter("base_color",color)
	mat.set_shader_parameter("emission_color",emission); mat.set_shader_parameter("emission_strength",0.35 if emission != Color(0,0,0,1) else 0.0)
	return mat

func log_event(text:String) -> void:
	if not log_label: return
	var lines:=log_label.text.split("\n"); lines.append("> "+text)
	while lines.size()>8: lines.remove_at(0)
	log_label.text="\n".join(lines)
