# APK update presentation; commands go to AndroidUpdater, save ownership stays in app.
extends AcceptDialog

var updater: Node
var save_callback: Callable
var _check: Button
var _download: Button
var _install: Button

func _ready() -> void:
	title = "Обновление приложения"
	size = Vector2i(640, 300)
	get_ok_button().text = "Закрыть"
	_check = add_button("Проверить", false, "check")
	_download = add_button("Скачать", false, "download")
	_install = add_button("Установить", false, "install")
	add_button("Отменить загрузку", true, "cancel")
	custom_action.connect(_action)
	updater.changed.connect(_render)
	_render(updater.snapshot())

func _action(action: StringName) -> void:
	match action:
		&"check": updater.check()
		&"download": updater.download()
		&"install": updater.install(save_callback)
		&"cancel": updater.cancel()

func _render(state: Dictionary) -> void:
	_check.disabled = state.state in ["checking", "downloading"]
	_download.disabled = state.state != "available"
	_install.disabled = not state.state in ["ready", "permission_required", "installer_opened"]
	var messages := {
		"idle": "Проверка обновлений запускается вручную.",
		"checking": "Проверяем новую версию…",
		"available": "Доступна версия %s. Скачать APK?" % state.version_name,
		"downloading": "Загружаем APK. После загрузки проверим размер, SHA-256 и подпись.",
		"up_to_date": "Установлена актуальная или более новая версия.",
		"ready": "APK проверена. Перед установкой текущий мир будет сохранён.",
		"permission_required": "Разрешите установку из Eirdan в настройках Android.\nЗатем вернитесь и снова нажмите «Установить».",
		"installer_opened": "Открыт установщик Android. Завершите установку в нём.\nЕсли вы отменили её, можно повторить.",
		"error": "Обновление не выполнено: %s.\nТекущая игра продолжает работать. Можно повторить проверку." % state.error
	}
	dialog_text = messages.get(state.state, state.state)
	if state.error == "save_before_install_failed": dialog_text = "Не удалось сохранить мир. Установка не начата.\nПовторите сохранение или экспортируйте диагностику."
