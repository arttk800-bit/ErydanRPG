# ============================================================================
# TOAST
# Shared transient/status message surface. Presentation only.
# ============================================================================
extends Label

var _generation := 0

func show_message(message: String, seconds: float = 2.5) -> void:
	_generation += 1
	var generation := _generation
	text = message
	visible = not message.is_empty()
	if message.is_empty() or seconds <= 0.0: return
	await get_tree().create_timer(seconds).timeout
	if generation == _generation:
		clear()

func clear() -> void:
	_generation += 1
	text = ""
	visible = false
