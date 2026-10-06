# ============================================================================
# HTTP PACKAGE SOURCE
# Fetches remote manifests/payloads; PackageManager remains source-agnostic.
# ============================================================================
class_name EirdanHttpPackageSource
extends Node

signal completed(result: Dictionary)

var _request: HTTPRequest
var _destination := ""

func _ready() -> void:
	_request = HTTPRequest.new()
	add_child(_request)
	_request.request_completed.connect(_on_request_completed)

func download(url: String, destination: String) -> Error:
	_destination = destination
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(destination.get_base_dir()))
	_request.download_file = destination
	Diagnostics.info("packages.http_started", {"url": url, "destination": destination})
	return _request.request(url)

func _on_request_completed(result: int, response_code: int, _headers: PackedStringArray, _body: PackedByteArray) -> void:
	var ok := result == HTTPRequest.RESULT_SUCCESS and response_code >= 200 and response_code < 300
	var payload := {"ok": ok, "result": result, "response_code": response_code, "destination": _destination}
	if ok: Diagnostics.info("packages.http_completed", payload)
	else: Diagnostics.error("packages.http_failed", payload)
	completed.emit(payload)
