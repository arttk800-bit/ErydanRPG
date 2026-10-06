# ============================================================================
# SAVE BROWSER
# Presents SaveStore metadata and emits selection intents. Never loads state.
# ============================================================================
extends VBoxContainer

signal save_selected(world_id: String)
signal back_requested

func _ready() -> void:
	$Header/Back.pressed.connect(func(): back_requested.emit())

func refresh(saves: Array) -> void:
	for child in $List.get_children(): child.queue_free()
	if saves.is_empty():
		var empty := Label.new()
		empty.text = "Сохранений пока нет."
		$List.add_child(empty)
		return
	for raw in saves:
		if raw is not Dictionary: continue
		var meta: Dictionary = raw
		var button := Button.new()
		var world_name := str(meta.get("world_name", "Без названия"))
		var updated := str(meta.get("updated_at", ""))
		button.text = "%s\n%s" % [world_name, updated]
		var world_id := str(meta.get("world_id", ""))
		button.pressed.connect(func(): save_selected.emit(world_id))
		$List.add_child(button)

func snapshot() -> Dictionary:
	return {"visible": visible, "entries": $List.get_child_count()}
