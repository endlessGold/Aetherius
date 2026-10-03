class_name AnimeRenderPipeline
extends RefCounted

func apply_terrain(material: ShaderMaterial, blueprint: AnimeBlueprint) -> void:
	var style := blueprint.section("art_style")
	var terrain: Dictionary = blueprint.section("materials").get("terrain", {})
	_set_color(material, "low_color", terrain.get("low_color", "#365d36"))
	_set_color(material, "mid_color", terrain.get("mid_color", "#76964c"))
	_set_color(material, "high_color", terrain.get("high_color", "#c1b77d"))
	_set_color(material, "rock_color", terrain.get("rock_color", "#626a66"))
	_set_color(material, "shadow_tint", style.get("shadow_tint", "#536b78"))
	_set_color(material, "rim_color", style.get("rim_color", "#d8f0ee"))
	material.set_shader_parameter("shadow_steps", float(style.get("shadow_steps", 3)))
	material.set_shader_parameter("secondary_shadow", float(style.get("secondary_shadow", 0.18)))
	material.set_shader_parameter("rim_strength", float(style.get("rim_strength", 0.16)))
	material.set_shader_parameter("painted_grain", float(style.get("painted_variation", 0.035)))
	material.set_shader_parameter("macro_strength", float(style.get("macro_variation", 0.14)))
	material.set_shader_parameter("slope_start", float(terrain.get("slope_start", 0.52)))
	material.set_shader_parameter("slope_blend", float(terrain.get("slope_blend", 0.16)))

func apply_environment(sun: DirectionalLight3D, environment: Environment, blueprint: AnimeBlueprint) -> void:
	var env := blueprint.section("environment")
	environment.background_color = Color.from_string(str(env.get("sky_color", "#b9d9e3")), environment.background_color)
	environment.ambient_light_color = Color.from_string(str(env.get("ambient_color", "#b9cdb8")), environment.ambient_light_color)
	environment.ambient_light_energy = float(env.get("ambient_energy", 0.72))
	sun.light_color = Color.from_string(str(env.get("sun_color", "#fff0c7")), Color.WHITE)
	sun.light_energy = float(env.get("sun_energy", 1.0))
	var rot: Array = env.get("sun_rotation", [-52.0, -38.0, 0.0])
	if rot.size() == 3:
		sun.rotation_degrees = Vector3(float(rot[0]), float(rot[1]), float(rot[2]))

func _set_color(material: ShaderMaterial, key: String, value) -> void:
	material.set_shader_parameter(key, Color.from_string(str(value), Color.WHITE))
