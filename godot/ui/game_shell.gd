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
signal back_requested

@onready var nav: HBoxContainer = $Layout/BottomNav
@onready var system_menu: PanelContainer = $SystemMenu
@onready var screens: Control = $Layout/ContentHost/Screens

var _active_screen := "world"

func _ready() -> void:
	$Layout/Top/Menu.pressed.connect(toggle_system_menu)
	$Layout/BottomNav/World.pressed.connect(func(): show_screen("world"); world_requested.emit())
	$Layout/BottomNav/Character.pressed.connect(func(): show_screen("character"); character_requested.emit())
	$Layout/BottomNav/Inventory.pressed.connect(func(): show_screen("inventory"); inventory_requested.emit())
	$Layout/BottomNav/Journal.pressed.connect(func(): show_screen("journal"); journal_requested.emit())
	for pair in [
		[$SystemMenu/Content/Save, "save"], [$SystemMenu/Content/Load, "load"],
		[$SystemMenu/Content/Update, "update"], [$SystemMenu/Content/Packages, "packages"],
		[$SystemMenu/Content/Diagnostics, "diagnostics"], [$SystemMenu/Content/Settings, "settings"],
		[$SystemMenu/Content/MainMenu, "main_menu"]
	]:
		pair[0].pressed.connect(func(): _emit_system(str(pair[1])))
	Diagnostics.register_provider(&"game_shell", snapshot)

func _exit_tree() -> void:
	Diagnostics.unregister_provider(&"game_shell")

func set_world_active(active: bool) -> void:
	visible = active
	nav.visible = active
	$Layout/Top.visible = active
	if not active: system_menu.visible = false

func set_shell_visible(active: bool, gameplay_nav: bool) -> void:
	visible = active
	$Layout/Top.visible = active
	nav.visible = active and gameplay_nav
	if not active: system_menu.visible = false

func show_screen(screen_id: String) -> void:
	_active_screen = screen_id
	for child in screens.get_children():
		if child is Control: child.visible = child.name.to_snake_case() == screen_id
	Diagnostics.info("ui.screen_changed", {"screen": screen_id})

func active_screen() -> String:
	return _active_screen

func toggle_system_menu() -> void:
	system_menu.visible = not system_menu.visible
	Diagnostics.info("ui.system_menu", {"open": system_menu.visible})

func close_system_menu() -> bool:
	if not system_menu.visible: return false
	system_menu.visible = false
	Diagnostics.info("ui.system_menu", {"open": false})
	return true

func handle_back() -> bool:
	if close_system_menu(): return true
	if _active_screen != "world":
		back_requested.emit()
		return true
	toggle_system_menu()
	return true

func _emit_system(action: String) -> void:
	system_menu.visible = false
	system_action.emit(action)

func snapshot() -> Dictionary:
	return {"world_ui_active": nav.visible, "system_menu_open": system_menu.visible, "active_screen": _active_screen, "content_screens": screens.get_child_count(), "safe_area": $Layout.snapshot()}
