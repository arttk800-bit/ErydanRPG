# Eirdan — Development Log

## 2026-10-04 — 0.40.0-alpha · Systems Alpha

Проект переходит с прежнего обозначения 0.15 к этапу 0.40 Systems Alpha. Версия теперь отражает состояние игровых систем, а diagnostic-N остаётся номером технической сборки.

### Уже сформированный фундамент
- главное меню, настройки, темы интерфейса и полноэкранный режим;
- автоматическая проверка версии и диагностические сборки;
- карта мира, региональная и городская навигация, путешествия;
- базовая экипировка и инвентарь;
- квадратное изометрическое тактическое поле;
- ручное управление, автобой, AI и массовые симуляции;
- физическая боевая модель Eirdan с частями тела и экипировкой.

### Текущий этап — Inventory 2.0

**0.40.3-alpha / diagnostic-52:** drag-and-drop удалён. Предмет выбирается тапом и переносится тапом по клетке; сетка контейнера квадратная. Удержание открывает адаптивную карточку предмета слева/справа по свободному месту. Добавлена контекстная панель действий и компактная WoW-подобная сетка экипировки. Серый overflow больше не рисуется.

### Текущий этап — Inventory 2.0

**0.40.2-alpha / diagnostic-51:** инвентарь получил цельную клеточную сетку и мобильное управление: короткий тап выбирает предмет, удержание ~180 мс начинает перенос, отпускание пытается уложить предмет в выбранную клетку, отдельная кнопка вращает W×H. Выделение текста и touch-callout на элементах инвентаря отключены.

### Текущий этап — Inventory 2.0

**diagnostic-50 hotfix:** загрузчик переведён на неблокирующую схему. Проверка build.json больше не ждёт синхронного появления index.html; при новой версии текущая сборка запускается, а обновление применяется отдельной кнопкой. Ошибка сети также не блокирует игру.

### Текущий этап — Inventory 2.0

**0.40.1-alpha / diagnostic-48:** создан первый рабочий слой Inventory 2.0: объединённый экран, компактный персонаж, выдвижные характеристики, физическая сетка контейнера, размеры предметов W×H и отдельное содержимое рюкзаков.

### Текущий этап — Inventory 2.0
Переходим от абстрактного количества слотов к физическому инвентарю. Каждый контейнер хранит собственное содержимое и имеет двумерную сетку. Предметы занимают несколько клеток, имеют размеры и вес. Снятие заполненного контейнера не уничтожает и не выгружает его содержимое.

### Правило разработки
Основные этапы выполняются по ROADMAP.md по порядку. Заметные баги, визуальная кривизна и проблемы UX исправляются по мере обнаружения, даже если относятся к уже пройденной системе.


## 0.41.0-alpha / diagnostic-55 — Inventory 2.1
- Начат оконный интерфейс: инвентарь перемещается, масштабируется браузерным resize, сворачивается и запоминает положение.
- Персонаж и контейнеры разделены на режимы одного окна; следующий шаг — независимые одновременные окна и item sprites.
- Рабочая область увеличена под мобильный экран.


## 0.43.0-alpha · diagnostic-57 — Inventory 3.0 foundation
- Unique runtime item instances (`itm_*`) with exactly one location.
- Multiple equipped containers rendered simultaneously.
- Separate movable Character and Environment windows.
- Dropped equipment/items move to Environment instead of disappearing.
- Atomic equipment replacement: old equipment needs valid container space first.
- Touch Pointer Events drag-and-drop between inventory, equipment and environment.
- Rotation couples footprint and visual orientation.
- Minimal starter inventory; closable item debug spawner.
- Larger temporary backpack grids for testing.


## 0.43.1-alpha · diagnostic-58 — Inventory window UX
- Added bottom gameplay dock: Inventory / Character / Environment.
- Every equipped bag renders as its own movable independent window.
- Inventory cells use one fixed 46px size regardless of container capacity; large bags scroll instead of shrinking cells.
- Environment is a fixed scrollable grid with fixed-size cells and dynamically expanding capacity.
- Touch drag ghost follows the pointer continuously; Pointer Events remain the source of truth.
- Global text selection and touch callout disabled to avoid interfering with drag/tap.
- Item actions remain in a separate compact action window.
- Removed visible build/version labels from gameplay screens; version remains in main menu.


## 0.43.2-alpha · diagnostic-59 — Inventory interaction fixes
- Removed the shared Actions window from inventory UX.
- Container actions are local: Sort, Drop all with confirmation, Wear when applicable.
- Character and Environment buttons no longer open inventory bags.
- Fixed bag-window first-drag coordinate jump.
- Drag ghost follows pointer and no longer blocks drop hit-testing.
- Equipped items use the same tap/hold/drag binding.
- Long-press tooltip closes on release.
- Item actions open beside the selected item.
