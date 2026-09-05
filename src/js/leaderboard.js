/**
 * Leaderboard Manager
 * Управление глобальным рейтингом игроков
 */

import { db } from './firebase-config.js';
import { collection, query, orderBy, limit, getDocs, where, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export class LeaderboardManager {
  constructor() {
    this.usersCollection = 'users';
    this.cacheExpiry = 5 * 60 * 1000; // 5 минут
    this.cache = {
      globalTop: { data: null, timestamp: 0 },
      weeklyTop: { data: null, timestamp: 0 },
      friends: { data: null, timestamp: 0 }
    };
  }

  /**
   * Получить топ 100 игроков по очкам (глобальный рейтинг)
   * @param {boolean} useCache - использовать кэш
   * @returns {Promise<Array>} массив топ игроков
   */
  async getGlobalTopPlayers(useCache = true) {
    // Проверить кэш
    if (useCache && this._isCacheValid('globalTop')) {
      return this.cache.globalTop.data;
    }

    try {
      const q = query(
        collection(db, this.usersCollection),
        orderBy('score', 'desc'),
        orderBy('level', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const players = [];

      querySnapshot.forEach((doc, index) => {
        const userData = doc.data();
        players.push({
          rank: index + 1,
          uid: doc.id,
          nickname: userData.nickname || 'Unknown',
          avatarUrl: userData.avatarUrl || null,
          score: userData.score || 0,
          level: userData.level || 1,
          totalGuesses: userData.totalGuesses || 0,
          accuracy: userData.accuracy || 0,
          perfectStreak: userData.perfectStreak || 0,
          email: userData.email || null
        });
      });

      // Кэшировать результат
      this.cache.globalTop = {
        data: players,
        timestamp: Date.now()
      };

      return players;
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      return [];
    }
  }

  /**
   * Получить топ 50 игроков за неделю
   * @returns {Promise<Array>} массив топ игроков за неделю
   */
  async getWeeklyTopPlayers() {
    // Проверить кэш
    if (this._isCacheValid('weeklyTop')) {
      return this.cache.weeklyTop.data;
    }

    try {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      const q = query(
        collection(db, this.usersCollection),
        where('lastPlayedAt', '>=', new Date(weekAgo)),
        orderBy('lastPlayedAt', 'desc'),
        orderBy('score', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const players = [];

      querySnapshot.forEach((doc, index) => {
        const userData = doc.data();
        players.push({
          rank: index + 1,
          uid: doc.id,
          nickname: userData.nickname || 'Unknown',
          avatarUrl: userData.avatarUrl || null,
          score: userData.score || 0,
          level: userData.level || 1,
          lastPlayedAt: userData.lastPlayedAt,
          weeklyScore: userData.weeklyScore || userData.score || 0
        });
      });

      this.cache.weeklyTop = {
        data: players,
        timestamp: Date.now()
      };

      return players;
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
      return [];
    }
  }

  /**
   * Получить позицию игрока в глобальном рейтинге
   * @param {string} uid - ID пользователя
   * @returns {Promise<Object>} информация о позиции
   */
  async getPlayerRank(uid) {
    try {
      const docRef = doc(db, this.usersCollection, uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const userData = docSnap.data();
      const playerScore = userData.score || 0;
      const playerLevel = userData.level || 1;

      // Получить количество игроков с большим счетом
      const q = query(
        collection(db, this.usersCollection),
        where('score', '>', playerScore)
      );

      const querySnapshot = await getDocs(q);
      const rank = querySnapshot.size + 1;

      // Получить общее количество игроков
      const allUsersQ = query(collection(db, this.usersCollection));
      const allUsersSnapshot = await getDocs(allUsersQ);
      const totalPlayers = allUsersSnapshot.size;

      return {
        uid: uid,
        nickname: userData.nickname || 'Unknown',
        rank: rank,
        totalPlayers: totalPlayers,
        score: playerScore,
        level: playerLevel,
        accuracy: userData.accuracy || 0,
        totalGuesses: userData.totalGuesses || 0,
        ranking: {
          percentile: Math.round((rank / totalPlayers) * 100),
          topPercent: rank <= Math.ceil(totalPlayers * 0.01) // Top 1%
        }
      };
    } catch (error) {
      console.error('Error fetching player rank:', error);
      return null;
    }
  }

  /**
   * Получить соседей игрока (±5 мест)
   * @param {string} uid - ID пользователя
   * @returns {Promise<Array>} игроки вокруг текущего
   */
  async getPlayerNeighbors(uid) {
    try {
      const playerRank = await this.getPlayerRank(uid);
      if (!playerRank) return [];

      const topPlayers = await this.getGlobalTopPlayers();
      const rank = playerRank.rank;
      const start = Math.max(0, rank - 6); // ±5 мест
      const end = Math.min(topPlayers.length, rank + 4);

      return topPlayers.slice(start, end);
    } catch (error) {
      console.error('Error fetching player neighbors:', error);
      return [];
    }
  }

  /**
   * Получить друзей игрока из рейтинга
   * @param {string} uid - ID пользователя
   * @param {Array<string>} friendUids - список ID друзей
   * @returns {Promise<Array>} друзья в рейтинге
   */
  async getFriendsRanking(uid, friendUids) {
    if (!friendUids || friendUids.length === 0) {
      return [];
    }

    try {
      const topPlayers = await this.getGlobalTopPlayers();
      const friendsMap = new Map(friendUids.map((fuid, idx) => [fuid, idx]));

      const friends = topPlayers
        .filter(player => friendsMap.has(player.uid))
        .map(player => ({
          ...player,
          isFriend: true,
          friendIndex: friendsMap.get(player.uid)
        }));

      return friends.sort((a, b) => a.rank - b.rank);
    } catch (error) {
      console.error('Error fetching friends ranking:', error);
      return [];
    }
  }

  /**
   * Получить статистику по жанрам/авторам
   * @returns {Promise<Object>} статистика
   */
  async getGenreStatistics() {
    try {
      const q = query(collection(db, this.usersCollection), limit(1000));
      const querySnapshot = await getDocs(q);

      const stats = {
        totalPlayers: 0,
        avgScore: 0,
        avgLevel: 0,
        avgAccuracy: 0,
        totalGamesPlayed: 0,
        topGenres: []
      };

      let totalScore = 0;
      let totalLevel = 0;
      let totalAccuracy = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stats.totalPlayers++;
        totalScore += data.score || 0;
        totalLevel += data.level || 1;
        totalAccuracy += data.accuracy || 0;
        stats.totalGamesPlayed += data.totalGuesses || 0;
      });

      stats.avgScore = Math.round(totalScore / stats.totalPlayers);
      stats.avgLevel = (totalLevel / stats.totalPlayers).toFixed(1);
      stats.avgAccuracy = Math.round(totalAccuracy / stats.totalPlayers);

      return stats;
    } catch (error) {
      console.error('Error fetching genre statistics:', error);
      return null;
    }
  }

  /**
   * Получить рейтинг по достижениям
   * @returns {Promise<Array>} игроки с наибольшим количеством достижений
   */
  async getAchievementLeaderboard() {
    try {
      const q = query(
        collection(db, this.usersCollection),
        orderBy('achievements', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const players = [];

      querySnapshot.forEach((doc, index) => {
        const userData = doc.data();
        players.push({
          rank: index + 1,
          uid: doc.id,
          nickname: userData.nickname || 'Unknown',
          avatarUrl: userData.avatarUrl || null,
          achievements: userData.achievements || 0,
          level: userData.level || 1
        });
      });

      return players;
    } catch (error) {
      console.error('Error fetching achievement leaderboard:', error);
      return [];
    }
  }

  /**
   * Получить рейтинг по точности
   * @returns {Promise<Array>} игроки с лучшей точностью (мин 50 игр)
   */
  async getAccuracyLeaderboard() {
    try {
      const q = query(
        collection(db, this.usersCollection),
        where('totalGuesses', '>=', 50),
        orderBy('accuracy', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const players = [];

      querySnapshot.forEach((doc, index) => {
        const userData = doc.data();
        players.push({
          rank: index + 1,
          uid: doc.id,
          nickname: userData.nickname || 'Unknown',
          avatarUrl: userData.avatarUrl || null,
          accuracy: userData.accuracy || 0,
          totalGuesses: userData.totalGuesses || 0,
          correctGuesses: Math.round((userData.accuracy / 100) * (userData.totalGuesses || 0))
        });
      });

      return players;
    } catch (error) {
      console.error('Error fetching accuracy leaderboard:', error);
      return [];
    }
  }

  /**
   * Получить "восходящие звезды" - быстрорастущие игроки
   * @returns {Promise<Array>} игроки с быстрым ростом за последнюю неделю
   */
  async getRisingStars() {
    try {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      const q = query(
        collection(db, this.usersCollection),
        where('lastPlayedAt', '>=', new Date(weekAgo)),
        orderBy('levelUpCount', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const players = [];

      querySnapshot.forEach((doc, index) => {
        const userData = doc.data();
        players.push({
          rank: index + 1,
          uid: doc.id,
          nickname: userData.nickname || 'Unknown',
          avatarUrl: userData.avatarUrl || null,
          levelUpCount: userData.levelUpCount || 0,
          currentLevel: userData.level || 1,
          weeklyScore: userData.weeklyScore || 0
        });
      });

      return players;
    } catch (error) {
      console.error('Error fetching rising stars:', error);
      return [];
    }
  }

  /**
   * Сравнить двух игроков
   * @param {string} uid1 - ID первого игрока
   * @param {string} uid2 - ID второго игрока
   * @returns {Promise<Object>} сравнительная статистика
   */
  async comparePlayersStats(uid1, uid2) {
    try {
      const doc1 = await getDoc(doc(db, this.usersCollection, uid1));
      const doc2 = await getDoc(doc(db, this.usersCollection, uid2));

      if (!doc1.exists() || !doc2.exists()) {
        return null;
      }

      const player1 = { uid: uid1, ...doc1.data() };
      const player2 = { uid: uid2, ...doc2.data() };

      return {
        players: [
          {
            nickname: player1.nickname,
            level: player1.level || 1,
            score: player1.score || 0,
            accuracy: player1.accuracy || 0,
            totalGuesses: player1.totalGuesses || 0,
            perfectStreak: player1.perfectStreak || 0
          },
          {
            nickname: player2.nickname,
            level: player2.level || 1,
            score: player2.score || 0,
            accuracy: player2.accuracy || 0,
            totalGuesses: player2.totalGuesses || 0,
            perfectStreak: player2.perfectStreak || 0
          }
        ],
        comparison: {
          levelDifference: (player1.level || 1) - (player2.level || 1),
          scoreDifference: (player1.score || 0) - (player2.score || 0),
          accuracyDifference: (player1.accuracy || 0) - (player2.accuracy || 0)
        }
      };
    } catch (error) {
      console.error('Error comparing players:', error);
      return null;
    }
  }

  /**
   * Получить значки рейтинга для уровня
   * @param {number} level - уровень игрока
   * @returns {Object} значок и описание
   */
  getLevelBadge(level) {
    if (level <= 5) return { badge: '🟢', name: 'Новичок', color: '#10b981' };
    if (level <= 10) return { badge: '🔵', name: 'Любитель', color: '#3b82f6' };
    if (level <= 15) return { badge: '🟣', name: 'Опытный', color: '#8b5cf6' };
    if (level <= 25) return { badge: '🟠', name: 'Профессионал', color: '#f97316' };
    if (level <= 50) return { badge: '🔴', name: 'Эксперт', color: '#ef4444' };
    return { badge: '👑', name: 'Легенда', color: '#fbbf24' };
  }

  /**
   * Получить периодические рейтинги (месячные, годовые)
   * @param {string} period - 'weekly', 'monthly', 'yearly'
   * @returns {Promise<Array>} рейтинг за период
   */
  async getLeaderboardByPeriod(period = 'monthly') {
    try {
      let daysAgo;
      switch (period) {
        case 'weekly':
          daysAgo = 7;
          break;
        case 'monthly':
          daysAgo = 30;
          break;
        case 'yearly':
          daysAgo = 365;
          break;
        default:
          daysAgo = 30;
      }

      const periodStart = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);

      const q = query(
        collection(db, this.usersCollection),
        where('lastPlayedAt', '>=', new Date(periodStart)),
        orderBy('score', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const players = [];

      querySnapshot.forEach((doc, index) => {
        const userData = doc.data();
        players.push({
          rank: index + 1,
          uid: doc.id,
          nickname: userData.nickname || 'Unknown',
          score: userData.score || 0,
          level: userData.level || 1,
          badge: this.getLevelBadge(userData.level || 1)
        });
      });

      return players;
    } catch (error) {
      console.error(`Error fetching ${period} leaderboard:`, error);
      return [];
    }
  }

  /**
   * Проверить валидность кэша
   * @private
   */
  _isCacheValid(cacheKey) {
    const cache = this.cache[cacheKey];
    if (!cache.data) return false;
    return (Date.now() - cache.timestamp) < this.cacheExpiry;
  }

  /**
   * Очистить кэш
   */
  clearCache() {
    Object.keys(this.cache).forEach(key => {
      this.cache[key] = { data: null, timestamp: 0 };
    });
  }

  /**
   * Получить HTML для отображения рейтинга
   * @param {Array} players - массив игроков
   * @returns {string} HTML таблица
   */
  generateLeaderboardHTML(players) {
    let html = '<div class="leaderboard-table">';

    players.forEach((player) => {
      const badge = this.getLevelBadge(player.level);
      html += `
        <div class="leaderboard-row">
          <div class="rank">#${player.rank}</div>
          <div class="badge" title="${badge.name}">${badge.badge}</div>
          <div class="player-info">
            <div class="nickname">${this._escapeHtml(player.nickname)}</div>
            <div class="level">Уровень ${player.level}</div>
          </div>
          <div class="score">${player.score.toLocaleString('ru-RU')}</div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Экранировать HTML символы
   * @private
   */
  _escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}
