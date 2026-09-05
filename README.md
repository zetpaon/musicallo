# 🎵 Musicallo — Угадай трек

Интерактивная веб-игра "Угадай название музыкального трека" с системой уровней, рейтингом и социальными функциями. Полностью рефакторизированный модульный код с современным дизайном и продвинутыми возможностями.

## 🎮 Как это работает

1. **Слушайте фрагмент** — вам проигрывается небольшой отрывок трека
2. **Угадайте название** — введите название трека или исполнителя
3. **Получайте очки** — чем быстрее угадаете, тем больше очков
4. **Поднимайте уровень** — улучшайте свой рейтинг и соревнуйтесь с друзьями

## ✨ Основные возможности

- 🎧 **Адаптивное п��ослушивание**: Фрагмент увеличивается от 0.1 до 8 секунд с каждой попыткой
- 📈 **Система уровней**: 150 очков для первого уровня, затем прогрессия увеличивается
- 💾 **Профиль пользователя**: Регистрация, аватар, никнейм, статистика
- 🔄 **Кулдаун на повторы**: Один трек можно играть 1 раз в 7 дней
- 🎨 **Современный дизайн**: Темная тема с градиентами и анимациями
- 📱 **Мобильная оптимизация**: Работает на всех устройствах (адаптивный дизайн)
- 🏆 **Цветные бейджи уровней**: Визуальное отображение прогресса
- 🌍 **Глобальный рейтинг**: Соревнуйтесь с другими игроками (топ-100)
- 📊 **Различные рейтинги**: По очкам, за неделю, по точности, по достижениям
- 🎯 **Система достижений**: 20+ уникальных достижений с разными уровнями редкости
- 🎵 **Интеграция с музыкальными API**: Поддержка Spotify, YouTube Music, SoundCloud
- 🔧 **Продвинутая админ-панель**: Управление треками, пользователями и данными

## 🛠️ Стек технологий

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Архитектура**: Модульная система (разделено на компоненты)
- **Хранилище данных**: Firebase Firestore (профили, очки, рейтинги)
- **Аутентификация**: Firebase Auth (email/password)
- **Хостинг**: GitHub Pages (ветка `pages`)
- **Музыкальные данные**: JSON файл в репозитории
- **API интеграция**: Spotify, YouTube, SoundCloud

## 📦 Установка и запуск

### Предварительные требования

- Node.js 14+ (опционально, для локального разработчика сервера)
- Modern browser (Chrome, Firefox, Safari, Edge)
- Firebase Account (для настройки backend)

### Локальное развитие

```bash
# Клонируйте репозиторий
git clone https://github.com/zetpaon/musicallo.git
cd musicallo

# Установите зависимости
npm install

# Запустите локальный сервер
npm start
# или для разработки с CORS
npm run dev

# Откройте в браузере
# http://localhost:8000
```

### Альтернатива без Node.js

```bash
# Используйте встроенный Python сервер
python -m http.server 8000
# затем откройте http://localhost:8000
```

### Развертывание на GitHub Pages

1. Создайте или переключитесь на ветку `pages`:
```bash
git checkout -b pages
```

2. Добавьте все файлы и сделайте коммит:
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin pages
```

3. GitHub автоматически развернет сайт на `https://zetpaon.github.io/musicallo/`

## 📂 Структура проекта

```
musicallo/
├── index.html                    # Главная страница приложения
├── tracks.json                   # Данные треков (20+ треков)
├── package.json                  # Зависимости проекта (Node.js)
├── .env.example                  # Шаблон конфигурации Firebase
├── .env                          # Конфигурация Firebase (локальная, в .gitignore)
├── .gitignore                    # Исключения для Git
├── .eslintrc.json                # Конфигурация ESLint
├── .prettierrc.json              # Конфигурация Prettier
├── README.md                     # Этот файл
│
├── src/                          # Исходный код приложения
│   ├── js/                       # JavaScript модули
│   │   ├── main.js              # Главное приложение (инициализация)
│   │   ├── game.js              # Основная игровая логика
│   │   ├── leaderboard.js       # Система рейтинга и лидерборда
│   │   ├── difficulty.js        # Уровни сложности, достижения, статистика
│   │   ├── audio.js             # Управление аудиоплеером
│   │   ├── auth.js              # Аутентификация пользователей
│   │   ├── ui.js                # Базовые UI компоненты
│   │   ├── ui-manager.js        # Продвинутый менеджер интерфейса
│   │   ├── music-api.js         # API интеграция (Spotify, YouTube, SoundCloud)
│   │   ├── admin.js             # Админ-панель для управления контентом
│   │   └── firebase-config.js   # Конфигурация Firebase
│   │
│   └── css/                      # Таблицы стилей
│       ├── styles.css            # Основные стили
│       └── enhanced-ui.css       # Улучшенный дизайн (современный, с анимациями)
│
└── docs/                         # Документация проекта
```

