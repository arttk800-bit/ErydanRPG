package ru.eyrdan.rpg

import kotlinx.serialization.json.*

data class GmReply(
    val narrative: String,
    val options: List<String>,
    val patch: JsonObject = JsonObject(emptyMap())
)

class GmEngine(private val client: OpenAiClient = OpenAiClient()) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun turn(key: String, state: GameState, action: String): GmReply {
        val instructions = "Ты мастер RPG Эйрдан. Пиши по-русски. Игрок управляет героем, ты NPC и миром. Не делай выбор за героя. Отвечай кратко. Верни JSON с narrative, options и state_patch."
        val input = "Состояние: " + json.encodeToString(GameState.serializer(), state) + "\nДействие игрока: " + action
        val request = buildJsonObject {
            put("model", "gpt-5.6")
            put("instructions", instructions)
            put("input", input)
        }.toString()
        val response = json.parseToJsonElement(client.rawPost(key, request)).jsonObject
        val output = response["output"] as? JsonArray ?: error("Пустой ответ OpenAI")
        val text = output.asSequence()
            .mapNotNull { it as? JsonObject }
            .flatMap { ((it["content"] as? JsonArray)?.asSequence() ?: emptySequence()) }
            .mapNotNull { it as? JsonObject }
            .mapNotNull { (it["text"] as? JsonPrimitive)?.contentOrNull }
            .firstOrNull()
            ?: error("OpenAI не вернул текст")
        return parse(text)
    }

    private fun parseOptions(element: JsonElement?): List<String> {
        val array = element as? JsonArray ?: return emptyList()
        return array.mapNotNull { item ->
            when (item) {
                is JsonPrimitive -> item.contentOrNull
                is JsonObject -> {
                    val value = item["text"] ?: item["label"] ?: item["title"] ?: item["action"]
                    (value as? JsonPrimitive)?.contentOrNull
                }
                is JsonArray -> item.firstOrNull()?.let { (it as? JsonPrimitive)?.contentOrNull }
                else -> null
            }
        }.filter { it.isNotBlank() }
    }

    private fun parse(raw: String): GmReply {
        var text = raw.trim().removePrefix("~~~json").removePrefix("~~~").removeSuffix("~~~").trim()
        val first = text.indexOf('{')
        val last = text.lastIndexOf('}')
        if (first >= 0 && last > first) text = text.substring(first, last + 1)
        val obj = json.parseToJsonElement(text).jsonObject
        return GmReply(
            narrative = (obj["narrative"] as? JsonPrimitive)?.contentOrNull ?: "Сцена продолжается.",
            options = parseOptions(obj["options"]),
            patch = obj["state_patch"] as? JsonObject ?: JsonObject(emptyMap())
        )
    }
}
