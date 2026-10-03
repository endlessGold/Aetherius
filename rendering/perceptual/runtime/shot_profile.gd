class_name PerceptualShotProfile
extends Resource
@export_range(0.0,1.0) var detail_budget_scale:=0.55
@export_range(0.0,1.0) var form_separation_strength:=0.55
@export_range(0.0,1.0) var foliage_mass_scale:=0.72
@export_range(0.0,1.0) var paint_persistence:=0.90
@export_range(0.0,2.0) var atmosphere_density:=0.35
@export var semantic_priorities:Dictionary={"building":0.7,"foliage":0.45,"water":0.65,"sky":0.35}
@export var target_value_order:PackedStringArray=["sky","focal","water","building","foliage"]
