extends SceneTree

func _init() -> void:
	var validator := UMSValidator.new()
	var file := FileAccess.open("res://ums/map_definition.json", FileAccess.READ)
	if file == null:
		push_error("scenario: cannot open Game IR")
		quit(1)
		return
	var definition = JSON.parse_string(file.get_as_text())
	if typeof(definition) != TYPE_DICTIONARY:
		push_error("scenario: invalid JSON")
		quit(1)
		return
	var errors := validator.validate(definition)
	if not errors.is_empty():
		for error in errors:
			push_error("scenario validation: " + error)
		quit(1)
		return
	var graph := UMSRuleGraph.new()
	graph.build(definition)
	if not graph.find_cycles().is_empty():
		push_error("scenario: graph cycle")
		quit(1)
		return
	var change := UMSChangeSet.new()
	change.begin(definition)
	change.patch(["intent"], "Validated transactional UMS vertical slice")
	errors = change.validate(validator)
	if not errors.is_empty():
		push_error("scenario: ChangeSet validation failed")
		quit(1)
		return
	var committed := change.commit()
	if committed.get("intent", "") != "Validated transactional UMS vertical slice":
		push_error("scenario: ChangeSet commit failed")
		quit(1)
		return
	print("UMS_SCENARIO_OK rules=", definition.get("triggers", []).size())
	quit(0)
