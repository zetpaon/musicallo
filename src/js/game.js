// Game Logic Module
// Handles core game mechanics, track management, and scoring

const TRACKS_URL =
  'https://raw.githubusercontent.com/zetpaon/musicallo/refs/heads/data/tracks.json';
const DURATIONS = [0.1, 0.5, 1, 2, 3, 5, 8];
const SCORES = [100, 50, 25, 15, 10, 7, 5];
const MAX_ATTEMPTS = DURATIONS.length - 1;
const BONUS_STEP = 0;
const AUDIO_START_OFFSET = 0.25;
const TOTAL_POTENTIAL_DURATION = AUDIO_START_OFFSET + DURATIONS.reduce((sum, d) => sum + d, 0);
const WEEKLY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

let TRACKS = [];
let ALL_SUGGESTIONS = [];
let currentTrack = null;
let currentStep = BONUS_STEP;
let gameOver = false;
let tracksLoaded = false;

class GameManager {
  constructor() {
    this.currentTrack = null;
    this.currentStep = BONUS_STEP;
    this.gameOver = false;
    this.maxEnd = AUDIO_START_OFFSET + DURATIONS[BONUS_STEP];
    this.currentPlayStart = AUDIO_START_OFFSET;
    this.currentPlayEnd = this.maxEnd;
    this.boundaries = [];
  }

  // Load tracks from data branch
  async loadTracks() {
    try {
      const response = await fetch(TRACKS_URL);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      if (!Array.isArray(data.tracks) || data.tracks.length === 0) {
        throw new Error('Invalid data format: tracks array missing');
      }

      TRACKS = data.tracks;
      if (Array.isArray(data.suggestions)) {
        ALL_SUGGESTIONS = data.suggestions;
      } else {
        console.warn('Suggestions array missing');
      }

      tracksLoaded = true;
      return { success: true, tracksCount: TRACKS.length };
    } catch (error) {
      console.error('Error loading tracks:', error);
      return { success: false, error: error.message };
    }
  }

  // Select random track from available ones
  selectTrack(userData = null) {
    if (TRACKS.length === 0) {
      return { success: false, error: 'No tracks available' };
    }

    let availableTracks = TRACKS;

    // Filter out recently played tracks (within 7 days)
    if (userData && userData.playedTracks) {
      const now = Date.now();
      availableTracks = TRACKS.filter((track) => {
        const lastPlayed = userData.playedTracks[track.id];
        return !lastPlayed || now - lastPlayed > WEEKLY_COOLDOWN_MS;
      });
    }

    if (availableTracks.length === 0) {
      return { success: false, error: 'All tracks recently played', noTracksAvailable: true };
    }

    const randomIndex = Math.floor(Math.random() * availableTracks.length);
    this.currentTrack = availableTracks[randomIndex];
    this.currentStep = BONUS_STEP;
    this.maxEnd = AUDIO_START_OFFSET + DURATIONS[BONUS_STEP];
    this.boundaries = [];
    this.currentPlayStart = AUDIO_START_OFFSET;
    this.currentPlayEnd = this.maxEnd;
    this.gameOver = false;

    return { success: true, track: this.currentTrack };
  }

  // Skip to next attempt
  skipAttempt() {
    if (this.currentStep >= DURATIONS.length - 1) {
      return { success: false, error: 'Maximum duration reached' };
    }

    this.currentStep++;
    this.boundaries.push(this.maxEnd);
    this.maxEnd = AUDIO_START_OFFSET + DURATIONS.slice(0, this.currentStep + 1).reduce((a, b) => a + b, 0);
    this.currentPlayStart = AUDIO_START_OFFSET + DURATIONS.slice(0, this.currentStep).reduce((a, b) => a + b, 0);
    this.currentPlayEnd = this.maxEnd;

    return {
      success: true,
      step: this.currentStep,
      duration: DURATIONS[this.currentStep],
      maxDuration: DURATIONS[DURATIONS.length - 1],
    };
  }

