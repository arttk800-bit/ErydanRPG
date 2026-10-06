# ============================================================================
# EIRDAN UI THEME
# Shared presentation tokens and reusable Godot theme construction.
# No gameplay state or rules belong here.
# ============================================================================
extends RefCounted

const BG := Color("#0b0f0e")
const PANEL := Color("#151b18")
const PANEL_ALT := Color("#202720")
const BORDER := Color("#536057")
const TEXT := Color("#e8e3d6")
const MUTED := Color("#aaa797")
const ACCENT := Color("#c7a85c")
const DANGER := Color("#a95b4b")

static func build() -> Theme:
	var theme := Theme.new()
	theme.default_font_size = 18
	for type in ["Label", "Button"]:
		theme.set_color("font_color", type, TEXT)
		theme.set_color("font_disabled_color", type, MUTED)
	theme.set_color("font_color", "Label", TEXT)
	theme.set_font_size("font_size", "Label", 18)
	theme.set_font_size("font_size", "Button", 17)
	for state in ["normal", "hover", "pressed", "disabled"]:
		var box := StyleBoxFlat.new()
		box.bg_color = PANEL_ALT if state != "pressed" else PANEL
		box.border_color = ACCENT if state == "hover" else BORDER
		box.set_border_width_all(1)
		box.set_corner_radius_all(8)
		box.content_margin_left = 16
		box.content_margin_right = 16
		box.content_margin_top = 10
		box.content_margin_bottom = 10
		theme.set_stylebox(state, "Button", box)
	theme.set_stylebox("panel", "PanelContainer", panel_style())
	var progress_background := StyleBoxFlat.new()
	progress_background.bg_color = Color("#090d0b")
	progress_background.set_corner_radius_all(5)
	progress_background.content_margin_top = 5
	progress_background.content_margin_bottom = 5
	theme.set_stylebox("background", "ProgressBar", progress_background)
	var progress_fill := StyleBoxFlat.new()
	progress_fill.bg_color = ACCENT
	progress_fill.set_corner_radius_all(5)
	theme.set_stylebox("fill", "ProgressBar", progress_fill)
	return theme

static func panel_style() -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = Color(PANEL, 0.95)
	box.border_color = BORDER
	box.set_border_width_all(1)
	box.set_corner_radius_all(10)
	box.content_margin_left = 18
	box.content_margin_right = 18
	box.content_margin_top = 14
	box.content_margin_bottom = 14
	return box
