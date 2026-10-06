# APK update presentation; commands go to AndroidUpdater, save ownership stays in app.
extends AcceptDialog

var updater: Node
var save_callback: Callable
var _check: Button
var _download: Button
var _install: Button
var _progress: ProgressBar

func _ready() -> void:
	title = "Обновление приложения"
	size = Vector2i(640, 300)
	get_ok_button().text = "Закрыть"
	_check = add_button("Проверить", false, "check")
	_download = add_button("Скачать", false, "download")
	_install = add_button("Установить", false, "install")
	_progress = ProgressBar.new()
	_progress.min_value = 0.0
	_progress.max_value = 100.0
	_progress.show_percentage = true
	_progress.custom_minimum_size = Vector2(0, 28)
	add_child(_progress)
	add_button("Отменить загрузку", true, "cancel")
	_check.pressed.connect(_check_requested)
	_download.pressed.connect(_download_requested)
	_install.pressed.connect(_install_requested)
	custom_action.connect(_secondary_action)
	updater.changed.connect(_render)
	_render(updater.snapshot())

func _check_requested() -> void:
	updater.check()

func _download_requested() -> void:
	updater.download()

func _install_requested() -> void:
	updater.install(save_callback)

func _secondary_action(action: StringName) -> void:
	if str(action) == "cancel": updater.cancel()

func _render(state: Dictionary) -> void:
	_check.disabled = state.state in ["checking", "downloading"]
	_download.disabled = state.state != "available"
	_install.disabled = not state.state in ["ready", "permission_required", "installer_opened"]
	var downloading: bool = str(state.get("state", "")) == "downloading"
	_progress.visible = downloading
	_progress.value = float(state.get("progress", 0.0)) * 100.0
	var messages := {
		"idle": "Проверка обновлений запускается вручную.",
		"checking": "Проверяем новую версию…",
		"available": "Доступна версия %s. Скачать APK?" % state.version_name,
		"downloading": "Загрузка: %s / %s (%d%%)" % [_format_bytes(int(state.get("downloaded_bytes", 0))), _format_bytes(int(state.get("size_bytes", 0))), int(round(float(state.get("progress", 0.0)) * 100.0))],
		"verifying_hash": "Загрузка завершена. Проверяем размер и SHA-256…",
		"verifying_apk": "Целостность подтверждена. Проверяем APK и подпись…",
		"up_to_date": "Обновлений нет. Установлена актуальная версия (код %d)." % int(state.get("current_version_code", 0)),
		"ready": "APK проверена. Перед установкой текущий мир будет сохранён.",
		"permission_required": "Разрешите установку из Eirdan в настройках Android.\nЗатем вернитесь и снова нажмите «Установить».",
		"installer_opened": "Открыт установщик Android. Завершите установку в нём.\nЕсли вы отменили её, можно повторить.",
		"error": "Обновление не выполнено: %s.\nТекущая игра продолжает работать. Можно повторить проверку." % state.error
	}
	dialog_text = messages.get(state.state, state.state)
	if state.error == "save_before_install_failed": dialog_text = "Не удалось сохранить мир. Установка не начата.\nПовторите сохранение или экспортируйте диагностику."

func _format_bytes(value: int) -> String:
	if value >= 1024 * 1024: return "%.1f МБ" % (float(value) / 1048576.0)
	if value >= 1024: return "%.1f КБ" % (float(value) / 1024.0)
	return "%d Б" % value