  // Check if guess is correct
  checkGuess(guess) {
    if (!this.currentTrack) {
      return { success: false, error: 'No track selected' };
    }

    const normalizedGuess = guess.toLowerCase().trim();
    const isCorrect = this.currentTrack.correctAnswers.some(
      (answer) => answer.toLowerCase().trim() === normalizedGuess
    );

    if (isCorrect) {
      const points = this.currentStep > 0 ? SCORES[this.currentStep - 1] : 0;
      this.gameOver = true;
      return {
        success: true,
        correct: true,
        trackName: this.currentTrack.fullName,
        attempt: this.currentStep,
        points: points,
      };
    }

    return { success: true, correct: false };
  }

  // Get suggestions for autocomplete
  getSuggestions(input) {
    if (!input || input.length < 1) return [];
    const normalized = input.toLowerCase();
    return ALL_SUGGESTIONS.filter((s) => s.toLowerCase().includes(normalized)).slice(0, 5);
  }

  // Give up and reveal answer
  giveUp() {
    if (!this.currentTrack) {
      return { success: false, error: 'No track selected' };
    }

    this.gameOver = true;
    return {
      success: true,
      trackName: this.currentTrack.fullName,
      artist: this.currentTrack.artist,
    };
  }

  // Get current game state
  getGameState() {
    return {
      currentTrack: this.currentTrack,
      currentStep: this.currentStep,
      maxEnd: this.maxEnd,
      currentPlayStart: this.currentPlayStart,
      currentPlayEnd: this.currentPlayEnd,
      boundaries: this.boundaries,
      gameOver: this.gameOver,
      isBonus: this.currentStep === BONUS_STEP,
      currentDuration: DURATIONS[this.currentStep],
      maxAttempts: MAX_ATTEMPTS,
    };
  }

  // Reset game
  resetGame() {
    this.currentTrack = null;
    this.currentStep = BONUS_STEP;
    this.gameOver = false;
    this.maxEnd = AUDIO_START_OFFSET + DURATIONS[BONUS_STEP];
    this.currentPlayStart = AUDIO_START_OFFSET;
    this.currentPlayEnd = this.maxEnd;
    this.boundaries = [];
  }

  // Get level information
  static getLevelInfo(score) {
    const levelThresholds = {
      base: 150,
      increases: [
        { min: 11, max: 20, add: 5 },
        { min: 21, max: 30, add: 10 },
        { min: 31, max: 40, add: 15 },
        { min: 41, max: 50, add: 20 },
        { min: 51, max: 60, add: 25 },
        { min: 61, max: 70, add: 30 },
        { min: 71, max: 80, add: 35 },
        { min: 81, max: 90, add: 40 },
        { min: 91, max: 100, add: 45 },
        { min: 101, max: 110, add: 50 },
        { min: 111, max: 120, add: 55 },
        { min: 121, max: 130, add: 60 },
        { min: 131, max: 140, add: 65 },
        { min: 141, max: 150, add: 70 },
      ],
    };

    let level = 1;
    let currentLevelScore = 0;
    let nextLevelScore = levelThresholds.base;

    while (score >= nextLevelScore && level < 150) {
      level++;
      currentLevelScore = nextLevelScore;
      const increment = levelThresholds.increases.find(
        (inc) => level >= inc.min && level <= inc.max
      );
      nextLevelScore += increment ? levelThresholds.base + increment.add : levelThresholds.base + 70;
    }

    const currentLevelThreshold = nextLevelScore - currentLevelScore;
    const progressInLevel = score - currentLevelScore;
    const progressPercent = Math.min(100, (progressInLevel / currentLevelThreshold) * 100);

    return {
      level,
      currentLevelThreshold,
      progressInLevel,
      progressPercent,
      scoreToNext: currentLevelThreshold - progressInLevel,
    };
  }
}

export { GameManager, TRACKS_URL, DURATIONS, SCORES, BONUS_STEP, MAX_ATTEMPTS };
