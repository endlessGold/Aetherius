class_name UMSValidator
extends RefCounted

const SUPPORTED_CONDITIONS := ["enemy_count", "world_state"]
const SUPPORTED_ACTIONS := ["open_gate", "activate", "set_world_state"]

func validate(definition: Dictionary) -> Array[String]:
	var errors: Array[String] = []
	if str(definition.get("id", "")).is_empty():
		errors.append("missing map id")
	if typeof(definition.get("triggers", null)) != TYPE_ARRAY:
		errors.append("missing triggers")
		return errors
	var ids := {}
	for rule in definition.get("triggers", []):
		var id := str(rule.get("id", ""))
		if id.is_empty():
			errors.append("rule without id")
		elif ids.has(id):
			errors.append("duplicate rule id: " + id)
		else:
			ids[id] = true
		if not rule.has("when") or str(rule.get("when", {}).get("event", "")).is_empty():
			errors.append(id + " missing event")
		if typeof(rule.get("do", null)) != TYPE_ARRAY:
			errors.append(id + " missing actions")
		for condition_name in rule.get("if", {}).keys():
			if not SUPPORTED_CONDITIONS.has(str(condition_name)):
				errors.append(id + " unsupported condition: " + str(condition_name))
		for action in rule.get("do", []):
			var supported := false
			for action_name in action.keys():
				if SUPPORTED_ACTIONS.has(str(action_name)):
					supported = true
			if not supported:
				errors.append(id + " unsupported action")
	var graph := UMSRuleGraph.new()
	graph.build(definition)
	for cycle in graph.find_cycles():
		errors.append("rule dependency cycle: " + cycle)
	for rule in definition.get("triggers", []):
		for dep in rule.get("depends_on", []):
			if not ids.has(str(dep)):
				errors.append(str(rule.get("id", "")) + " dangling dependency: " + str(dep))
	return errors
