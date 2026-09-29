package ru.eyrdan.rpg

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class GameViewModel(app: Application) : AndroidViewModel(app) {
    private val repository = GameRepository(app)
    private val _state = MutableStateFlow(GameState())
    val state: StateFlow<GameState> = _state.asStateFlow()
    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    init { viewModelScope.launch { repository.load()?.let { _state.value = it } } }

    fun submitAction(action: String) {
        if (action.isBlank() || _busy.value) return
        val current = _state.value
        _state.value = current.copy(
            narrative = (current.narrative + "Вы: " + action).takeLast(4),
            options = listOf("Продолжить", "Осмотреться", "Сделать что-то другое")
        )
        viewModelScope.launch { repository.save(_state.value) }
    }

    fun rollD20(modifier: Int = 0, dc: Int = 10): DiceResult = DiceEngine.d20(modifier, dc)
}
