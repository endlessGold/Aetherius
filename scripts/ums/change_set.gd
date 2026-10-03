class_name UMSChangeSet
extends RefCounted

var original: Dictionary = {}
var working: Dictionary = {}
var active := false

func begin(definition: Dictionary) -> void:
	original = definition.duplicate(true)
	working = definition.duplicate(true)
	active = true

func patch(path: Array, value) -> bool:
	if not active or path.is_empty():
		return false
	var cursor: Dictionary = working
	for i in range(path.size() - 1):
		var key = path[i]
		if not cursor.has(key) or typeof(cursor[key]) != TYPE_DICTIONARY:
			cursor[key] = {}
		cursor = cursor[key]
	cursor[path[-1]] = value
	return true

func validate(validator: UMSValidator) -> Array[String]:
	return validator.validate(working)

func commit() -> Dictionary:
	active = false
	original = {}
	return working.duplicate(true)

func rollback() -> Dictionary:
	active = false
	working = original.duplicate(true)
	return working.duplicate(true)
