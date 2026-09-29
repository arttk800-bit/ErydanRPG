package ru.eyrdan.rpg

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.io.File

@Serializable
data class SaveCharacter(
    val name: String = "Безымянный", val race: String = "", val age: Int? = null,
    val hp: Int = 100, val maxHp: Int = 100, val fatigue: String = "нет",
    val hunger: String = "нет", val thirst: String = "нет"
)

@Serializable
data class SaveGame(
    val date: String = "1 день", val time: String = "08:00", val place: String = "Неизвестное место",
    val character: SaveCharacter = SaveCharacter(), val narrative: List<String> = listOf("Новая история готова начаться."),
    val options: List<String> = listOf("Осмотреться", "Проверить свои вещи", "Оценить обстановку"),
    val inventory: List<String> = emptyList()
)

class GameRepository(private val context: Context) {
    private val json = Json { prettyPrint = true; ignoreUnknownKeys = true }
    private val saveFile get() = File(context.filesDir, "eyrdan_autosave.json")

    suspend fun save(state: GameState) = withContext(Dispatchers.IO) {
        val dto = SaveGame(state.date,state.time,state.place,
            SaveCharacter(state.character.name,state.character.race,state.character.age,state.character.hp,state.character.maxHp,state.character.fatigue,state.character.hunger,state.character.thirst),
            state.narrative,state.options,state.inventory)
        saveFile.writeText(json.encodeToString(dto))
    }

    suspend fun load(): GameState? = withContext(Dispatchers.IO) {
        if (!saveFile.exists()) return@withContext null
        runCatching {
            val x=json.decodeFromString<SaveGame>(saveFile.readText())
            GameState(x.date,x.time,x.place,CharacterState(x.character.name,x.character.race,x.character.age,x.character.hp,x.character.maxHp,x.character.fatigue,x.character.hunger,x.character.thirst),x.narrative,x.options,x.inventory)
        }.getOrNull()
    }
}
