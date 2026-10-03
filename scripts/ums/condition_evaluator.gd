class_name UMSConditionEvaluator
extends RefCounted

var host: Node
var world_state: UMSWorldState

func configure(runtime_host: Node, state: UMSWorldState) -> void:
	host = runtime_host
	world_state = state

func evaluate(condition: Dictionary) -> bool:
	if condition.is_empty():
		return true
	if condition.has("enemy_count"):
		var c: Dictionary = condition["enemy_count"]
		return host.get_enemy_count(str(c.get("group", ""))) == int(c.get("equals", 0))
	if condition.has("world_state"):
		var c: Dictionary = condition["world_state"]
		return world_state.get_value(str(c.get("key", ""))) == c.get("equals")
	return false
