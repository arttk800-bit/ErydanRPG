package ru.eyrdan.rpg

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class GameViewModel(app: Application) : AndroidViewModel(app) {
    private val repository = GameRepository(app)
    private val keyStore = ApiKeyStore(app)
    private val gm = GmEngine()
    private val _state = MutableStateFlow(GameState())
    val state: StateFlow<GameState> = _state.asStateFlow()
    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()
    private val _error = MutableStateFlow<String?>(null)
    private val _hasApiKey = MutableStateFlow(false)
    val hasApiKey: StateFlow<Boolean> = _hasApiKey.asStateFlow()
    val error: StateFlow<String?> = _error.asStateFlow()

    init { viewModelScope.launch { repository.load()?.let { _state.value = it }; _hasApiKey.value = keyStore.get().isNotBlank() } }

    fun submitAction(action: String) {
        if (action.isBlank() || _busy.value) return
        viewModelScope.launch {
            _busy.value = true
            _error.value = null
            try {
                val key = keyStore.get()
                val current = _state.value
                val reply = gm.turn(key, current, action)
                _state.value = current.copy(
                    narrative = (current.narrative + ("Вы: " + action) + reply.narrative).takeLast(6),
                    options = if (reply.options.isEmpty()) listOf("Осмотреться", "Продолжить", "Свой вариант") else reply.options.take(5)
                )
                repository.save(_state.value)
            } catch (e: Exception) {
                _error.value = e.message ?: "Ошибка"
            } finally { _busy.value = false }
        }
    }

    fun saveApiKey(value: String) { viewModelScope.launch { keyStore.set(value); _hasApiKey.value = value.isNotBlank() } }
    fun rollD20(modifier: Int = 0, dc: Int = 10): DiceResult = DiceEngine.d20(modifier, dc)
}
