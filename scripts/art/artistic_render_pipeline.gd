class_name ArtisticRenderPipeline
extends RefCounted

func apply_terrain(material: ShaderMaterial, blueprint: ArtisticBlueprint) -> void:
	var color := blueprint.section("color_script")
	var interp := blueprint.section("interpretation")
	var lighting := blueprint.section("lighting")
	material.set_shader_parameter("shadow_tint", Color.from_string(str(color.get("shadow_hue_bias","#536b78")), Color("#536b78")))
	material.set_shader_parameter("light_tint", Color.from_string(str(color.get("light_hue_bias","#fff0c7")), Color("#fff0c7")))
	material.set_shader_parameter("distance_tint", Color.from_string(str(color.get("distance_hue_bias","#9fc4cf")), Color("#9fc4cf")))
	var masses: Array = color.get("value_masses",[0.22,0.50,0.78])
	if masses.size() >= 3:
		material.set_shader_parameter("value_masses", Vector3(float(masses[0]),float(masses[1]),float(masses[2])))
	var normal: Dictionary = interp.get("normal",{})
	material.set_shader_parameter("micro_detail_weight", float(normal.get("micro",0.12)))
	var shadow: Dictionary = interp.get("shadow",{})
	material.set_shader_parameter("shadow_soft_design", float(shadow.get("simplify",0.45)))
	material.set_shader_parameter("secondary_shadow", float(shadow.get("secondary",0.18)))
	material.set_shader_parameter("rim_strength", float(lighting.get("rim_strength",0.14)))

func apply_environment(sun: DirectionalLight3D, environment: Environment, blueprint: ArtisticBlueprint) -> void:
	var color := blueprint.section("color_script")
	var lighting := blueprint.section("lighting")
	sun.light_color = Color.from_string(str(color.get("light_hue_bias","#fff0c7")), Color.WHITE)
	var physical_weight := float(lighting.get("physical_weight",0.65))
	var artistic_weight := float(lighting.get("artistic_weight",0.35))
	environment.ambient_light_energy = 0.55 + artistic_weight * 0.45
	sun.light_energy = 0.75 + physical_weight * 0.45
