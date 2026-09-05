/**
 * Admin Panel Manager
 * Управление треками, пользователями и системой
 */

import { db } from './firebase-config.js';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export class AdminManager {
  constructor(currentUserUid) {
    this.currentUserUid = currentUserUid;
    this.adminUsersCollection = 'admins';
    this.tracksCollection = 'tracks';
    this.usersCollection = 'users';
    this.isAdmin = false;
    this.adminActions = [];
  }

  /**
   * Проверить, является ли пользователь администратором
   * @returns {Promise<boolean>}
   */
  async checkAdminStatus() {
    try {
      const adminDoc = await getDoc(doc(db, this.adminUsersCollection, this.currentUserUid));
      this.isAdmin = adminDoc.exists() && adminDoc.data().isAdmin === true;
      return this.isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Получить панель администратора (если доступна)
   * @returns {Promise<Object|null>}
   */
  async getAdminPanel() {
    if (!await this.checkAdminStatus()) {
      return null;
    }

    return {
      tracks: await this.getAllTracks(),
      users: await this.getSystemStats(),
      actions: this.adminActions
    };
  }

  // ==================== УПРАВЛЕНИЕ ТРЕКАМИ ====================

  /**
   * Добавить новый трек в базу данных
   * @param {Object} track - объект трека
   * @returns {Promise<boolean>}
   */
  async addTrack(track) {
    if (!this.isAdmin) {
      console.error('Only admins can add tracks');
      return false;
    }

    try {
      // Валидация
      if (!this._validateTrack(track)) {
        throw new Error('Invalid track data');
      }

      const trackId = track.id || this._generateTrackId(track);
      const trackData = {
        ...track,
        id: trackId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: this.currentUserUid,
        status: 'active',
        views: 0,
        difficulty: track.difficulty || 'medium'
      };

      await setDoc(doc(db, this.tracksCollection, trackId), trackData);
      
      // Логировать действие
      this._logAction('ADD_TRACK', { trackId, track: track.fullName });

      return true;
    } catch (error) {
      console.error('Error adding track:', error);
      return false;
    }
  }

  /**
   * Обновить существующий трек
   * @param {string} trackId - ID трека
   * @param {Object} updates - данные для обновления
   * @returns {Promise<boolean>}
   */
  async updateTrack(trackId, updates) {
    if (!this.isAdmin) {
      console.error('Only admins can update tracks');
      return false;
    }

    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
        updatedBy: this.currentUserUid
      };

      await updateDoc(doc(db, this.tracksCollection, trackId), updateData);
      this._logAction('UPDATE_TRACK', { trackId, updates });

      return true;
    } catch (error) {
      console.error('Error updating track:', error);
      return false;
    }
  }

  /**
   * Удалить трек
   * @param {string} trackId - ID трека
   * @returns {Promise<boolean>}
   */
  async deleteTrack(trackId) {
    if (!this.isAdmin) {
      console.error('Only admins can delete tracks');
      return false;
    }

    try {
      // Мягкое удаление - отметить как неактивный
      await updateDoc(doc(db, this.tracksCollection, trackId), {
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: this.currentUserUid
      });

      this._logAction('DELETE_TRACK', { trackId });
      return true;
    } catch (error) {
      console.error('Error deleting track:', error);
      return false;
    }
  }

  /**
   * Получить все треки (включая удаленные)
   * @param {boolean} includeDeleted - включить удаленные
   * @returns {Promise<Array>}
   */
  async getAllTracks(includeDeleted = false) {
    try {
      let q;
      if (includeDeleted) {
        q = query(collection(db, this.tracksCollection), orderBy('createdAt', 'desc'));
      } else {
        q = query(
          collection(db, this.tracksCollection),
          where('status', '!=', 'deleted'),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const tracks = [];

      querySnapshot.forEach((doc) => {
        tracks.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return tracks;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  }

  /**
   * Получить статистику по трекам
   * @returns {Promise<Object>}
   */
  async getTracksStatistics() {
    try {
      const tracks = await this.getAllTracks();
      
      const stats = {
        totalTracks: tracks.length,
        activeTracks: tracks.filter(t => t.status === 'active').length,
        deletedTracks: tracks.filter(t => t.status === 'deleted').length,
        totalViews: tracks.reduce((sum, t) => sum + (t.views || 0), 0),
        byDifficulty: {
          easy: tracks.filter(t => t.difficulty === 'easy').length,
          medium: tracks.filter(t => t.difficulty === 'medium').length,
          hard: tracks.filter(t => t.difficulty === 'hard').length,
          extreme: tracks.filter(t => t.difficulty === 'extreme').length
        },
        mostPlayed: tracks
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 10)
      };

      return stats;
    } catch (error) {
      console.error('Error getting tracks statistics:', error);
      return null;
    }
  }

  /**
   * Импортировать треки из JSON
   * @param {Array} tracksData - массив треков
   * @returns {Promise<Object>} результат импорта
   */
  async importTracks(tracksData) {
    if (!this.isAdmin) {
      console.error('Only admins can import tracks');
      return { success: 0, failed: 0, errors: [] };
    }

    const result = { success: 0, failed: 0, errors: [] };

    for (const track of tracksData) {
      try {
        if (await this.addTrack(track)) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push(`Failed to add track: ${track.fullName}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Error importing ${track.fullName}: ${error.message}`);
      }
    }

    this._logAction('IMPORT_TRACKS', { success: result.success, failed: result.failed });
    return result;
  }

  // ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ====================

  /**
   * Получить информацию о пользователе
   * @param {string} uid - ID пользователя
   * @returns {Promise<Object|null>}
   */
  async getUserInfo(uid) {
    try {
      const userDoc = await getDoc(doc(db, this.usersCollection, uid));
      if (!userDoc.exists()) return null;

      return {
        uid: uid,
        ...userDoc.data()
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Получить список всех пользователей
   * @param {number} limit - максимум результатов
   * @returns {Promise<Array>}
   */
  async getAllUsers(limitCount = 100) {
    try {
      const q = query(
        collection(db, this.usersCollection),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const users = [];

      querySnapshot.forEach((doc) => {
        users.push({
          uid: doc.id,
          ...doc.data()
        });
      });

      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Заблокировать пользователя
   * @param {string} uid - ID пользователя
   * @param {string} reason - причина блокировки
   * @returns {Promise<boolean>}
   */
  async banUser(uid, reason = '') {
    if (!this.isAdmin) {
      console.error('Only admins can ban users');
      return false;
    }

    try {
      await updateDoc(doc(db, this.usersCollection, uid), {
        isBanned: true,
        banReason: reason,
        bannedAt: new Date(),
        bannedBy: this.currentUserUid
      });

      this._logAction('BAN_USER', { uid, reason });
      return true;
    } catch (error) {
      console.error('Error banning user:', error);
      return false;
    }
  }

  /**
   * Разблокировать пользователя
   * @param {string} uid - ID пользователя
   * @returns {Promise<boolean>}
   */
  async unbanUser(uid) {
    if (!this.isAdmin) {
      console.error('Only admins can unban users');
      return false;
    }

    try {
      await updateDoc(doc(db, this.usersCollection, uid), {
        isBanned: false,
        bannedAt: null,
        banReason: null
      });

      this._logAction('UNBAN_USER', { uid });
      return true;
    } catch (error) {
      console.error('Error unbanning user:', error);
      return false;
    }
  }

  /**
   * Выдать бонусные очки пользователю
   * @param {string} uid - ID пользователя
   * @param {number} points - количество очк��в
   * @param {string} reason - причина
   * @returns {Promise<boolean>}
   */
  async giveUserBonus(uid, points, reason = '') {
    if (!this.isAdmin) {
      console.error('Only admins can give bonuses');
      return false;
    }

    try {
      const userDoc = await getDoc(doc(db, this.usersCollection, uid));
      if (!userDoc.exists()) return false;

      const currentScore = userDoc.data().score || 0;
      const newScore = currentScore + points;

      await updateDoc(doc(db, this.usersCollection, uid), {
        score: newScore,
        bonusGiven: (userDoc.data().bonusGiven || 0) + points,
        lastBonusAt: new Date()
      });

      this._logAction('GIVE_BONUS', { uid, points, reason });
      return true;
    } catch (error) {
      console.error('Error giving bonus:', error);
      return false;
    }
  }

  /**
   * Сбросить прогресс пользователя
   * @param {string} uid - ID пользователя
   * @returns {Promise<boolean>}
   */
  async resetUserProgress(uid) {
    if (!this.isAdmin) {
      console.error('Only admins can reset progress');
      return false;
    }

    try {
      await updateDoc(doc(db, this.usersCollection, uid), {
        score: 0,
        level: 1,
        totalGuesses: 0,
        correctGuesses: 0,
        accuracy: 0,
        playedTracks: {},
        resetAt: new Date(),
        resetBy: this.currentUserUid
      });

      this._logAction('RESET_PROGRESS', { uid });
      return true;
    } catch (error) {
      console.error('Error resetting progress:', error);
      return false;
    }
  }

  // ==================== СИСТЕМНАЯ СТАТИСТИКА ====================

  /**
   * Получить системную статистику
   * @returns {Promise<Object>}
   */
  async getSystemStats() {
    try {
      const users = await this.getAllUsers(1000);
      const tracks = await this.getAllTracks();

      const stats = {
        users: {
          total: users.length,
          active: users.filter(u => !u.isBanned).length,
          banned: users.filter(u => u.isBanned).length,
          avgLevel: (users.reduce((sum, u) => sum + (u.level || 1), 0) / users.length).toFixed(1),
          avgScore: Math.round(users.reduce((sum, u) => sum + (u.score || 0), 0) / users.length)
        },
        tracks: {
          total: tracks.length,
          active: tracks.filter(t => t.status === 'active').length,
          totalViews: tracks.reduce((sum, t) => sum + (t.views || 0), 0),
          avgViews: Math.round(tracks.reduce((sum, t) => sum + (t.views || 0), 0) / tracks.length)
        },
        system: {
          totalGamesPlayed: users.reduce((sum, u) => sum + (u.totalGuesses || 0), 0),
          totalAccuracy: Math.round(
            users.reduce((sum, u) => sum + (u.accuracy || 0), 0) / users.length
          )
        }
      };

      return stats;
    } catch (error) {
      console.error('Error getting system stats:', error);
      return null;
    }
  }

  /**
   * Получить логи администраторских действий
   * @returns {Array}
   */
  getAdminLogs() {
    return [...this.adminActions];
  }

  /**
   * Получить отчет о системе
   * @returns {Promise<Object>}
   */
  async generateSystemReport() {
    try {
      const stats = await this.getSystemStats();
      const tracksStats = await this.getTracksStatistics();

      return {
        generatedAt: new Date(),
        generatedBy: this.currentUserUid,
        ...stats,
        tracks: tracksStats,
        adminActions: this.adminActions.slice(-50) // Последние 50 действий
      };
    } catch (error) {
      console.error('Error generating system report:', error);
      return null;
    }
  }

  // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

  /**
   * Валидировать данные трека
   * @private
   */
  _validateTrack(track) {
    const required = ['fullName', 'artist', 'title', 'audioUrl', 'correctAnswers'];
    for (const field of required) {
      if (!track[field]) return false;
    }

    if (!Array.isArray(track.correctAnswers) || track.correctAnswers.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Сгенерировать ID трека
   * @private
   */
  _generateTrackId(track) {
    return `${track.artist}-${track.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Логировать действие администратора
   * @private
   */
  _logAction(action, details) {
    this.adminActions.push({
      action,
      details,
      timestamp: new Date(),
      adminUid: this.currentUserUid
    });

    // Хранить максимум 100 действий в памяти
    if (this.adminActions.length > 100) {
      this.adminActions.shift();
    }
  }

  /**
   * Экспортировать треки в JSON
   * @param {Array} tracks - треки для экспорта
   * @returns {string} JSON строка
   */
  exportTracksToJSON(tracks) {
    return JSON.stringify(tracks, null, 2);
  }

  /**
   * Получить шаблон для добавления нового трека
   * @returns {Object}
   */
  getTrackTemplate() {
    return {
      id: '',
      fullName: '',
      artist: '',
      title: '',
      audioUrl: '',
      correctAnswers: [],
      difficulty: 'medium',
      genre: '',
      releaseYear: new Date().getFullYear()
    };
  }

  /**
   * Проверить целостность данных
   * @returns {Promise<Object>}
   */
  async checkDataIntegrity() {
    try {
      const tracks = await this.getAllTracks();
      const users = await this.getAllUsers(1000);

      const issues = [];

      // Проверить треки
      tracks.forEach(track => {
        if (!track.id) issues.push(`Track missing ID: ${track.fullName}`);
        if (!track.audioUrl) issues.push(`Track missing audioUrl: ${track.fullName}`);
        if (!Array.isArray(track.correctAnswers) || track.correctAnswers.length === 0) {
          issues.push(`Track missing correctAnswers: ${track.fullName}`);
        }
      });

      // Проверить пользователей
      users.forEach(user => {
        if (!user.email) issues.push(`User missing email: ${user.uid}`);
        if (!user.nickname) issues.push(`User missing nickname: ${user.uid}`);
      });

      return {
        tracksChecked: tracks.length,
        usersChecked: users.length,
        issuesFound: issues.length,
        issues: issues
      };
    } catch (error) {
      console.error('Error checking data integrity:', error);
      return null;
    }
  }
}
