# ============================================================================
# MAP ASSET LOADER
# Presentation infrastructure for runtime-replaceable regional map images.
# Gameplay systems never depend on these files.
# ============================================================================
extends RefCounted

const ROOT := "user://map_assets"
const SUPPORTED := ["webp", "png", "jpg", "jpeg"]

static func background(region_id: String) -> Dictionary:
	for extension in SUPPORTED:
		var path := "%s/%s/background.%s" % [ROOT, region_id, extension]
		if not FileAccess.file_exists(path): continue
		var image := Image.load_from_file(path)
		if image == null or image.is_empty():
			Diagnostics.warn("map.asset_invalid", {"region": region_id, "path": path})
			continue
		var texture := ImageTexture.create_from_image(image)
		Diagnostics.info("map.asset_loaded", {"region": region_id, "path": path, "size": image.get_size()})
		return {"texture": texture, "path": path, "external": true}
	return {"texture": null, "path": "", "external": false}

static func asset_directory(region_id: String) -> String:
	return "%s/%s" % [ROOT, region_id]
