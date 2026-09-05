// Main Application Module
// Initializes and orchestrates all game components

import { GameManager, TRACKS_URL, DURATIONS, SCORES, BONUS_STEP, MAX_ATTEMPTS } from './game.js';
import { UIManager } from './ui.js';
import { AudioManager } from './audio.js';
import { AuthManager } from './auth.js';

class MusicalloApp {
  constructor() {
    this.gameManager = new GameManager();
    this.uiManager = new UIManager();
    this.audioManager = new AudioManager();
    this.authManager = new AuthManager();
    this.currentTrackUrl = null;
  }

  // Initialize application
  async init() {
    console.log('Initializing Musicallo...');

    try {
      // Load saved session
      const sessionLoaded = this.authManager.loadSession();

      if (sessionLoaded) {
        // Verify token is still valid
        const verifyResult = await this.authManager.verifyToken();
        if (verifyResult.authenticated) {
          this.showGameUI();
          await this.initializeGame();
        } else {
          this.showAuthUI();
        }
      } else {
        this.showAuthUI();
      }

      this.setupEventListeners();
    } catch (error) {
      console.error('Initialization error:', error);
      this.uiManager.showError('Failed to initialize app');
    }
  }

  // Setup all event listeners
  setupEventListeners() {
    // Auth events
    window.addEventListener('login-attempt', (e) => this.handleLogin(e.detail));
    window.addEventListener('register-attempt', (e) => this.handleRegister(e.detail));
    window.addEventListener('logout-click', () => this.handleLogout());

    // Game events
    window.addEventListener('play-click', () => this.handlePlayClick());
    window.addEventListener('skip-click', () => this.handleSkipClick());
    window.addEventListener('give-up-click', () => this.handleGiveUp());
    window.addEventListener('guess-submit', (e) => this.handleGuessSubmit(e.detail));
    window.addEventListener('get-suggestions', (e) => this.handleGetSuggestions(e.detail));
    window.addEventListener('next-game', () => this.handleNextGame());

    // Profile events
    window.addEventListener('load-profile-data', () => this.handleLoadProfileData());
    window.addEventListener('save-profile', (e) => this.handleSaveProfile(e.detail));
  }

  // ===== Authentication Methods =====

  async handleLogin(credentials) {
    this.uiManager.showLoading();

    const result = await this.authManager.login(credentials.email, credentials.password);

    if (result.success) {
      this.showGameUI();
      await this.initializeGame();
      this.uiManager.hideLoading();
    } else {
      this.uiManager.showAuthError(result.error);
      this.uiManager.hideLoading();
    }
  }

  async handleRegister(credentials) {
    this.uiManager.showLoading();

    const result = await this.authManager.register(credentials.email, credentials.password);

    if (result.success) {
      this.showGameUI();
      await this.initializeGame();
      this.uiManager.hideLoading();
    } else {
      this.uiManager.showAuthError(result.error);
      this.uiManager.hideLoading();
    }
  }

  async handleLogout() {
    this.uiManager.showLoading();
    await this.authManager.logout();
    this.audioManager.dispose();
    this.showAuthUI();
    this.uiManager.hideLoading();
  }

  // ===== Game Initialization =====

  async initializeGame() {
    try {
      // Load tracks data
      const loadResult = await this.gameManager.loadTracks();

      if (!loadResult.success) {
        this.uiManager.showError('Failed to load tracks');
        return;
      }

      // Select first track
      const selectResult = this.gameManager.selectTrack();

      if (selectResult.success) {
        this.currentTrack = selectResult.track;
        await this.preloadTrackAudio();
        this.updateGameUI();
        this.uiManager.updateStats(
          this.authManager.getCurrentUser().score || 0,
          this.authManager.getCurrentUser()
        );
      }
    } catch (error) {
      console.error('Game initialization error:', error);
      this.uiManager.showError('Failed to initialize game');
    }
  }

  // ===== Audio Management =====