## 🔧 Конфигурация Firebase

### Шаг 1: Создайте проект Firebase

1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Нажмите "Create Project" и заполните детали проекта
3. Включите **Firestore Database** в режиме "production"
4. Включите **Authentication** с методом Email/Password

### Шаг 2: Получите учетные данные

1. В Firebase Console перейдите в **Project Settings** (⚙️)
2. На вкладке "General" скопируйте всю ко��фигурацию Web App
3. Вам нужны следующие значения:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Шаг 3: Настройте .env

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Откройте `.env` и заполните значения из Firebase Console:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

⚠️ **ВАЖНО**: Никогда не коммитьте файл `.env` с реальными ключами в Git!

## 📊 Структура данных Firestore

### Collection: `users`

Каждый пользователь создает документ с ID = `uid` Firebase Auth:

```javascript
{
  uid: "user_id",                          // Firebase Auth ID
  email: "user@example.com",               // Email пользователя
  nickname: "PlayerNickname",              // Никнейм в игре
  avatarUrl: "https://...",                // URL аватара (опционально)
  score: 1250,                             // Текущие очки в уровне
  level: 5,                                // Текущий уровень
  totalScore: 5000,                        // Общие очки (за всю историю)
  totalGuesses: 150,                       // Всего угадано треков
  correctGuesses: 120,                     // Правильно угадано
  accuracy: 80,                            // Точность в %
  perfectStreak: 3,                        // Текущая серия без ошибок
  maxPerfectStreak: 15,                    // Максимальная серия
  playedTracks: {
    "track_id": 1694000000000,             // Timestamp последней игры трека
    "another_id": 1694000000000
  },
  achievements: ["first_guess", "level_5"],// Разблокированные достижения
  createdAt: "2024-01-15T10:30:00Z",      // Когда создан аккаунт
  lastPlayedAt: "2024-01-20T15:45:00Z"    // Когда последний раз играл
}
```

### Collection: `leaderboards` (опционально для кэша)

```javascript
{
  period: "global",                        // 'global', 'weekly', 'monthly'
  updatedAt: 1694000000000,                // Timestamp последнего обновления
  top100: [
    { uid: "...", nickname: "...", score: 9999, level: 50 },
    // ... остальные игроки
  ]
}
```

## 🎵 Формат tracks.json

```json
{
  "suggestions": [
    "YOASOBI - IDOL",
    "Ado - Usseewa",
    "The Weeknd - Blinding Lights",
    // ... список подсказок для автодополнения
  ],
  "tracks": [
    {
      "id": "unique_id_string",
      "fullName": "Artist - Track Name",
      "artist": "Artist Name",
      "title": "Track Name",
      "audioUrl": "https://example.com/track.mp3",
      "correctAnswers": [
        "artist - track name",
        "track name",
        "artist track name",
        "artist"
      ],
      "genre": "pop",                      // опционально
      "releaseYear": 2023                  // опционально
    }
    // ... остальные треки
  ]
}
```

### Требования к аудио URL:

- **Формат**: MP3, WAV, OGG, WebM
- **Длина**: минимум 10 секунд
- **Битрейт**: рекомендуется 128-192 kbps
- **CORS**: сервер должен разрешать CORS запросы
- **SSL**: рекомендуется использовать HTTPS URL

## 🎮 Игровая механика

### Система очков

