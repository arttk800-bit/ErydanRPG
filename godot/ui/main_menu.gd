# ============================================================================
# MAIN MENU
# Presentation entry point. Requests new/continue/load/settings actions only;
# save ownership and runtime composition stay outside this view.
# ============================================================================
extends Control

signal action_requested(action: String)

@onready var actions: VBoxContainer = $Center/Actions

func _ready() -> void:
	actions.get_node("NewGame").pressed.connect(func(): action_requested.emit("new_game"))
	actions.get_node("Continue").pressed.connect(func(): action_requested.emit("continue"))
	actions.get_node("Load").pressed.connect(func(): action_requested.emit("load"))
	actions.get_node("Settings").pressed.connect(func(): action_requested.emit("settings"))
	actions.get_node("Updates").pressed.connect(func(): action_requested.emit("updates"))
	Diagnostics.register_provider(&"main_menu", snapshot)

func _exit_tree() -> void:
	Diagnostics.unregister_provider(&"main_menu")

func set_continue_available(available: bool) -> void:
	actions.get_node("Continue").disabled = not available

func snapshot() -> Dictionary:
	return {"visible": visible, "continue_available": not actions.get_node("Continue").disabled}
