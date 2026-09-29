package ru.eyrdan.rpg

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class GameViewModel : ViewModel() {
    private val _state = MutableStateFlow(GameState())
    val state: StateFlow<GameState> = _state.asStateFlow()

    fun submitAction(action: String) {
        if (action.isBlank()) return
        val current = _state.value
        _state.value = current.copy(
            narrative = (current.narrative + "Вы: $action").takeLast(4),
            options = listOf("Продолжить", "Осмотреться", "Сделать что-то другое")
        )
    }
}
