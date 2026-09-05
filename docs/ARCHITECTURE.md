# 🏗️ Архитектура Musicallo

## Обзор

Musicallo — это одностраничное приложение (SPA) на Vanilla JavaScript с использованием Firebase для аутентификации и хранения данных. Приложение построено на модульной архитектуре с четким разделением ответственности.

```
┌─────────────────────────────────────────┐
│           index.html (UI)               │
├─────────────────────────────────────────┤
│         main.js (Orchestrator)          │
├──────────┬──────────┬──────────┬────────┤
│ game.js  │ audio.js │ auth.js  │ ui.js  │
├──────────┴──────────┴──────────┴────────┤
│      firebase-config.js (Firebase)      │
└─────────────────────────────────────────┘
```

## Структура модулей

### 1. **main.js** (Главный модуль - Orchestrator)
**Ответственность:** Связывает все компоненты и управляет потоком приложения

**Главный класс:** `MusicalloApp`

**Основные методы:**
- `init()` — инициализация приложения
- `setupEventListeners()` — регистрация всех обработчиков событий
- `handleLogin()` / `handleRegister()` / `handleLogout()` — управление аутентификацией
- `initializeGame()` — инициализация игры
- `handlePlayClick()` — воспроизведение аудио
- `handleGuessSubmit()` — обработка ответа игрока
- `handleNextGame()` — переход к следующей игре

**Поток:**
```
Загрузка страницы
    ↓
main.js инициализирует
    ↓
Проверка сессии (authManager)
    ↓
Если авторизован → showGameUI()
Если нет → showAuthUI()
    ↓
Загрузка треков (gameManager)
    ↓
Готово к игре
```

---

### 2. **game.js** (Игровая логика)
**Ответственность:** Управление логикой игры, расчет очков, выбор треков

**Главный класс:** `GameManager`

**Экспортируемые константы:**
```javascript
TRACKS_URL = "tracks.json"
DURATIONS = [100, 500, 1000, 2000, 3000, 5000, 8000, null]  // мс
SCORES = [100, 50, 25, 15, 10, 7, 5]  // очки за попытку
BONUS_STEP = 0  // первая попытка не дает бонус
MAX_ATTEMPTS = 7  // максимум 7 попыток
```

**Основные методы:**
- `loadTracks()` — загрузка треков из tracks.json
- `selectTrack(user)` — выбор трека с учетом cooldown'а
- `checkGuess(guess)` — проверка ответа игрока
- `skipAttempt()` — пропуск текущей попытки
- `giveUp()` — сдача
- `getSuggestions(input)` — автодополнение
- `getGameState()` — получить состояние игры
- `resetGame()` — сброс текущей игры

**Состояние игры:**
```javascript
{
  currentTrack: {...},
  currentStep: 0,        // 0-6 (попытка)
  currentPlayStart: 100, // мс
  currentPlayEnd: 500,   // мс
  attempts: 3,
  guessed: false,
  score: 0
}
```

**Логика выбора трека:**
```
Получить список треков из tracks.json
    ↓
Отфильтровать уже сыгранные в течение 7 дней (cooldown)
    ↓
Выбрать случайный из оставшихся
    ↓
Вернуть выбранный трек
```

**Логика проверки ответа:**
```
Привести ответ к нижнему регистру и убрать пробелы
    ↓
Проверить против correctAnswers трека
    ↓
Если правильно:
  - Рассчитать очки в зависимости от попытки
  - Вернуть {correct: true, points: X, attempt: Y}
  ↓
Если неправильно:
  - Если остались попытки: вернуть {correct: false}
  - Если нет попыток: gameOver()
```

---

### 3. **audio.js** (Управление аудио)
**Ответственность:** Загрузка, воспроизведение и управление аудио

**Главный класс:** `AudioManager`

**Основные методы:**
- `preloadTrackAudio(track)` — предварительная загрузка трека
- `playSegment(start, end)` — воспроизведение отрывка (мс)
- `pausePlayback()` — пауза
- `clearAudio()` — очистка
- `getIsPlaying()` — проверка статуса

