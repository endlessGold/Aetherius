class_name AnimeBlueprint
extends RefCounted

var data: Dictionary = {}

func load_from_path(path: String) -> bool:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("AnimeBlueprint: cannot open " + path)
		return false
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("AnimeBlueprint: invalid JSON")
		return false
	data = parsed
	return validate()

func validate() -> bool:
	for key in ["art_style", "materials", "environment", "composition", "world_art"]:
		if not data.has(key):
			push_error("AnimeBlueprint: missing " + key)
			return false
	return true

func section(name: String) -> Dictionary:
	return data.get(name, {})

func color(section_name: String, key: String, fallback: Color) -> Color:
	var value = section(section_name).get(key, "")
	return Color.from_string(str(value), fallback)
