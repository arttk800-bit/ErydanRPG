# ============================================================================
# SETTINGS SCREEN
# Structural settings shell. Actual setting owners are connected later.
# ============================================================================
extends VBoxContainer

signal back_requested

func _ready() -> void:
	$Header/Back.pressed.connect(func(): back_requested.emit())

func snapshot() -> Dictionary:
	return {"visible": visible, "sections": ["interface", "audio", "gameplay", "development"]}