**Технические детали:**
- Использует Web Audio API для точного воспроизведения отрывков
- Кэширует загруженные треки
- Поддерживает CORS для удаленных MP3

```javascript
// Пример использования
const audio = new AudioManager();
const result = await audio.preloadTrackAudio(track);
audio.playSegment(100, 500); // Играет с 100мс по 500мс
```

---

### 4. **auth.js** (Аутентификация)
**Ответственность:** Управление аутентификацией через Firebase, управление профилем

**Главный класс:** `AuthManager`

**Основные методы:**
- `login(email, password)` — вход
- `register(email, password)` — регистрация
- `logout()` — выход
- `verifyToken()` — проверка валидности токена
- `getCurrentUser()` — получить текущего пользователя
- `updateProfile(nickname, avatarUrl)` — обновить профиль
- `saveGameResult(result)` — сохранить результат игры
- `loadSession()` — загрузить сохраненную сессию

**Данные пользователя в Firestore:**
```javascript
{
  uid: "firebase_uid",
  email: "user@example.com",
  nickname: "UserNickname",
  avatarUrl: "https://avatar.jpg",
  score: 1250,
  level: 5,
  playedTracks: {
    "track_id_1": 1694000000000,  // timestamp последней игры
    "track_id_2": 1694000000000
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Защита данных:**
```
Перед сохранением результата:
  ↓
Проверить авторизацию пользователя
  ↓
Валидировать данные результата
  ↓
Обновить в Firestore
  ↓
Обновить локальное состояние
```

---

### 5. **ui.js** (Управление UI)
**Ответственность:** Отображение элементов интерфейса, обновление состояния UI

**Главный класс:** `UIManager`

**Основные методы:**

**Auth UI:**
- `showGameContainer()` — показать игру
- `hideGameContainer()` — скрыть игру
- `showAuthError(error)` — показать ошибку входа

**Game UI:**
- `updateGameState(state)` — обновить состояние игры
- `updateStats(score, user)` — обновить статистику
- `showResult(result, state)` — показать результат (правильно/неправильно)
- `showGameOver(result)` — показать конец игры
- `showSuggestions(suggestions)` — показать подсказки
- `clearGameScreen()` — очистить экран для новой игры

**Profile UI:**
- `updateProfileDisplay(user)` — обновить отображение профиля
- `closeProfileModal()` — закрыть модал профиля
- `showProfileError(error)` — показать ошибку профиля

**Общие методы:**
- `showLoading()` — показать загрузку
- `hideLoading()` — скрыть загрузку
- `showError(message)` — показать ошибку

**События (Custom Events):**
```javascript
// Генерируемые UI в main.js
window.dispatchEvent(new CustomEvent('login-attempt', {detail: {email, password}}))
window.dispatchEvent(new CustomEvent('register-attempt', {detail: {email, password}}))
window.dispatchEvent(new CustomEvent('guess-submit', {detail: {guess}}))
window.dispatchEvent(new CustomEvent('play-click'))
window.dispatchEvent(new CustomEvent('skip-click'))
window.dispatchEvent(new CustomEvent('give-up-click'))
window.dispatchEvent(new CustomEvent('next-game'))
```

---

### 6. **firebase-config.js** (Конфигурация Firebase)
**Ответственность:** Инициализация Firebase и экспорт необходимых сервисов

```javascript
// Экспортирует:
- db (Firestore)
- auth (Firebase Auth)
- initializeApp() результат
```

**Использование переменных окружения:**
```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
```

---

## Поток данных

### Регистрация/Вход:
```
index.html (форма)
    ↓
main.js → handleLogin() / handleRegister()
    ↓
authManager.login() / register()
    ↓
Firebase Auth
    ↓
Firestore (создать/обновить документ пользователя)
    ↓
uiManager.showGameUI()
    ↓
gameManager.loadTracks()
```

### Игровой процесс:
```
Пользователь нажимает Play
    ↓
main.js → handlePlayClick()
    ↓
audioManager.playSegment(start, end)
    ↓
Web Audio API воспроизводит отрывок
    ↓
Пользователь вводит ответ
    ↓
