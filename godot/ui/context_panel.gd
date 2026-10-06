# ============================================================================
# CONTEXT PANEL
# Reusable contextual action surface. Presentation only.
# ============================================================================
extends PanelContainer

signal action_requested(action: String)

func configure(title: String, body: String, actions: Array[String] = []) -> void:
	$Margin/Content/Title.text = title
	$Margin/Content/Body.text = body
	for child in $Margin/Content/Actions.get_children(): child.queue_free()
	for action in actions:
		var button := Button.new()
		button.text = action
		button.pressed.connect(func(): action_requested.emit(action))
		$Margin/Content/Actions.add_child(button)

func open() -> void: visible = true
func close() -> void: visible = false