| Попытка | Длительность | Очки | Бонус |
|---------|--------------|------|-------|
| 0 (Бонус)| 0.1 сек    | —    | 1.0x  |
| 1       | 0.5 сек      | 100  | Максимум |
| 2       | 1 сек        | 50   | 0.5x |
| 3       | 2 сек        | 25   | 0.25x |
| 4       | 3 сек        | 15   | 0.15x |
| 5       | 5 сек        | 10   | 0.1x |
| 6       | 8 сек        | 7    | 0.07x |
| 7       | Полный трек  | 5    | 0.05x |

**Примечание**: Очки зависят от уровня сложности и уровня пользователя.

### Система уровней

- **Уровни 1-10**: +150 очков за уровень
- **Уровни 11-20**: +155 очков за уровень
- **Уровни 21-30**: +160 очков за уровень
- **Уровни 31-40**: +165 очков за уровень
- **И далее**: +5 очков каждые 10 уровней

### Система уровней сложности

| Уровень | Коэффициент | Первый фрагмент | Макс фрагмент |
|---------|------------|-----------------|----------------|
| Легкий | 0.7x | 2 сек | 8 сек |
| Средний | 1.0x | 1 сек | 8 сек |
| Сложный | 1.5x | 0.5 сек | 8 сек |
| Экстрим | 2.0x | 0.05 сек | 8 сек |

## 🎯 Система достижений

Всего 20+ достижений в категориях:

### Базовые достижения
- 🎵 **Первый шаг** — угадайте первую песню
- 🔟 **Десятка** — угадайте 10 песен
- 💯 **Сотня** — угадайте 100 песен

### Скорость
- ⚡ **Демон скорости** — угадайте песню с первой попытки
- 🎯 **Отличный слух** — 5 песен подряд с первой попытки

### Сложность
- 🔴 **Вызов** — угадайте песню на сложном уровне
- ⚡ **Мастер экстрима** — 10 песен на уровне Экстрим

### Уровни
- ⭐ **Новичок** — достигните уровня 5
- ⭐⭐ **Опытный** — достигните уровня 10
- ⭐⭐⭐ **Эксперт** — достигните уровня 25
- 👑 **Легенда** — достигните уровня 50

### Специальные
- 🎼 **Коллекционер** — угадайте песни всех жанров
- 🌅 **Ранняя пташка** — сыграйте с 6 утра или раньше
- 🌙 **Ночная сова** — сыграйте после полуночи

## 🐛 Известные проблемы

- [x] ~~Весь код в одном HTML файле~~ — **РЕШЕНО** (разделено на модули)
- [x] ~~Firebase credentials видны в коде~~ — **РЕШЕНО** (добавлен .env)
- [x] ~~Ограниченное количество треков~~ — **РЕШЕНО** (20+ треков, легко расширяется)
- [x] ~~Нет рейтинга между игроками~~ — **РЕШЕНО** (полный глобальный рейтинг)

## 🚀 Планы развития

- [x] **Рефакторинг кода** (модули, компоненты)
- [x] **Админ-панель** для добавления треков
- [x] **Глобальный рейтинг** игроков
- [x] **Достижения и бейджи**
- [ ] **PWA поддержка** (офлайн-режим, установка как приложение)
- [ ] **Мультиязычность** (i18n: русский, английский, японский)
- [x] **API интеграция** (Spotify, YouTube, SoundCloud)
- [x] **Рекомендации треков** по жанрам
- [ ] **Социальные функции** (друзья, челленджи, шеринг результатов)
- [ ] **Мобильное приложение** (React Native, Flutter)
- [ ] **Музыкальные плейлисты** (создание и сохранение)

## 📝 Добавление новых треков

### Шаг 1: Найдите аудио URL

Используйте источники:

- **Spotify Preview**: `https://p.scdn.co/...`
- **YouTube Audio**: Используйте youtube-dl или подобный инструмент
- **SoundCloud API**: Официальное API для получения URL
- **Yandex Music**: Через неофициальное API или прямые ссылки
- **iTunes Audio Preview**: Доступны в iTunes API
- **Собственный хостинг**: Загрузите аудио на свой сервер

