class_name UMSRuleGraph
extends RefCounted

var edges: Dictionary = {}

func build(definition: Dictionary) -> void:
	edges.clear()
	for rule in definition.get("triggers", []):
		var id := str(rule.get("id", ""))
		edges[id] = []
		for dependency in rule.get("depends_on", []):
			edges[id].append(str(dependency))

func dependencies(id: String) -> Array:
	return edges.get(id, []).duplicate()

func find_cycles() -> Array[String]:
	var cycles: Array[String] = []
	var visiting := {}
	var visited := {}
	for id in edges:
		_visit(id, visiting, visited, cycles)
	return cycles

func _visit(id: String, visiting: Dictionary, visited: Dictionary, cycles: Array[String]) -> void:
	if visiting.get(id, false):
		if not cycles.has(id):
			cycles.append(id)
		return
	if visited.get(id, false):
		return
	visiting[id] = true
	for dep in edges.get(id, []):
		if edges.has(dep):
			_visit(dep, visiting, visited, cycles)
	visiting.erase(id)
	visited[id] = true
