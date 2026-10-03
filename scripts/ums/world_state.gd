class_name UMSWorldState
extends RefCounted

var values: Dictionary = {}

func get_value(key: String, fallback = null):
	return values.get(key, fallback)

func set_value(key: String, value) -> void:
	values[key] = value

func patch(delta: Dictionary) -> void:
	for key in delta:
		values[key] = delta[key]

func snapshot() -> Dictionary:
	return values.duplicate(true)

func restore(snapshot_value: Dictionary) -> void:
	values = snapshot_value.duplicate(true)
