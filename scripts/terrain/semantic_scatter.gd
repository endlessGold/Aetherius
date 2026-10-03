class_name SemanticScatter
extends RefCounted

func populate(root:Node3D,generator:TerrainGenerator,seed:int)->void:
	for child in root.get_children(): child.queue_free()
	var rng=RandomNumberGenerator.new(); rng.seed=seed
	for i in range(58):
		var x=rng.randf_range(-18.0,18.0); var z=rng.randf_range(-18.0,18.0)
		if abs(x+4.0)<4.2 and abs(z)<8.0: continue
		if Vector2(x-10.0,z-9.0).length()<5.0: continue
		var y=generator.height_at(x,z)
		var trunk=MeshInstance3D.new(); var tm=CylinderMesh.new(); tm.top_radius=.10; tm.bottom_radius=.17; tm.height=rng.randf_range(1.1,1.8)
		trunk.mesh=tm; trunk.position=Vector3(x,y+tm.height*.5,z)
		var bark=StandardMaterial3D.new(); bark.albedo_color=Color("#544a39"); bark.roughness=1.0; trunk.material_override=bark; root.add_child(trunk)
		for j in range(rng.randi_range(1,3)):
			var crown=MeshInstance3D.new(); var cm=SphereMesh.new(); cm.radius=rng.randf_range(.55,1.0); cm.height=cm.radius*1.45
			crown.mesh=cm; crown.position=Vector3(x+rng.randf_range(-.35,.35),y+1.35+j*.35,z+rng.randf_range(-.35,.35))
			var leaf=StandardMaterial3D.new(); leaf.albedo_color=Color("#54784b").lerp(Color("#7e9655"),rng.randf_range(0.0,.5)); leaf.roughness=1.0
			crown.material_override=leaf; root.add_child(crown)
	for i in range(32):
		var x=rng.randf_range(-19.0,19.0); var z=rng.randf_range(-19.0,19.0)
		var y=generator.height_at(x,z)
		var rock=MeshInstance3D.new(); var mesh=SphereMesh.new(); mesh.radius=rng.randf_range(.25,.8); mesh.height=mesh.radius*rng.randf_range(.8,1.4)
		rock.mesh=mesh; rock.scale=Vector3(rng.randf_range(.8,1.5),rng.randf_range(.55,1.0),rng.randf_range(.8,1.4)); rock.position=Vector3(x,y,z)
		var mat=StandardMaterial3D.new(); mat.albedo_color=Color("#69706b"); mat.roughness=.92; rock.material_override=mat; root.add_child(rock)
