extends Node
signal runtime_log(message: String)

var host: Node
var definition: Dictionary = {}
var event_bus := UMSEventBus.new()
var world_state := UMSWorldState.new()
var entity_registry := UMSEntityRegistry.new()
var validator := UMSValidator.new()
var rule_graph := UMSRuleGraph.new()
var condition_evaluator := UMSConditionEvaluator.new()
var action_executor := UMSActionExecutor.new()
var rule_runtime := UMSRuleRuntime.new()

func configure(runtime_host: Node, path: String) -> void:
	host = runtime_host
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		runtime_log.emit("ERROR cannot open Game IR: " + path)
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		runtime_log.emit("ERROR invalid Game IR JSON")
		return
	definition = parsed
	var errors := validator.validate(definition)
	if not errors.is_empty():
		for error in errors:
			runtime_log.emit("IR ERROR " + error)
		return
	rule_graph.build(definition)
	condition_evaluator.configure(host, world_state)
	action_executor.configure(host, world_state)
	rule_runtime.configure(definition, condition_evaluator, action_executor)
	rule_runtime.runtime_log.connect(func(message: String): runtime_log.emit(message))
	event_bus.event_emitted.connect(rule_runtime.handle_event)
	runtime_log.emit("Game IR loaded: " + str(definition.get("id", "unknown")))

func emit_game_event(event_name: String, payload: Dictionary = {}) -> void:
	event_bus.emit_event(event_name, payload)

func begin_change() -> UMSChangeSet:
	var change := UMSChangeSet.new()
	change.begin(definition)
	return change

func apply_change(change: UMSChangeSet) -> Array[String]:
	var errors := change.validate(validator)
	if not errors.is_empty():
		change.rollback()
		return errors
	definition = change.commit()
	rule_graph.build(definition)
	rule_runtime.configure(definition, condition_evaluator, action_executor)
	runtime_log.emit("CHANGESET transaction committed")
	return []

func get_world_state() -> UMSWorldState:
	return world_state

func get_entity_registry() -> UMSEntityRegistry:
	return entity_registry
