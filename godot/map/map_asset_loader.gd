# ============================================================================
# MAP ASSET LOADER
# Presentation adapter for an asset path already resolved by DataRegistry.
# It never discovers package/storage layout on its own.
# ============================================================================
extends RefCounted

static func background(asset: Dictionary) -> Dictionary:
	var path := str(asset.get("path", ""))
	if path.is_empty() or not FileAccess.file_exists(path):
		return {"texture": null, "path": path, "external": false}
	var image := Image.load_from_file(path)
	if image == null or image.is_empty():
		Diagnostics.warn("map.asset_invalid", {"path": path, "source": asset.get("source", "")})
		return {"texture": null, "path": path, "external": false}
	var texture := ImageTexture.create_from_image(image)
	Diagnostics.info("map.asset_loaded", {"path": path, "source": asset.get("source", ""), "size": image.get_size()})
	return {"texture": texture, "path": path, "external": true, "source": asset.get("source", "")}
