package ru.eyrdan.rpg

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { EyrdanTheme { EyrdanApp() } }
    }
}

enum class Screen(val title: String) { GAME("Игра"), CHARACTER("Персонаж"), STATUS("Состояние"), INVENTORY("Инвентарь"), WORLD("Мир") }

@Composable
fun EyrdanTheme(content: @Composable () -> Unit) {
    val colors = darkColorScheme(
        primary = Color(0xFFB98A52), secondary = Color(0xFF80623F),
        background = Color(0xFF100D0B), surface = Color(0xFF1A1511),
        onBackground = Color(0xFFE8DED1), onSurface = Color(0xFFE8DED1)
    )
    MaterialTheme(colorScheme = colors, content = content)
}

@Composable
fun EyrdanApp(vm: GameViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    var screen by rememberSaveable { mutableStateOf(Screen.GAME) }
    Scaffold(
        bottomBar = {
            NavigationBar {
                listOf(
                    Screen.GAME to Icons.Default.AutoStories,
                    Screen.CHARACTER to Icons.Default.Person,
                    Screen.STATUS to Icons.Default.Favorite,
                    Screen.INVENTORY to Icons.Default.Backpack,
                    Screen.WORLD to Icons.Default.Public
                ).forEach { (s, icon) ->
                    NavigationBarItem(selected = screen == s, onClick = { screen = s }, icon = { Icon(icon, s.title) }, label = { Text(s.title) })
                }
            }
        }
    ) { pad ->
        Box(Modifier.padding(pad).fillMaxSize()) {
            when (screen) {
                Screen.GAME -> GameScreen(state, vm::submitAction)
                Screen.CHARACTER -> CharacterScreen(state)
                Screen.STATUS -> StatusScreen(state)
                Screen.INVENTORY -> InventoryScreen(state)
                Screen.WORLD -> WorldScreen(state)
            }
        }
    }
}

@Composable
fun GameScreen(state: GameState, onAction: (String) -> Unit) {
    var input by rememberSaveable { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("ЭЙРДАН", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary)
        Text("${state.date} · ${state.time} · ${state.place}", style = MaterialTheme.typography.bodySmall)
        LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.narrative) { Card { Text(it, Modifier.padding(14.dp)) } }
            item {
                state.options.forEachIndexed { i, option ->
                    OutlinedButton(onClick = { onAction(option) }, modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
                        Text("${'А' + i}) $option")
                    }
                }
            }
        }
        OutlinedTextField(input, { input = it }, Modifier.fillMaxWidth(), placeholder = { Text("Что ты делаешь?") })
        Button(onClick = { onAction(input); input = "" }, modifier = Modifier.fillMaxWidth()) { Text("Действовать") }
    }
}

@Composable fun CharacterScreen(s: GameState) = InfoScreen("Персонаж", listOf("Имя" to s.character.name, "Раса" to (s.character.race.ifBlank { "не выбрана" }), "Возраст" to (s.character.age?.toString() ?: "не выбран"), "HP" to "${s.character.hp}/${s.character.maxHp}"))
@Composable fun StatusScreen(s: GameState) = InfoScreen("Состояние", listOf("Усталость" to s.character.fatigue, "Голод" to s.character.hunger, "Жажда" to s.character.thirst))
@Composable fun InventoryScreen(s: GameState) = InfoScreen("Инвентарь", if(s.inventory.isEmpty()) listOf("Предметы" to "пусто") else s.inventory.map { "Предмет" to it })
@Composable fun WorldScreen(s: GameState) = InfoScreen("Мир", listOf("Текущее место" to s.place, "Дата" to s.date, "Время" to s.time))

@Composable
fun InfoScreen(title: String, rows: List<Pair<String,String>>) {
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(title, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary)
        rows.forEach { (k,v) -> Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(14.dp)) { Text(k, style=MaterialTheme.typography.labelMedium); Text(v) } } }
    }
}
