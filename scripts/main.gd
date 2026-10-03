extends Node3D
var player:CharacterBody3D
var camera:Camera3D
var gate:Node3D
var crystal:MeshInstance3D
var log_label:Label
var enemies:Array[Node3D]=[]
var gate_triggered:=false
var gate_open:=false
var zoom_size:=15.0

func _ready()->void:
 build_world(); build_player(); build_camera(); build_hud(); spawn_guardians()
 log_event("UMS runtime ready"); log_event("WASD move / Q E zoom")

func _process(delta:float)->void:
 if Input.is_action_pressed("zoom_in"): zoom_size=max(5.0,zoom_size-delta*8.0)
 if Input.is_action_pressed("zoom_out"): zoom_size=min(22.0,zoom_size+delta*8.0)
 camera.size=lerp(camera.size,zoom_size,delta*7.0)
 camera.global_position=player.global_position+Vector3(9,12,9)
 camera.look_at(player.global_position,Vector3.UP)
 if not gate_triggered and player.global_position.x>3.0:
  gate_triggered=true; log_event("EVENT entered ancient_gate")
  log_event("CONDITION guardians_alive == 0 : false")
 if gate_triggered and not gate_open and enemies.is_empty(): open_gate()

func _physics_process(_delta:float)->void:
 var input:=Input.get_vector("move_left","move_right","move_up","move_down")
 player.velocity=Vector3(input.x,0,input.y)*5.5; player.move_and_slide()
 if input.length()>0.1: player.rotation.y=lerp_angle(player.rotation.y,atan2(input.x,input.y),0.25)

func build_world()->void:
 var sun:=DirectionalLight3D.new(); sun.rotation_degrees=Vector3(-55,-35,0); sun.light_energy=1.35; sun.shadow_enabled=true; add_child(sun)
 var env:=WorldEnvironment.new(); var e:=Environment.new(); e.background_mode=Environment.BG_COLOR; e.background_color=Color("#b9d6d1"); e.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR; e.ambient_light_color=Color("#b8cbb4"); e.ambient_light_energy=0.8; env.environment=e; add_child(env)
 add_box(Vector3(0,-0.35,0),Vector3(24,0.7,18),Color("#91a66d"))
 for p in [Vector3(-7,0.5,-5),Vector3(-6,0.5,5),Vector3(7,0.5,-5),Vector3(7,0.5,5)]: add_ruin(p)
 for i in range(10): add_box(Vector3(-10.0+float(i)*2.2,0.05,-1),Vector3(1.7,0.12,1.7),Color("#d0c49b"))
 gate=Node3D.new(); gate.position=Vector3(5,0,0); add_child(gate)
 var left:=box_mesh(Vector3(0.8,4,1),Color("#66736a")); var right:=box_mesh(Vector3(0.8,4,1),Color("#66736a"))
 left.position=Vector3(0,2,-2); right.position=Vector3(0,2,2); gate.add_child(left); gate.add_child(right)
 var bar:=box_mesh(Vector3(0.8,0.8,3.2),Color("#35414a")); bar.position=Vector3(0,1.3,0); bar.name="Barrier"; gate.add_child(bar)
 crystal=MeshInstance3D.new(); var cm:=SphereMesh.new(); cm.radius=0.65; cm.height=1.3; crystal.mesh=cm; crystal.position=Vector3(8,0.8,0); crystal.material_override=material(Color("#70d9ff"),Color("#3cbcff")); add_child(crystal)

func build_player()->void:
 player=CharacterBody3D.new(); player.position=Vector3(-7,0.9,0)
 var body:=MeshInstance3D.new(); var cap:=CapsuleMesh.new(); cap.radius=0.48; cap.height=1.7; body.mesh=cap; body.material_override=material(Color("#f2c7b5"),Color("#000000")); player.add_child(body)
 var cape:=box_mesh(Vector3(0.8,1,0.18),Color("#5d497e")); cape.position=Vector3(0,0.15,0.42); player.add_child(cape)
 var cs:=CollisionShape3D.new(); var sh:=CapsuleShape3D.new(); sh.radius=0.45; sh.height=1.7; cs.shape=sh; player.add_child(cs); add_child(player)

func build_camera()->void:
 camera=Camera3D.new(); camera.projection=Camera3D.PROJECTION_ORTHOGONAL; camera.size=zoom_size; camera.current=true; add_child(camera)

func build_hud()->void:
 var layer:=CanvasLayer.new(); add_child(layer)
 var panel:=ColorRect.new(); panel.position=Vector2(20,20); panel.size=Vector2(430,120); panel.color=Color(0.02,0.04,0.06,0.82); layer.add_child(panel)
 var title:=Label.new(); title.position=Vector2(36,32); title.text="AETHERIUS // UMS SANDBOX\n3D SPACE x 2D-STYLE MATERIAL\nWASD move | Q/E camera scale"; title.add_theme_font_size_override("font_size",18); layer.add_child(title)
 log_label=Label.new(); log_label.position=Vector2(36,155); log_label.size=Vector2(600,190); log_label.add_theme_font_size_override("font_size",14); layer.add_child(log_label)

func spawn_guardians()->void:
 for z in [-2.0,2.0]:
  var enemy:=box_mesh(Vector3(0.9,1.4,0.9),Color("#b14f54")); enemy.position=Vector3(2,0.7,z); add_child(enemy); enemies.append(enemy)
  var area:=Area3D.new(); var cs:=CollisionShape3D.new(); var sh:=SphereShape3D.new(); sh.radius=1.15; cs.shape=sh; area.add_child(cs); enemy.add_child(area)
  area.body_entered.connect(func(body):
   if body==player and is_instance_valid(enemy):
    enemies.erase(enemy); enemy.queue_free(); log_event("ACTION guardian defeated")
    if gate_triggered: log_event("CONDITION guardians_alive == 0 : "+str(enemies.is_empty()))
  )

func open_gate()->void:
 gate_open=true; gate.get_node("Barrier").visible=false; crystal.material_override=material(Color("#c97cff"),Color("#b23cff")); log_event("ACTION open_gate + activate_crystal"); log_event("CHANGESET applied")

func add_ruin(pos:Vector3)->void:
 add_box(pos,Vector3(1.1,2.2,1.1),Color("#707c69")); add_box(pos+Vector3(0,1.3,0),Vector3(1.5,0.35,1.5),Color("#9aa17c"))

func add_box(pos:Vector3,size:Vector3,color:Color)->MeshInstance3D:
 var n:=box_mesh(size,color); n.position=pos; add_child(n); return n

func box_mesh(size:Vector3,color:Color)->MeshInstance3D:
 var n:=MeshInstance3D.new(); var m:=BoxMesh.new(); m.size=size; n.mesh=m; n.material_override=material(color,Color("#000000")); return n

func material(color:Color,emission:Color)->StandardMaterial3D:
 var m:=StandardMaterial3D.new(); m.albedo_color=color; m.roughness=0.9
 if emission!=Color("#000000"): m.emission_enabled=true; m.emission=emission; m.emission_energy_multiplier=0.35
 return m

func log_event(text:String)->void:
 if not log_label: return
 var lines:=log_label.text.split("\n"); lines.append("> "+text)
 while lines.size()>8: lines.remove_at(0)
 log_label.text="\n".join(lines)
