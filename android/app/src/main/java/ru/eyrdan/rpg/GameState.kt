package ru.eyrdan.rpg

import kotlinx.serialization.Serializable

@Serializable
data class CharacterState(
    val name: String = "Безымянный",
    val race: String = "",
    val age: Int? = null,
    val hp: Int = 100,
    val maxHp: Int = 100,
    val fatigue: String = "нет",
    val hunger: String = "нет",
    val thirst: String = "нет"
)

@Serializable
data class GameState(
    val date: String = "1 день",
    val time: String = "08:00",
    val place: String = "Неизвестное место",
    val character: CharacterState = CharacterState(),
    val narrative: List<String> = listOf("Новая история готова начаться."),
    val options: List<String> = listOf("Осмотреться", "Проверить свои вещи", "Оценить обстановку"),
    val inventory: List<String> = emptyList()
)
