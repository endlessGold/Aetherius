class_name UMSRuleRuntime
extends RefCounted

signal runtime_log(message: String)

var definition: Dictionary = {}
var fired: Dictionary = {}
var evaluator: UMSConditionEvaluator
var executor: UMSActionExecutor

func configure(ir: Dictionary, condition_evaluator: UMSConditionEvaluator, action_executor: UMSActionExecutor) -> void:
	definition = ir
	evaluator = condition_evaluator
	executor = action_executor

func handle_event(event_name: String, payload: Dictionary) -> void:
	runtime_log.emit("EVENT " + event_name)
	for rule in definition.get("triggers", []):
		var id := str(rule.get("id", ""))
		if fired.get(id, false):
			continue
		var when: Dictionary = rule.get("when", {})
		if str(when.get("event", "")) != event_name:
			continue
		if when.has("area") and payload.get("area", "") != when["area"]:
			continue
		if when.has("group") and payload.get("group", "") != when["group"]:
			continue
		if not _dependencies_satisfied(rule):
			continue
		if evaluator.evaluate(rule.get("if", {})):
			_apply(rule)

func _dependencies_satisfied(rule: Dictionary) -> bool:
	for dependency in rule.get("depends_on", []):
		if not fired.get(str(dependency), false):
			return false
	return true

func _apply(rule: Dictionary) -> void:
	var id := str(rule.get("id", ""))
	for action in rule.get("do", []):
		if executor.execute(action):
			runtime_log.emit("ACTION " + JSON.stringify(action))
	fired[id] = true
	runtime_log.emit("CHANGESET applied: " + id)