### Шаг 2: Создайте объект трека

```javascript
{
  "id": "artist-track-name",
  "fullName": "Artist - Track Name",
  "artist": "Artist",
  "title": "Track Name",
  "audioUrl": "https://direct_audio_url.mp3",
  "correctAnswers": [
    "artist - track name",
    "track name",
    "artist track name",
    "artist"
  ],
  "genre": "pop",              // опционально
  "releaseYear": 2023          // опционально
}
```

### Шаг 3: Добавьте в tracks.json

```bash
# Откройте tracks.json в редакторе
# Добавьте новый объект трека в массив "tracks"
# Добавьте предложения для автодополнения в массив "suggestions"
# Сделайте коммит и push
git add tracks.json
git commit -m "Add new tracks"
git push origin main
```

### Шаг 4 (опционально): Используйте админ-панель

Откройте админ-панель в приложении (если вы администратор) и добавьте треки через интерфейс.

## 🔐 Безопасность

### Приватные ключи

⚠️ **КРИТИЧНО**: Никогда не коммитьте файл `.env` с реальными ключами!

```bash
# .env уже добавлен в .gitignore
# Проверьте:
cat .gitignore | grep ".env"

# Если .env был случайно закоммичен, удалите его:
git rm --cached .env
git commit -m "Remove .env from tracking"
```

### Правила безопасности Firebase

Добавьте в Firestore Security Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth.uid == userId || true; // публичный профиль
      allow write: if request.auth.uid == userId;
      allow delete: if false;
    }
    
    match /leaderboards/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## 🎬 Скриншоты и демо

🔗 **Живая демо**: [https://zetpaon.github.io/musicallo/](https://zetpaon.github.io/musicallo/)

## 📚 Документация API

### GameManager

```javascript
// Инициализация
const gameManager = new GameManager();

// Загрузить треки
await gameManager.loadTracks();

// Выбрать трек
gameManager.selectTrack(userData);

// Проверить ответ
gameManager.checkGuess("guess text");

// Пропустить попытку
gameManager.skipAttempt();

// Получить состояние игры
gameManager.getGameState();

// Получить информацию об уровне
GameManager.getLevelInfo(score);
```

### LeaderboardManager

```javascript
const leaderboard = new LeaderboardManager();

// Топ игроки
await leaderboard.getGlobalTopPlayers();

// Рейтинг за период
await leaderboard.getLeaderboardByPeriod('weekly');

// Позиция игрока
await leaderboard.getPlayerRank(uid);

// Рейтинг по точности
await leaderboard.getAccuracyLeaderboard();

// Сравнение игроков
await leaderboard.comparePlayersStats(uid1, uid2);
```

### UIManager

```javascript
const ui = new UIManager();

// Модальные окна
ui.openModal('profile-modal', options);
ui.closeModal('profile-modal');

// Уведомления
ui.success('Сохранено!');
ui.error('Ошибка!');
ui.warning('Внимание!');
ui.info('Информация');

// Подсказки
ui.createTooltip(element, 'Текст подсказки', 'top');

// Табы
ui.initTabs(tabsContainer);

// Прогресс
ui.updateProgress(progressElement, 75);
```

## 📞 Контакты и обратная связь

- **GitHub Issues**: [報告バグや提案](https://github.com/zetpaon/musicallo/issues)
- **Email**: Напишите в Issues
- **Discord**: TBA

## 📄 Лицензия

[MIT License](LICENSE) — свободно используйте в своих проектах

## 👤 Автор

**zetpaon** — создатель проекта

## 🤝 Контрибьютинг

Хотите помочь улучшить проект?

1. **Fork** репозиторий
2. Создайте **ветку** для вашей фичи:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Сделайте коммит** с описанием:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push** в вашу ветку:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Откройте **Pull Request** с описанием изменений

## 🙏 Благодарности

Спасибо всем, кто помогал с:
- Дизайном и UX
- Тестированием
- Предложениями по развитию
- Добавлением новых треков

---

**Сделано с ❤️ для любителей музыки**

**v1.0.0** | Последнее обновление: Сентябрь 2026
