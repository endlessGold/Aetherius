class_name UMSEventBus
extends RefCounted

signal event_emitted(event_name: String, payload: Dictionary)

func emit_event(event_name: String, payload: Dictionary = {}) -> void:
	event_emitted.emit(event_name, payload.duplicate(true))
