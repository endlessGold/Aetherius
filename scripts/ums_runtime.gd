extends Node
signal runtime_log(message:String)

var host:Node
var definition:Dictionary={}
var fired:Dictionary={}

func configure(runtime_host:Node, path:String) -> void:
	host=runtime_host
	var file:=FileAccess.open(path,FileAccess.READ)
	if file==null:
		runtime_log.emit("ERROR cannot open Game IR: "+path); return
	var parsed=JSON.parse_string(file.get_as_text())
	if typeof(parsed)!=TYPE_DICTIONARY:
		runtime_log.emit("ERROR invalid Game IR JSON"); return
	definition=parsed
	var errors:=validate_definition()
	if not errors.is_empty():
		for error in errors: runtime_log.emit("IR ERROR "+error)
		return
	runtime_log.emit("Game IR loaded: "+str(definition.get("id","unknown")))

func validate_definition() -> Array[String]:
	var errors:Array[String]=[]
	if not definition.has("id"): errors.append("missing map id")
	if not definition.has("triggers") or typeof(definition["triggers"])!=TYPE_ARRAY: errors.append("missing triggers")
	var ids:Dictionary={}
	for rule in definition.get("triggers",[]):
		var id:=str(rule.get("id",""))
		if id.is_empty(): errors.append("rule without id")
		elif ids.has(id): errors.append("duplicate rule id: "+id)
		else: ids[id]=true
		if not rule.has("when"): errors.append(id+" missing when")
		if not rule.has("do"): errors.append(id+" missing actions")
	return errors

func emit_game_event(event_name:String, payload:Dictionary={}) -> void:
	runtime_log.emit("EVENT "+event_name)
	for rule in definition.get("triggers",[]):
		if fired.get(rule.get("id",""),false): continue
		var when:Dictionary=rule.get("when",{})
		if str(when.get("event",""))!=event_name: continue
		if when.has("area") and payload.get("area","")!=when["area"]: continue
		if when.has("group") and payload.get("group","")!=when["group"]: continue
		if evaluate(rule.get("if",{})):
			apply_rule(rule)

func evaluate(condition:Dictionary) -> bool:
	if condition.is_empty(): return true
	if condition.has("enemy_count"):
		var c:Dictionary=condition["enemy_count"]
		var actual:int=host.get_enemy_count(str(c.get("group","")))
		var expected:int=int(c.get("equals",0))
		runtime_log.emit("CONDITION enemy_count == "+str(expected)+" : "+str(actual==expected))
		return actual==expected
	return false

func apply_rule(rule:Dictionary) -> void:
	var id:=str(rule.get("id",""))
	for action in rule.get("do",[]):
		host.execute_ums_action(action)
		runtime_log.emit("ACTION "+JSON.stringify(action))
	fired[id]=true
	runtime_log.emit("CHANGESET applied: "+id)
