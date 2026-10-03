class_name UMSEntityRegistry
extends RefCounted

var entities: Dictionary = {}

func register_entity(id: String, node: Node = null, components: Dictionary = {}) -> bool:
	if id.is_empty() or entities.has(id):
		return false
	entities[id] = {"node": node, "components": components.duplicate(true)}
	return true

func unregister_entity(id: String) -> void:
	entities.erase(id)

func has_entity(id: String) -> bool:
	return entities.has(id)

func get_node(id: String) -> Node:
	if not entities.has(id):
		return null
	return entities[id].get("node")

func query_component(id: String, component: String):
	if not entities.has(id):
		return null
	return entities[id].get("components", {}).get(component)
