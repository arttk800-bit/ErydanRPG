# Map input is forwarded explicitly by Bootstrap before full-screen UI Controls
# can consume it. Disable the container's automatic path to avoid duplicates.
extends SubViewportContainer

func _propagate_input_event(_event: InputEvent) -> bool:
	return false
