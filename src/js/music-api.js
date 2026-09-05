/**
 * Music API Integration
 * Интеграция со Spotify, YouTube Music и другими источниками
 */

export class MusicAPIManager {
  constructor() {
    this.spotifyApiKey = process.env.SPOTIFY_API_KEY;
    this.spotifySecret = process.env.SPOTIFY_SECRET;
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
    this.soundCloudClientId = process.env.SOUNDCLOUD_CLIENT_ID;

    this.apis = {
      spotify: new SpotifyAPI(this.spotifyApiKey, this.spotifySecret),
      youtube: new YouTubeAPI(this.youtubeApiKey),
      soundcloud: new SoundCloudAPI(this.soundCloudClientId)
    };

    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 час
  }

  /**
   * Поиск трека по названию
   * @param {string} query - поисковый запрос
   * @param {string} source - источник ('spotify', 'youtube', 'soundcloud', 'all')
   * @returns {Promise<Array>} найденные треки
   */
  async searchTrack(query, source = 'all') {
    const cacheKey = `search-${query}-${source}`;
    
    // Проверить кэш
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    let results = [];

    if (source === 'all' || source === 'spotify') {
      const spotifyResults = await this.apis.spotify.searchTrack(query);
      results = results.concat(spotifyResults);
    }

    if (source === 'all' || source === 'youtube') {
      const youtubeResults = await this.apis.youtube.searchTrack(query);
      results = results.concat(youtubeResults);
    }

    if (source === 'all' || source === 'soundcloud') {
      const soundcloudResults = await this.apis.soundcloud.searchTrack(query);
      results = results.concat(soundcloudResults);
    }

    // Кэшировать результаты
    this.cache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });

    return results;
  }

  /**
   * Получить аудио URL трека
   * @param {string} trackId - ID трека
   * @param {string} source - источник трека
   * @returns {Promise<string|null>} URL аудио
   */
  async getTrackAudioUrl(trackId, source) {
    try {
      if (source === 'spotify') {
        return await this.apis.spotify.getAudioUrl(trackId);
      } else if (source === 'youtube') {
        return await this.apis.youtube.getAudioUrl(trackId);
      } else if (source === 'soundcloud') {
        return await this.apis.soundcloud.getAudioUrl(trackId);
      }
    } catch (error) {
      console.error(`Error getting audio URL from ${source}:`, error);
      return null;
    }
  }

  /**
   * Получить информацию о треке
   * @param {string} trackId - ID трека
   * @param {string} source - источник
   * @returns {Promise<Object>} информация о треке
   */
  async getTrackInfo(trackId, source) {
    try {
      if (source === 'spotify') {
        return await this.apis.spotify.getTrackInfo(trackId);
      } else if (source === 'youtube') {
        return await this.apis.youtube.getTrackInfo(trackId);
      } else if (source === 'soundcloud') {
        return await this.apis.soundcloud.getTrackInfo(trackId);
      }
    } catch (error) {
      console.error(`Error getting track info from ${source}:`, error);
      return null;
    }
  }

  /**
   * Получить популярные треки
   * @param {string} genre - жанр
   * @param {number} limit - количество
   * @returns {Promise<Array>}
   */
  async getPopularTracks(genre = 'pop', limit = 50) {
    const cacheKey = `popular-${genre}-${limit}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const results = await this.apis.spotify.getPopularTracks(genre, limit);
      
      this.cache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.error('Error getting popular tracks:', error);
      return [];
    }
  }

  /**
   * Получить рекомендации на основе трека
   * @param {string} trackId - ID трека
   * @param {string} source - источник
   * @returns {Promise<Array>} рекомендованные треки
   */
  async getRecommendations(trackId, source = 'spotify') {
    try {
      if (source === 'spotify') {
        return await this.apis.spotify.getRecommendations(trackId);
      }
      return [];
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Конвертировать трек в стандартный формат
   * @param {Object} track - трек от API
   * @param {string} source - источник
   * @returns {Object}
   */
  normalizeTrack(track, source) {
    let normalized = {
      id: track.id,
      source: source,
      title: '',
      artist: '',
      album: '',
      duration: 0,
      imageUrl: null,
      audioUrl: null,
      externalUrl: null
    };

    if (source === 'spotify') {
      normalized = {
        ...normalized,
        title: track.name,
        artist: track.artists[0]?.name || 'Unknown',
        album: track.album?.name || '',
        duration: track.duration_ms,
        imageUrl: track.album?.images[0]?.url,
        externalUrl: track.external_urls?.spotify
      };
    } else if (source === 'youtube') {
      normalized = {
        ...normalized,
        title: track.snippet?.title || '',
        artist: track.snippet?.channelTitle || 'Unknown',
        duration: this._parseDuration(track.contentDetails?.duration),
        imageUrl: track.snippet?.thumbnails?.high?.url,
        externalUrl: `https://www.youtube.com/watch?v=${track.id}`
      };
    } else if (source === 'soundcloud') {
      normalized = {
        ...normalized,
        title: track.title,
        artist: track.user?.username || 'Unknown',
        duration: track.duration,
        imageUrl: track.artwork_url,
        externalUrl: track.permalink_url,
        audioUrl: track.url
      };
    }

    return normalized;
  }

  /**
   * Очистить кэш
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Парсить ISO 8601 длительность в миллисекунды
   * @private
   */
  _parseDuration(duration) {
    if (!duration) return 0;
    const matches = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!matches) return 0;

    let ms = 0;
    if (matches[1]) ms += parseInt(matches[1]) * 60 * 60 * 1000;
    if (matches[2]) ms += parseInt(matches[2]) * 60 * 1000;
    if (matches[3]) ms += parseInt(matches[3]) * 1000;
    
    return ms;
  }
}

