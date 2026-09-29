package ru.eyrdan.rpg

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

class OpenAiClient {
    suspend fun rawPost(apiKey: String, body: String): String = withContext(Dispatchers.IO) {
        require(apiKey.isNotBlank()) { "API-ключ не настроен" }
        val c = (URL("https://api.openai.com/v1/responses").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"; connectTimeout = 30_000; readTimeout = 90_000; doOutput = true
            setRequestProperty("Authorization", "Bearer $apiKey")
            setRequestProperty("Content-Type", "application/json")
        }
        c.outputStream.use { it.write(body.toByteArray()) }
        val stream = if (c.responseCode in 200..299) c.inputStream else c.errorStream
        val text = stream.bufferedReader().use { it.readText() }
        if (c.responseCode !in 200..299) error("OpenAI HTTP ${c.responseCode}: $text")
        text
    }
}
