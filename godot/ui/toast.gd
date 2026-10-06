# ============================================================================
# TOAST
# Shared transient/status message surface. Presentation only.
# ============================================================================
extends Label

func show_message(message: String) -> void:
	text = message
	visible = not message.is_empty()

func clear() -> void:
	text = ""
	visible = false
