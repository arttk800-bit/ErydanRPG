# ============================================================================
# EIRDAN UI THEME
# Shared presentation tokens and reusable Godot theme construction.
# No gameplay state or rules belong here.
# ============================================================================
extends RefCounted

const BG := Color("#171713")
const PANEL := Color("#24231d")
const PANEL_ALT := Color("#302e25")
const BORDER := Color("#81724f")
const TEXT := Color("#e7dfc9")
const MUTED := Color("#aaa28d")
const ACCENT := Color("#c3a35a")
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
		box.set_corner_radius_all(3)
		box.content_margin_left = 16
		box.content_margin_right = 16
		box.content_margin_top = 10
		box.content_margin_bottom = 10
		theme.set_stylebox(state, "Button", box)
	return theme

static func panel_style() -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = Color(PANEL, 0.96)
	box.border_color = BORDER
	box.set_border_width_all(1)
	box.set_corner_radius_all(4)
	box.content_margin_left = 18
	box.content_margin_right = 18
	box.content_margin_top = 14
	box.content_margin_bottom = 14
	return box
