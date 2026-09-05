/**
 * Difficulty Management Module
 * Управление уровнями сложности игры
 */

export class DifficultyManager {
  constructor() {
    this.difficulties = {
      easy: {
        name: 'Легкий',
        icon: '🟢',
        durations: [2000, 5000, 8000, null], // мс
        scores: [50, 25, 15, 5],
        maxAttempts: 4,
        bonus: 50,
        description: 'Длинные отрывки, больше попыток'
      },
      medium: {
        name: 'Средний',
        icon: '🟡',
        durations: [1000, 2000, 3000, 5000, 8000, null],
        scores: [100, 50, 25, 15, 10, 5],
        maxAttempts: 6,
        bonus: 100,
        description: 'Стандартная сложность'
      },
      hard: {
        name: 'Сложный',
        icon: '🔴',
        durations: [100, 500, 1000, 2000, 3000, 5000, 8000, null],
        scores: [100, 50, 25, 15, 10, 7, 5, 2],
        maxAttempts: 8,
        bonus: 200,
        description: 'Короткие отрывки, много попыток'
      },
      extreme: {
        name: 'Экстрим',
        icon: '⚡',
        durations: [50, 100, 250, 500, 1000, 2000, 3000, 5000, 8000, null],
        scores: [200, 100, 50, 30, 20, 15, 10, 7, 5, 2],
        maxAttempts: 10,
        bonus: 300,
        description: 'Максимальная сложность! Первый отрывок очень короткий'
      }
    };

    this.currentDifficulty = 'medium';
    this.multipliers = {
      easy: 0.7,
      medium: 1.0,
      hard: 1.5,
      extreme: 2.0
    };
  }

  /**
   * Установить уровень сложности
   * @param {string} difficulty - 'easy', 'medium', 'hard', 'extreme'
   */
  setDifficulty(difficulty) {
    if (!this.difficulties[difficulty]) {
      console.warn(`Unknown difficulty: ${difficulty}`);
      return false;
    }
    this.currentDifficulty = difficulty;
    return true;
  }

  /**
   * Получить текущий уровень сложности
   */
  getCurrentDifficulty() {
    return this.currentDifficulty;
  }

  /**
   * Получить конфиг текущей сложности
   */
  getDifficultyConfig() {
    return { ...this.difficulties[this.currentDifficulty] };
  }

  /**
   * Получить все уровни сложности для выбора
   */
  getAllDifficulties() {
    return Object.entries(this.difficulties).map(([key, value]) => ({
      id: key,
      ...value
    }));
  }

  /**
   * Получить очки за попытку с учетом сложности
   * @param {number} attemptIndex - индекс попытки (0-based)
   * @returns {number} очки
   */
  getPoints(attemptIndex) {
    const config = this.getDifficultyConfig();
    if (attemptIndex >= config.scores.length) {
      return config.scores[config.scores.length - 1];
    }
    const basePoints = config.scores[attemptIndex];
    const multiplier = this.multipliers[this.currentDifficulty];
    return Math.round(basePoints * multiplier);
  }

  /**
   * Получить бонусные очки за первую попытку
   */
  getBonusPoints() {
    const config = this.getDifficultyConfig();
    const multiplier = this.multipliers[this.currentDifficulty];
    return Math.round(config.bonus * multiplier);
  }

  /**
   * Получить продолжительность отрывка для попытки
   * @param {number} attemptIndex - индекс попытки
   * @returns {number|null} продолжительность в мс или null (полный трек)
   */
  getDuration(attemptIndex) {
    const config = this.getDifficultyConfig();
    if (attemptIndex >= config.durations.length) {
      return config.durations[config.durations.length - 1];
    }
    return config.durations[attemptIndex];
  }

  /**
   * Получить максимум попыток для текущей сложности
   */
  getMaxAttempts() {
    return this.getDifficultyConfig().maxAttempts;
  }

  /**
   * Рассчитать множитель для уровня пользователя
   * @param {number} userLevel - уровень пользователя
   * @returns {number} множитель (от 1.0 до 2.0)
   */
  getLevelMultiplier(userLevel) {
    // Каждый 5-й уровень добавляет 0.2x к очкам
    const levelBonus = Math.floor((userLevel - 1) / 5) * 0.2;
    return Math.min(1.0 + levelBonus, 2.0); // макс 2.0x
  }

  /**
   * Получить итоговые очки с учетом всех множителей
   * @param {number} basePoints - базовые очки
   * @param {number} userLevel - уровень пользователя
   * @returns {number} итоговые очки
   */
  calculateFinalPoints(basePoints, userLevel = 1) {
    const difficultyMultiplier = this.multipliers[this.currentDifficulty];
    const levelMultiplier = this.getLevelMultiplier(userLevel);
    return Math.round(basePoints * difficultyMultiplier * levelMultiplier);
  }
}

/**
 * Система достижений
 */
