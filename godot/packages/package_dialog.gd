# ============================================================================
# PACKAGE DIALOG
# Thin player-facing adapter over RemotePackageService and local SAF import.
# ============================================================================
class_name EirdanPackageDialog
extends Window

signal local_import_requested

var service: EirdanRemotePackageService
var _status: Label
var _list: VBoxContainer

func _ready() -> void:
	title = "Пакеты игры"
	size = Vector2i(820, 600)
	min_size = Vector2i(620, 440)
	close_requested.connect(hide)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 22)
	margin.add_theme_constant_override("margin_top", 18)
	margin.add_theme_constant_override("margin_right", 22)
	margin.add_theme_constant_override("margin_bottom", 18)
	add_child(margin)
	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 12)
	margin.add_child(root)
	var heading := Label.new()
	heading.text = "Управление контентом"
	heading.add_theme_font_size_override("font_size", 28)
	root.add_child(heading)
	_status = Label.new()
	_status.text = "Каталог ещё не загружен"
	root.add_child(_status)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	root.add_child(scroll)
	_list = VBoxContainer.new()
	_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_list.add_theme_constant_override("separation", 8)
	scroll.add_child(_list)
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 8)
	root.add_child(actions)
	var refresh := Button.new()
	refresh.text = "Обновить каталог"
	refresh.pressed.connect(_refresh)
	actions.add_child(refresh)
	var local := Button.new()
	local.text = "Установить из файла"
	local.pressed.connect(func(): local_import_requested.emit())
	actions.add_child(local)
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	actions.add_child(spacer)
	var close := Button.new()
	close.text = "Закрыть"
	close.pressed.connect(hide)
	actions.add_child(close)

func bind(remote_service: EirdanRemotePackageService) -> void:
	service = remote_service
	service.catalog_changed.connect(_render)
	service.operation_finished.connect(_on_operation)

func open() -> void:
	popup_centered()
	_render(service.entries() if service != null else [])
	if service != null and service.entries().is_empty(): _refresh()

func refresh_installed() -> void:
	if service != null: _render(service.entries())

func _refresh() -> void:
	if service == null: return
	_status.text = "Загрузка каталога…"
	var started := service.refresh()
	if not started.ok: _status.text = "Каталог недоступен: %s" % started.get("error", "unknown")

func _render(entries: Array[Dictionary]) -> void:
	for child in _list.get_children(): child.queue_free()
	if entries.is_empty():
		_status.text = "Удалённый каталог пуст или недоступен. Локальная установка работает."
		return
	_status.text = "Доступно пакетов: %d" % entries.size()
	for entry in entries:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		_list.add_child(row)
		var label := Label.new()
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		label.text = "%s\n%s · %s · %s" % [entry.title, entry.category, _version_text(entry), _size_text(int(entry.size_bytes))]
		row.add_child(label)
		var action := Button.new()
		action.text = {"install": "Установить", "update": "Обновить", "current": "Установлено"}.get(str(entry.status), "Установить")
		action.disabled = entry.status == "current"
		action.pressed.connect(_install.bind(str(entry.id)))
		row.add_child(action)

func _install(package_id: String) -> void:
	_status.text = "Загрузка %s…" % package_id
	var started := service.install(package_id)
	if not started.ok: _status.text = "Не удалось начать загрузку: %s" % started.get("error", "unknown")

func _on_operation(result: Dictionary) -> void:
	if result.get("action") == "catalog": return
	_status.text = "Пакет установлен" if result.get("ok", false) else "Ошибка пакета: %s" % result.get("error", "unknown")

func _version_text(entry: Dictionary) -> String:
	var installed := str(entry.get("installed_version", ""))
	return "v%s" % entry.version if installed.is_empty() else "v%s → v%s" % [installed, entry.version]

func _size_text(bytes: int) -> String:
	if bytes <= 0: return "размер неизвестен"
	if bytes >= 1024 * 1024: return "%.1f МБ" % (float(bytes) / 1024.0 / 1024.0)
	return "%.0f КБ" % (float(bytes) / 1024.0)