  async preloadTrackAudio() {
    if (!this.currentTrack || !this.currentTrack.audioUrl) {
      console.error('No track or audio URL available');
      return;
    }

    try {
      const result = await this.audioManager.preloadTrackAudio(this.currentTrack);

      if (!result.success) {
        this.uiManager.showError('Failed to load audio');
      }
    } catch (error) {
      console.error('Audio preload error:', error);
      this.uiManager.showError('Failed to load audio');
    }
  }

  async handlePlayClick() {
    const state = this.gameManager.getGameState();

    if (!this.audioManager.getIsPlaying()) {
      const result = this.audioManager.playSegment(state.currentPlayStart, state.currentPlayEnd);

      if (!result.success) {
        this.uiManager.showError('Failed to play audio');
      }
    } else {
      this.audioManager.pausePlayback();
    }
  }

  // ===== Game Logic =====

  handleSkipClick() {
    const result = this.gameManager.skipAttempt();

    if (result.success) {
      this.updateGameUI();
    } else {
      this.uiManager.showError(result.error);
      this.handleGameOver();
    }
  }

  async handleGuessSubmit(data) {
    const checkResult = this.gameManager.checkGuess(data.guess);

    if (checkResult.correct) {
      // Save result to backend
      await this.saveGameResult({
        trackId: this.gameManager.currentTrack.id,
        attempt: checkResult.attempt,
        points: checkResult.points,
        correct: true,
      });

      this.uiManager.showResult(checkResult, this.gameManager.getGameState());
      this.updateStats();
    } else if (!checkResult.correct && checkResult.success) {
      this.uiManager.showResult(checkResult, this.gameManager.getGameState());
    }
  }

  handleGiveUp() {
    const result = this.gameManager.giveUp();

    // Save result to backend (0 points)
    this.saveGameResult({
      trackId: this.gameManager.currentTrack.id,
      attempt: this.gameManager.currentStep,
      points: 0,
      correct: false,
    });

    this.uiManager.showGameOver(result);
  }

  async handleNextGame() {
    this.audioManager.clearAudio();
    this.gameManager.resetGame();

    const selectResult = this.gameManager.selectTrack(this.authManager.getCurrentUser());

    if (selectResult.success) {
      this.currentTrack = selectResult.track;
      await this.preloadTrackAudio();
      this.updateGameUI();
      this.uiManager.clearGameScreen();
    } else if (selectResult.noTracksAvailable) {
      this.uiManager.showError('All tracks have been played recently. Come back later!');
    } else {
      this.uiManager.showError(selectResult.error);
    }
  }

  handleGameOver() {
    this.gameManager.gameOver = true;
    const result = this.gameManager.giveUp();
    this.uiManager.showGameOver(result);
  }

  handleGetSuggestions(data) {
    const suggestions = this.gameManager.getSuggestions(data.input);
    this.uiManager.showSuggestions(suggestions);
  }

  // ===== Profile Management =====

  async handleLoadProfileData() {
    const user = this.authManager.getCurrentUser();
    this.uiManager.updateProfileDisplay(user);
  }

  async handleSaveProfile(data) {
    this.uiManager.showLoading();

    const result = await this.authManager.updateProfile(data.nickname, data.avatarUrl);

    if (result.success) {
      this.uiManager.updateProfileDisplay(result.user);
      this.uiManager.closeProfileModal();
      this.uiManager.hideLoading();
    } else {
      this.uiManager.showProfileError(result.error);
      this.uiManager.hideLoading();
    }
  }

  // ===== Stats and Results =====

  async saveGameResult(result) {
    try {
      const saveResult = await this.authManager.saveGameResult(result);

      if (saveResult.success) {
        // Update local user data
        console.log('Game result saved successfully');
        return saveResult;
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  }

  updateStats() {
    const user = this.authManager.getCurrentUser();
    this.uiManager.updateStats(user.score || 0, user);
  }

  // ===== UI State Management =====

  updateGameUI() {
    const state = this.gameManager.getGameState();
    this.uiManager.updateGameState(state);
  }

  showGameUI() {
    this.uiManager.showGameContainer();
  }

  showAuthUI() {
    this.uiManager.hideGameContainer();
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new MusicalloApp();
    window.app.init();
  });
} else {
  window.app = new MusicalloApp();
  window.app.init();
}

export { MusicalloApp };
