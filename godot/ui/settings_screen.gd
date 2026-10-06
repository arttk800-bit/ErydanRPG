# ============================================================================
# SETTINGS SCREEN
# Structural settings shell. Actual setting owners are connected later.
# ============================================================================
extends VBoxContainer

const EirdanTheme = preload("res://ui/eirdan_theme.gd")

signal back_requested

func _ready() -> void:
	$Header/Back.pressed.connect(func(): back_requested.emit())
	for section in [
		["Интерфейс", "Параметры интерфейса пока не подключены."],
		["Звук", "Аудиосистема пока не подключена."],
		["Игровой процесс", "Параметры появятся вместе с соответствующими игровыми системами."],
		["Служебные инструменты", "Обновления, пакеты и диагностика доступны через меню ≡."]
	]: _add_section(str(section[0]), str(section[1]))

func _add_section(title: String, description: String) -> void:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", EirdanTheme.panel_style())
	var content := VBoxContainer.new()
	content.add_theme_constant_override("separation", 6)
	var heading := Label.new()
	heading.text = title
	heading.add_theme_font_size_override("font_size", 22)
	var body := Label.new()
	body.text = description
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(heading)
	content.add_child(body)
	panel.add_child(content)
	$Sections.add_child(panel)

func snapshot() -> Dictionary:
	return {"visible": visible, "sections": ["interface", "audio", "gameplay", "development"]}
