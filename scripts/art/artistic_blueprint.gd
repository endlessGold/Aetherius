class_name ArtisticBlueprint
extends RefCounted

var data: Dictionary = {}

func load_from_path(path: String) -> bool:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("ArtisticBlueprint: cannot open " + path)
		return false
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("ArtisticBlueprint: invalid JSON")
		return false
	data = parsed
	return validate()

func validate() -> bool:
	if int(data.get("schema_version", 0)) != 2:
		push_error("ArtisticBlueprint: schema_version must be 2")
		return false
	for key in ["reference","semantics","color_script","interpretation","brush_field","lighting","composition"]:
		if not data.has(key):
			push_error("ArtisticBlueprint: missing " + key)
			return false
	return true

func section(name: String) -> Dictionary:
	return data.get(name, {})