export class AchievementManager {
  constructor() {
    this.achievements = {
      // Базовые достижения
      first_guess: {
        id: 'first_guess',
        name: 'Первый шаг',
        description: 'Угадайте свою первую песню',
        icon: '🎵',
        points: 10,
        rarity: 'common',
        unlocked: false
      },
      ten_guesses: {
        id: 'ten_guesses',
        name: 'Десятка',
        description: 'Угадайте 10 песен',
        icon: '🔟',
        points: 50,
        rarity: 'common',
        requirement: 10,
        unlocked: false
      },
      hundred_guesses: {
        id: 'hundred_guesses',
        name: 'Сотня',
        description: 'Угадайте 100 песен',
        icon: '💯',
        points: 200,
        rarity: 'rare',
        requirement: 100,
        unlocked: false
      },

      // Скорость
      speed_demon: {
        id: 'speed_demon',
        name: 'Демон скорости',
        description: 'Угадайте песню с первой попытки',
        icon: '⚡',
        points: 30,
        rarity: 'uncommon',
        unlocked: false
      },
      perfect_streak_5: {
        id: 'perfect_streak_5',
        name: 'Отличный слух',
        description: 'Угадайте 5 песен подряд с первой попытки',
        icon: '🎯',
        points: 100,
        rarity: 'rare',
        requirement: 5,
        unlocked: false
      },

      // Сложность
      hard_challenge: {
        id: 'hard_challenge',
        name: 'Вызов',
        description: 'Угадайте песню на сложном уровне',
        icon: '🔴',
        points: 50,
        rarity: 'uncommon',
        unlocked: false
      },
      extreme_master: {
        id: 'extreme_master',
        name: 'Мастер экстрима',
        description: 'Угадайте 10 песен на уровне Экстрим',
        icon: '⚡',
        points: 300,
        rarity: 'legendary',
        requirement: 10,
        unlocked: false
      },

      // Уровни пользователя
      level_5: {
        id: 'level_5',
        name: 'Новичок',
        description: 'Достигните уровня 5',
        icon: '⭐',
        points: 50,
        rarity: 'common',
        requirement: 5,
        unlocked: false
      },
      level_10: {
        id: 'level_10',
        name: 'Опытный',
        description: 'Достигните уровня 10',
        icon: '⭐⭐',
        points: 100,
        rarity: 'uncommon',
        requirement: 10,
        unlocked: false
      },
      level_25: {
        id: 'level_25',
        name: 'Эксперт',
        description: 'Достигните уровня 25',
        icon: '⭐⭐⭐',
        points: 250,
        rarity: 'rare',
        requirement: 25,
        unlocked: false
      },
      level_50: {
        id: 'level_50',
        name: 'Легенда',
        description: 'Достигните уровня 50',
        icon: '👑',
        points: 500,
        rarity: 'legendary',
        requirement: 50,
        unlocked: false
      },

      // Специальные
      collector: {
        id: 'collector',
        name: 'Коллекционер',
        description: 'Угадайте песни всех жанров',
        icon: '🎼',
        points: 150,
        rarity: 'epic',
        unlocked: false
      },
      early_bird: {
        id: 'early_bird',
        name: 'Ранняя пташка',
        description: 'Сыграйте в 6 утра или раньше',
        icon: '🌅',
        points: 25,
        rarity: 'uncommon',
        unlocked: false
      },
      night_owl: {
        id: 'night_owl',
        name: 'Ночная сова',
        description: 'Сыграйте после полуночи',
        icon: '🌙',
        points: 25,
        rarity: 'uncommon',
        unlocked: false
      }
    };

    this.unlockedAchievements = [];
    this.totalAchievementPoints = 0;
  }

  /**
   * Получить все достижения
   */
  getAllAchievements() {
    return Object.values(this.achievements);
  }

  /**
   * Получить разблокированные достижения
   */
  getUnlockedAchievements() {
    return this.unlockedAchievements;
  }

  /**
   * Проверить и разблокировать достижение
   * @param {string} achievementId - ID достижения
   * @param {object} stats - статистика пользователя
   * @returns {boolean} было ли разблокировано
   */
  checkAndUnlock(achievementId, stats) {
    const achievement = this.achievements[achievementId];
    
    if (!achievement || achievement.unlocked) {
      return false;
    }

    // Проверка условия достижения
    let shouldUnlock = false;

    if (achievementId === 'first_guess') {
      shouldUnlock = stats.totalGuesses >= 1;
    } else if (achievementId === 'ten_guesses') {
      shouldUnlock = stats.totalGuesses >= 10;
    } else if (achievementId === 'hundred_guesses') {
      shouldUnlock = stats.totalGuesses >= 100;
    } else if (achievementId === 'speed_demon') {
      shouldUnlock = stats.lastAttemptIndex === 0;
    } else if (achievementId === 'perfect_streak_5') {
      shouldUnlock = (stats.perfectStreak || 0) >= 5;
    } else if (achievementId === 'hard_challenge') {
      shouldUnlock = stats.lastDifficulty === 'hard';
    } else if (achievementId === 'extreme_master') {
      shouldUnlock = (stats.extremeGuesses || 0) >= 10;
    } else if (achievementId === 'level_5') {
      shouldUnlock = stats.level >= 5;
    } else if (achievementId === 'level_10') {
      shouldUnlock = stats.level >= 10;
    } else if (achievementId === 'level_25') {
      shouldUnlock = stats.level >= 25;
    } else if (achievementId === 'level_50') {
      shouldUnlock = stats.level >= 50;
    }

    if (shouldUnlock) {
      achievement.unlocked = true;
      this.unlockedAchievements.push(achievement);
      this.totalAchievementPoints += achievement.points;
      return true;
    }

    return false;
  }

