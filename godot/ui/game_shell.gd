# ============================================================================
# GAME SHELL
# Owns global presentation navigation only. Domain state and gameplay rules
# remain in their modules; runtime/platform actions are forwarded as callbacks.
# ============================================================================
extends Control

signal world_requested
signal character_requested
signal inventory_requested
signal journal_requested
signal system_action(action: String)

@onready var nav: HBoxContainer = $BottomNav
@onready var system_menu: PanelContainer = $SystemMenu

func _ready() -> void:
	$Top/Menu.pressed.connect(func(): system_menu.visible = not system_menu.visible)
	$BottomNav/World.pressed.connect(func(): world_requested.emit())
	$BottomNav/Character.pressed.connect(func(): character_requested.emit())
	$BottomNav/Inventory.pressed.connect(func(): inventory_requested.emit())
	$BottomNav/Journal.pressed.connect(func(): journal_requested.emit())
	for pair in [
		[$SystemMenu/Content/Save, "save"], [$SystemMenu/Content/Load, "load"],
		[$SystemMenu/Content/Update, "update"], [$SystemMenu/Content/Packages, "packages"],
		[$SystemMenu/Content/Diagnostics, "diagnostics"], [$SystemMenu/Content/MainMenu, "main_menu"]
	]:
		pair[0].pressed.connect(func(): _emit_system(str(pair[1])))
	Diagnostics.register_provider(&"game_shell", snapshot)

func _exit_tree() -> void:
	Diagnostics.unregister_provider(&"game_shell")

func set_world_active(active: bool) -> void:
	nav.visible = active
	$Top.visible = active
	if not active: system_menu.visible = false

func _emit_system(action: String) -> void:
	system_menu.visible = false
	system_action.emit(action)

func snapshot() -> Dictionary:
	return {"world_ui_active": nav.visible, "system_menu_open": system_menu.visible}
