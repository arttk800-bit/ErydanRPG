# ============================================================================
# MAIN MENU
# Presentation entry point. Requests new/continue/load/settings actions only;
# save ownership and runtime composition stay outside this view.
# ============================================================================
extends Control

signal action_requested(action: String)

func _ready() -> void:
	$Center/Actions/NewGame.pressed.connect(func(): action_requested.emit("new_game"))
	$Center/Actions/Continue.pressed.connect(func(): action_requested.emit("continue"))
	$Center/Actions/Load.pressed.connect(func(): action_requested.emit("load"))
	$Center/Actions/Settings.pressed.connect(func(): action_requested.emit("settings"))
	$Center/Actions/Updates.pressed.connect(func(): action_requested.emit("updates"))
	Diagnostics.register_provider(&"main_menu", snapshot)

func _exit_tree() -> void:
	Diagnostics.unregister_provider(&"main_menu")

func set_continue_available(available: bool) -> void:
	$Center/Actions/Continue.disabled = not available

func snapshot() -> Dictionary:
	return {"visible": visible, "continue_available": not $Center/Actions/Continue.disabled}
