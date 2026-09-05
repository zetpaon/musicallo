# 🎵 Musicallo — Угадай трек

Интерактивная веб-игра "Угадай название музыкального трека" с системой уровней, рейтингом и социальными функциями.

## 🎮 Как это работает

1. **Слушайте фрагмент** — вам проигрывается небольшой отрывок трека
2. **Угадайте название** — введите название трека или исполнителя
3. **Получайте очки** — чем быстрее угадаете, тем больше очков
4. **Поднимайте уровень** — улучшайте свой рейтинг и соревнуйтесь с друзьями

## ✨ Основные возможности

- 🎧 **Адаптивное прослушивание**: Фрагмент увеличивается от 0.1 до 8 секунд с каждой попыткой
- 📈 **Система уровней**: 150 очков для первого уровня, затем прогрессия увеличивается
- 💾 **Профиль пользователя**: Регистрация, аватар, никнейм
- 🔄 **Кулдаун на повторы**: Один трек можно играть 1 раз в 7 дней
- 🎨 **Современный дизайн**: Темная тема с градиентами и анимациями
- 📱 **Мобильная оптимизация**: Работает на всех устройствах
- 🏆 **Цветные бейджи уровней**: Визуальное отображение прогресса

## 🛠️ Стек технологий

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Хранилище данных**: Firebase Firestore (профили, очки)
- **Аутентификация**: Firebase Auth (email/password)
- **Хостинг**: GitHub Pages (ветка `pages`)
- **Музыкальные данные**: JSON файл в ветке `data`

## 📦 Установка и запуск

### Локальное развитие

```bash
# Клонируйте репозиторий
git clone https://github.com/zetpaon/musicallo.git
cd musicallo

# Установите зависимости (если используется Node.js)
npm install

# Откройте в браузере
# Просто откройте index.html из ветки pages или используйте local server:
python -m http.server 8000
# затем откройте http://localhost:8000
```

### Развертывание

Проект использует GitHub Pages. Просто:
1. Обновите ветку `pages` с вашими изменениями
2. GitHub автоматически развернет сайт на `https://zetpaon.github.io/musicallo/`

## 📂 Структура проекта

```
musicallo/
├── index.html                # Главная страница (ветка pages)
├── tracks.json              # Данные треков (ветка data)
├── .gitignore              # Исключения для Git
├── .env.example            # Пример конфигурации
├── package.json            # Зависимости проекта
└── README.md              # Этот файл
```

## 🔧 Конфигурация Firebase

### Шаг 1: Создайте проект Firebase

1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Создайте новый проект
3. Включите **Firestore Database** и **Authentication (Email/Password)**

### Шаг 2: Получите конфиги

1. В Firebase Console перейдите в **Project Settings**
2. Скопируйте конфигурацию вашего проекта

### Шаг 3: Настройте .env

Создайте файл `.env` (скопируйте из `.env.example`):

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## 📊 Структура данных Firestore

### Collection: `users`

```javascript
{
  uid: "user_id",
  email: "user@example.com",
  nickname: "UserNickname",
  avatarUrl: "https://...",
  score: 1250,
  playedTracks: {
    "track_id": 1694000000000,  // Timestamp последней игры
    "another_id": 1694000000000
  }
}
```

## 🎵 Формат tracks.json (ветка data)

```json
{
  "suggestions": [
    "YOASOBI - IDOL",
    "Ado - Usseewa",
    // ... списки подсказок
  ],
  "tracks": [
    {
      "id": "unique_id",
      "fullName": "Artist - Title",
      "artist": "Artist",
      "title": "Title",
      "audioSrc": "https://url_to_audio.mp3",
      "correctAnswers": [
        "artist - title",
        "title",
        // ... варианты правильных ответов
      ]
    }
  ]
}
```

## 🎮 Игровая механика

### Система очков

| Попытка | Длительность | Очки |
|---------|--------------|------|
| Бонус   | 0.1 сек      | —    |
| 1       | 0.5 сек      | 100  |
| 2       | 1 сек        | 50   |
| 3       | 2 сек        | 25   |
| 4       | 3 сек        | 15   |
| 5       | 5 сек        | 10   |
| 6       | 8 сек        | 7    |
| 7       | Полный трек  | 5    |

### Система уровней

- **Уровни 1-10**: +150 очков за уровень
- **Уровни 11-20**: +155 очков за уровень
- **Уровни 21-30**: +160 очков за уровень
- И так далее, с постепенным увеличением...

## 🐛 Известные проблемы

- [ ] Весь код в одном HTML файле (нужно разделить)
- [ ] Firebase credentials видны в коде (нужен .env)
- [ ] Ограниченное количество треков
- [ ] Нет рейтинга между игроками
- [ ] Нет офлайн-режима

## 🚀 Планы развития

- [ ] Рефакторинг кода (модули, компоненты)
- [ ] Админ-панель для добавления треков
- [ ] Глобальный рейтинг игроков
- [ ] Достижения и бейджи
- [ ] PWA поддержка (офлайн-режим)
- [ ] Мультиязычность
- [ ] API для синхронизации с Spotify/Apple Music
- [ ] Рекомендации треков по жанрам

## 📝 Добавление новых треков

### Шаг 1: Найдите аудио URL

Используйте источники:
- Yandex Music API
- iTunes Audio Preview
- Spotify Preview URLs
- YouTube Audio URL

### Шаг 2: Создайте объект трека

```javascript
{
  "id": "artist-track-name",
  "fullName": "Artist - Track Name",
  "artist": "Artist",
  "title": "Track Name",
  "audioSrc": "https://direct_audio_url",
  "correctAnswers": [
    "artist - track name",
    "track name",
    "artist track name"
  ]
}
```

### Шаг 3: Добавьте в tracks.json

Обновите файл в ветке `data` и добавьте трек в массив `tracks`.

## 🔐 Безопасность

⚠️ **Важно**: Никогда не коммитьте файл `.env` с реальными ключами!

- Используйте `.env.example` как шаблон
- Добавьте `.env` в `.gitignore`
- Используйте переменные окружения на сервере

## 📄 Лицензия

MIT License — свободно используйте в своих проектах

## 👤 Автор

**zetpaon** — создатель проекта

## 🤝 Контрибьютинг

Хотите помочь улучшить проект? 

1. Fork репозиторий
2. Создайте ветку для вашей фичи (`git checkout -b feature/AmazingFeature`)
3. Сделайте коммит (`git commit -m 'Add AmazingFeature'`)
4. Push в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📞 Контакты и обратная связь

- Issues: [GitHub Issues](https://github.com/zetpaon/musicallo/issues)

---

**Сделано с ❤️ для любителей музыки**
