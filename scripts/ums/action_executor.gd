class_name UMSActionExecutor
extends RefCounted

var host: Node
var world_state: UMSWorldState

func configure(runtime_host: Node, state: UMSWorldState) -> void:
	host = runtime_host
	world_state = state

func supports(action: Dictionary) -> bool:
	return action.has("open_gate") or action.has("activate") or action.has("set_world_state")

func execute(action: Dictionary) -> bool:
	if not supports(action):
		return false
	if action.has("set_world_state"):
		world_state.patch(action["set_world_state"])
	host.execute_ums_action(action)
	return true