  /**
   * Получить недавно разблокированные достижения
   */
  getRecentlyUnlocked() {
    return this.unlockedAchievements.slice(-3);
  }

  /**
   * Получить общие очки достижений
   */
  getTotalPoints() {
    return this.totalAchievementPoints;
  }

  /**
   * Получить процент разблокированных достижений
   */
  getCompletionPercentage() {
    const total = Object.keys(this.achievements).length;
    const unlocked = this.unlockedAchievements.length;
    return Math.round((unlocked / total) * 100);
  }

  /**
   * Получить статистику по редкости
   */
  getStatsByRarity() {
    const stats = {
      common: { total: 0, unlocked: 0 },
      uncommon: { total: 0, unlocked: 0 },
      rare: { total: 0, unlocked: 0 },
      epic: { total: 0, unlocked: 0 },
      legendary: { total: 0, unlocked: 0 }
    };

    Object.values(this.achievements).forEach(achievement => {
      stats[achievement.rarity].total++;
      if (achievement.unlocked) {
        stats[achievement.rarity].unlocked++;
      }
    });

    return stats;
  }
}

/**
 * Менеджер статистики пользователя
 */
export class StatsManager {
  constructor() {
    this.stats = {
      totalGuesses: 0,
      correctGuesses: 0,
      level: 1,
      score: 0,
      playedTracks: {},
      perfectStreak: 0,
      maxPerfectStreak: 0,
      lastAttemptIndex: -1,
      lastDifficulty: 'medium',
      extremeGuesses: 0,
      hardGuesses: 0,
      mediumGuesses: 0,
      easyGuesses: 0,
      createdAt: new Date(),
      lastPlayedAt: null
    };
  }

  /**
   * Добавить результат игры
   * @param {object} result - результат игры
   */
  addGameResult(result) {
    this.stats.totalGuesses++;
    
    if (result.correct) {
      this.stats.correctGuesses++;
      this.stats.perfectStreak++;
      if (this.stats.perfectStreak > this.stats.maxPerfectStreak) {
        this.stats.maxPerfectStreak = this.stats.perfectStreak;
      }
    } else {
      this.stats.perfectStreak = 0;
    }

    this.stats.lastAttemptIndex = result.attemptIndex;
    this.stats.lastDifficulty = result.difficulty;
    this.stats.score += result.points;
    this.stats.lastPlayedAt = new Date();

    // Трекировать по сложности
    if (result.difficulty === 'extreme') {
      this.stats.extremeGuesses++;
    } else if (result.difficulty === 'hard') {
      this.stats.hardGuesses++;
    } else if (result.difficulty === 'medium') {
      this.stats.mediumGuesses++;
    } else if (result.difficulty === 'easy') {
      this.stats.easyGuesses++;
    }

    // Отметить сыгранный трек
    this.stats.playedTracks[result.trackId] = new Date().getTime();

    // Обновить уровень
    this.updateLevel();
  }

  /**
   * Рассчитать уровень на основе очков
   */
  updateLevel() {
    // Первый уровень - 150 очков
    // Каждый следующий уровень требует на 5 очков больше
    let requiredScore = 150;
    let level = 1;

    while (this.stats.score >= requiredScore) {
      this.stats.score -= requiredScore;
      level++;
      requiredScore = 150 + (level - 1) * 5;
    }

    this.stats.level = level;
  }

  /**
   * Получить текущую статистику
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Получить процент точности
   */
  getAccuracy() {
    if (this.stats.totalGuesses === 0) return 0;
    return Math.round((this.stats.correctGuesses / this.stats.totalGuesses) * 100);
  }

  /**
   * Получить очки, необходимые для следующего уровня
   */
  getPointsToNextLevel() {
    const requiredScore = 150 + (this.stats.level - 1) * 5;
    return requiredScore - this.stats.score;
  }

  /**
   * Получить прогресс до следующего уровня (0-100%)
   */
  getLevelProgress() {
    const requiredScore = 150 + (this.stats.level - 1) * 5;
    return Math.round((this.stats.score / requiredScore) * 100);
  }
}