main.js → handleGuessSubmit()
    ↓
gameManager.checkGuess()
    ↓
Если правильно:
  - authManager.saveGameResult() → Firestore
  - uiManager.showResult()
  - uiManager.updateStats()
```

### Выбор трека:
```
gameManager.selectTrack(user)
    ↓
Проверить cooldown в user.playedTracks
    ↓
Отфильтровать треки, сыгранные за последние 7 дней
    ↓
Выбрать случайный из оставшихся
    ↓
audioManager.preloadTrackAudio()
    ↓
Готово к игре
```

---

## Состояние приложения

### Глобальное состояние (в MusicalloApp):
```javascript
{
  gameManager: GameManager instance,
  uiManager: UIManager instance,
  audioManager: AudioManager instance,
  authManager: AuthManager instance,
  currentTrack: Track object или null,
  currentTrackUrl: string
}
```

### Локальное состояние модулей:
- **GameManager:** текущий трек, шаг, попытки, очки
- **AudioManager:** загруженные треки, статус воспроизведения
- **AuthManager:** текущий пользователь, сессия
- **UIManager:** открытые модалы, видимые элементы

---

## Жизненный цикл приложения

```
1. INIT (Инициализация)
   ↓
2. AUTH (Аутентификация)
   ├─ Если не авторизован → Show Auth UI
   └─ Если авторизован → Load Game
   ↓
3. LOAD (Загрузка)
   - loadTracks()
   - selectTrack()
   - preloadAudio()
   ↓
4. GAME (Игра)
   ├─ Play Audio
   ├─ Submit Guess
   ├─ Check Answer
   ├─ Update Stats
   └─ Next Game → вернуться в 3
   ↓
5. LOGOUT
   - clearAudio()
   - clearSession()
   → вернуться в 2
```

---

## Безопасность

### Клиент:
- Firebase Security Rules проверяют владение документом
- Хранение токена в localStorage (с экспирацией)

### Сервер (Firestore Rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Только аутентифицированные пользователи
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Только чтение для треков
    match /tracks/{trackId} {
      allow read: if request.auth != null;
    }
  }
}
```

---

## Производительность

### Оптимизации:
1. **Ленивая загрузка аудио** — загружаются только при выборе трека
2. **Кэширование треков** — предварительная загрузка для быстрого воспроизведения
3. **Минимизированный CSS** — один файл styles.css
4. **Модульная архитектура** — легко добавлять новые функции

### Размер бандла:
- HTML: ~8KB
- CSS: ~13KB
- JS (main): ~8KB
- JS (game): ~7KB
- JS (audio): ~4KB
- JS (auth): ~4KB
- JS (ui): ~12KB
- **Всего: ~56KB** (без сжатия)

---

## Расширяемость

### Добавление новой функции:

1. **Создать новый модуль** (e.g., `leaderboard.js`)
2. **Экспортировать класс** с методами
3. **Импортировать в main.js**
4. **Создать экземпляр** в конструкторе MusicalloApp
5. **Добавить обработчики событий** в setupEventListeners()

Пример:
```javascript
// leaderboard.js
export class LeaderboardManager {
  async getTopPlayers() { ... }
  async getPlayerRank(uid) { ... }
}

// main.js
import { LeaderboardManager } from './leaderboard.js';
...
this.leaderboardManager = new LeaderboardManager();
```

---

## Тестирование

### Unit-тесты:
- `tests/game.test.js` — тесты GameManager
- `tests/auth.test.js` — тесты AuthManager
- `tests/audio.test.js` — тесты AudioManager

### Integration-тесты:
- Полный игровой сценарий (регистрация → игра → результат)
- Проверка сохранения данных в Firestore

### E2E-тесты:
- Cypress или Playwright для полного тестирования UI

---

## Диаграмма зависимостей

```
main.js
  ├── game.js
  ├── audio.js
  ├── auth.js
  ├── ui.js
  └── firebase-config.js
       └── Firebase SDK

index.html
  ├── styles.css
  └── main.js (module)
```

---

**Этот документ поддерживает версию 1.0 архитектуры Musicallo**