/**
 * Spotify API интеграция
 */
class SpotifyAPI {
  constructor(apiKey, secret) {
    this.apiKey = apiKey;
    this.secret = secret;
    this.baseUrl = 'https://api.spotify.com/v1';
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  /**
   * Получить access token
   * @private
   */
  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(this.apiKey + ':' + this.secret)
        },
        body: 'grant_type=client_credentials'
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      return null;
    }
  }

  /**
   * Поиск трека на Spotify
   */
  async searchTrack(query) {
    try {
      const token = await this.getAccessToken();
      if (!token) return [];

      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      return data.tracks?.items || [];
    } catch (error) {
      console.error('Error searching Spotify:', error);
      return [];
    }
  }

  /**
   * Получить информацию о треке
   */
  async getTrackInfo(trackId) {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const response = await fetch(`${this.baseUrl}/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching track info:', error);
      return null;
    }
  }

  /**
   * Получить аудио URL (превью)
   */
  async getAudioUrl(trackId) {
    try {
      const track = await this.getTrackInfo(trackId);
      return track?.preview_url || null;
    } catch (error) {
      console.error('Error getting audio URL:', error);
      return null;
    }
  }

  /**
   * Получить популярные треки
   */
  async getPopularTracks(genre, limit = 50) {
    try {
      const token = await this.getAccessToken();
      if (!token) return [];

      const response = await fetch(
        `${this.baseUrl}/search?q=genre:${encodeURIComponent(genre)}&type=track&limit=${limit}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      return data.tracks?.items || [];
    } catch (error) {
      console.error('Error fetching popular tracks:', error);
      return [];
    }
  }

  /**
   * Получить рекомендации
   */
  async getRecommendations(trackId) {
    try {
      const token = await this.getAccessToken();
      if (!token) return [];

      const response = await fetch(
        `${this.baseUrl}/recommendations?seed_tracks=${trackId}&limit=20`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      return data.tracks || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }
}

/**
 * YouTube API интеграция
 */
class YouTubeAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Поиск трека на YouTube
   */
  async searchTrack(query) {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&type=video&part=snippet&key=${this.apiKey}&maxResults=20`
      );

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error searching YouTube:', error);
      return [];
    }
  }

  /**
   * Получить информацию о видео
   */
  async getTrackInfo(videoId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/videos?id=${videoId}&part=snippet,contentDetails&key=${this.apiKey}`
      );

      const data = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      console.error('Error fetching video info:', error);
      return null;
    }
  }

  /**
   * Получить аудио URL (не доступно напрямую из YouTube)
   */
  async getAudioUrl(videoId) {
    // YouTube не предоставляет прямой доступ к аудио через API
    // Используем yt-dlp или подобный сервис
    console.warn('Audio extraction from YouTube requires backend service');
    return null;
  }
}

/**
 * SoundCloud API интеграция
 */
class SoundCloudAPI {
  constructor(clientId) {
    this.clientId = clientId;
    this.baseUrl = 'https://api.soundcloud.com';
  }

  /**
   * Поиск трека на SoundCloud
   */
  async searchTrack(query) {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/search/tracks?q=${encodeURIComponent(query)}&client_id=${this.clientId}&limit=20`
      );

      const data = await response.json();
      return data.collection || [];
    } catch (error) {
      console.error('Error searching SoundCloud:', error);
      return [];
    }
  }

  /**
   * Получить информацию о треке
   */
  async getTrackInfo(trackId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/tracks/${trackId}?client_id=${this.clientId}`
      );

      return await response.json();
    } catch (error) {
      console.error('Error fetching track info:', error);
      return null;
    }
  }

  /**
   * Получить аудио URL
   */
  async getAudioUrl(trackId) {
    try {
      const track = await this.getTrackInfo(trackId);
      if (track?.media?.transcodings) {
        // Получить MP3 трансходирование
        const mp3 = track.media.transcodings.find(t => t.format.mime_type === 'audio/mpeg');
        if (mp3) {
          const response = await fetch(mp3.url + `?client_id=${this.clientId}`);
          const data = await response.json();
          return data.url;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting audio URL:', error);
      return null;
    }
  }
}

/**
 * Менеджер источников музыки
 */
export class MusicSourceManager {
  constructor() {
    this.sources = ['spotify', 'youtube', 'soundcloud', 'local'];
    this.preferences = {
      preferredSource: 'spotify',
      fallbackSources: ['youtube', 'soundcloud'],
      allowLocalOnly: false
    };
  }

  /**
   * Получить трек из предпочитаемого источника с fallback
   */
  async getTrackWithFallback(query) {
    const apiManager = new MusicAPIManager();

    // Сначала попытаться получить из предпочитаемого источника
    let results = await apiManager.searchTrack(query, this.preferences.preferredSource);
    if (results.length > 0) {
      return results[0];
    }

    // Затем попробовать fallback источники
    for (const source of this.preferences.fallbackSources) {
      results = await apiManager.searchTrack(query, source);
      if (results.length > 0) {
        return results[0];
      }
    }

    return null;
  }

  /**
   * Установить предпочтения источников
   */
  setSourcePreferences(preferences) {
    this.preferences = { ...this.preferences, ...preferences };
  }

  /**
   * Получить доступные источники
   */
  getAvailableSources() {
    return this.sources;
  }

  /**
   * Проверить доступность источника
   */
  async checkSourceAvailability(source) {
    try {
      if (source === 'spotify') {
        const apiManager = new MusicAPIManager();
        const token = await apiManager.apis.spotify.getAccessToken();
        return !!token;
      }
      return true;
    } catch (error) {
      console.error(`Error checking ${source} availability:`, error);
      return false;
    }
  }
}
