# ============================================================================
# SCREEN FRAME
# Reusable structural screen component. Defines title/content/action zones only;
# it never owns domain state or gameplay rules.
# ============================================================================
extends VBoxContainer

@export var screen_title: String = "":
@export var empty_message := ""

func _ready() -> void:
	$Header/Title.text = screen_title
	$Body/Empty.text = empty_message
	Diagnostics.register_provider(StringName("screen_%s" % name.to_snake_case()), snapshot)

func _exit_tree() -> void:
	Diagnostics.unregister_provider(StringName("screen_%s" % name.to_snake_case()))

func set_empty_message(message: String) -> void:
	empty_message = message
	$Body/Empty.text = message

func snapshot() -> Dictionary:
	return {"screen": name, "visible": visible, "title": screen_title}
