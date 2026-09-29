package ru.eyrdan.rpg

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.settingsStore by preferencesDataStore("eyrdan_settings")

class ApiKeyStore(private val context: Context) {
    private val apiKey = stringPreferencesKey("openai_api_key")
    suspend fun get(): String = context.settingsStore.data.first()[apiKey].orEmpty()
    suspend fun set(value: String) { context.settingsStore.edit { it[apiKey] = value.trim() } }
}
