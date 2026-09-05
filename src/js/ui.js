// UI Management Module
// Handles all DOM interactions and user interface updates

class UIManager {
  constructor() {
    this.cacheElements();
    this.setupEventListeners();
  }

  // Cache DOM elements
  cacheElements() {
    // Auth elements
    this.authContainer = document.getElementById('auth-container');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.toggleAuthBtn = document.getElementById('toggle-auth-btn');
    this.loginSubmitBtn = document.getElementById('login-submit');
    this.registerSubmitBtn = document.getElementById('register-submit');
    this.loginEmail = document.getElementById('login-email');
    this.loginPassword = document.getElementById('login-password');
    this.registerEmail = document.getElementById('register-email');
    this.registerPassword = document.getElementById('register-password');
    this.registerConfirmPassword = document.getElementById('register-confirm-password');
    this.authErrorMsg = document.getElementById('auth-error-msg');

    // Game elements
    this.gameContainer = document.getElementById('game-container');
    this.gameScreen = document.getElementById('game-screen');
    this.audioPlayer = document.getElementById('audio-player');
    this.playBtn = document.getElementById('play-btn');
    this.skipBtn = document.getElementById('skip-btn');
    this.giveUpBtn = document.getElementById('give-up-btn');
    this.guessInput = document.getElementById('guess-input');
    this.suggestionsContainer = document.getElementById('suggestions');
    this.submitGuessBtn = document.getElementById('submit-guess');
    this.currentDurationSpan = document.getElementById('current-duration');
    this.maxDurationSpan = document.getElementById('max-duration');
    this.attemptSpan = document.getElementById('attempt');
    this.pointsSpan = document.getElementById('points');
    this.resultMessage = document.getElementById('result-message');
    this.trackNameSpan = document.getElementById('track-name');
    this.artistSpan = document.getElementById('artist');
    this.nextGameBtn = document.getElementById('next-game-btn');

    // Profile elements
    this.profileBtn = document.getElementById('profile-btn');
    this.profileModal = document.getElementById('profile-modal');
    this.closeProfileBtn = document.getElementById('close-profile');
    this.nicknameInput = document.getElementById('nickname-input');
    this.avatarInput = document.getElementById('avatar-input');
    this.saveProfileBtn = document.getElementById('save-profile');
    this.currentNickname = document.getElementById('current-nickname');
    this.currentAvatar = document.getElementById('current-avatar');
    this.profileError = document.getElementById('profile-error');

    // Stats elements
    this.scoreSpan = document.getElementById('score');
    this.levelSpan = document.getElementById('level');
    this.progressBar = document.getElementById('progress-bar');
    this.scoreToNextSpan = document.getElementById('score-to-next');

    // Status elements
    this.loadingSpinner = document.getElementById('loading-spinner');
    this.errorContainer = document.getElementById('error-container');
    this.errorMessage = document.getElementById('error-message');
    this.logoutBtn = document.getElementById('logout-btn');
  }

  // Setup event listeners
  setupEventListeners() {
    // Auth events
    if (this.toggleAuthBtn) {
      this.toggleAuthBtn.addEventListener('click', () => this.toggleAuthMode());
    }
    if (this.loginSubmitBtn) {
      this.loginSubmitBtn.addEventListener('click', () => this.handleLoginSubmit());
    }
    if (this.registerSubmitBtn) {
      this.registerSubmitBtn.addEventListener('click', () => this.handleRegisterSubmit());
    }

    // Game events
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.handlePlayClick());
    }
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.handleSkipClick());
    }
    if (this.giveUpBtn) {
      this.giveUpBtn.addEventListener('click', () => this.handleGiveUpClick());
    }
    if (this.submitGuessBtn) {
      this.submitGuessBtn.addEventListener('click', () => this.handleGuessSubmit());
    }
    if (this.guessInput) {
      this.guessInput.addEventListener('input', (e) => this.handleGuessInput(e));
      this.guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleGuessSubmit();
      });
    }
    if (this.nextGameBtn) {
      this.nextGameBtn.addEventListener('click', () => this.handleNextGame());
    }

    // Profile events
    if (this.profileBtn) {
      this.profileBtn.addEventListener('click', () => this.showProfileModal());
    }
    if (this.closeProfileBtn) {
      this.closeProfileBtn.addEventListener('click', () => this.closeProfileModal());
    }
    if (this.saveProfileBtn) {
      this.saveProfileBtn.addEventListener('click', () => this.handleSaveProfile());
    }
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  // Auth UI methods
  toggleAuthMode() {
    if (this.loginForm.style.display !== 'none') {
      this.loginForm.style.display = 'none';
      this.registerForm.style.display = 'block';
      this.toggleAuthBtn.textContent = 'Already have an account? Login';
    } else {
      this.loginForm.style.display = 'block';
      this.registerForm.style.display = 'none';
      this.toggleAuthBtn.textContent = "Don't have an account? Register";
    }
    this.clearAuthErrors();
  }

  handleLoginSubmit() {
    const email = this.loginEmail.value.trim();
    const password = this.loginPassword.value;

    if (!email || !password) {
      this.showAuthError('Please fill in all fields');
      return;
    }

    window.dispatchEvent(
      new CustomEvent('login-attempt', {
        detail: { email, password },
      })
    );
  }

  handleRegisterSubmit() {
    const email = this.registerEmail.value.trim();
    const password = this.registerPassword.value;
    const confirmPassword = this.registerConfirmPassword.value;

    if (!email || !password || !confirmPassword) {
      this.showAuthError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      this.showAuthError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      this.showAuthError('Password must be at least 6 characters');
      return;
    }

    window.dispatchEvent(
      new CustomEvent('register-attempt', {
        detail: { email, password },
      })
    );
  }

  showAuthError(message) {
    this.authErrorMsg.textContent = message;
    this.authErrorMsg.style.display = 'block';
  }

  clearAuthErrors() {
    this.authErrorMsg.style.display = 'none';
    this.loginEmail.value = '';
    this.loginPassword.value = '';
    this.registerEmail.value = '';
    this.registerPassword.value = '';
    this.registerConfirmPassword.value = '';
  }

  // Game UI methods
  showGameContainer() {
    this.authContainer.style.display = 'none';
    this.gameContainer.style.display = 'block';
  }

  hideGameContainer() {
    this.gameContainer.style.display = 'none';
    this.authContainer.style.display = 'block';
    this.clearAuthErrors();
  }

  handlePlayClick() {
    window.dispatchEvent(new CustomEvent('play-click'));
  }

  handleSkipClick() {
    window.dispatchEvent(new CustomEvent('skip-click'));
  }

  handleGiveUpClick() {
    if (confirm('Are you sure you want to give up? You will not earn any points.')) {
      window.dispatchEvent(new CustomEvent('give-up-click'));
    }
  }

  handleGuessSubmit() {
    const guess = this.guessInput.value.trim();
    if (guess) {
      window.dispatchEvent(new CustomEvent('guess-submit', { detail: { guess } }));
      this.guessInput.value = '';
      this.suggestionsContainer.innerHTML = '';
    }
  }

  handleGuessInput(e) {
    const input = e.target.value;
    if (input.length < 1) {
      this.suggestionsContainer.innerHTML = '';
      return;
    }

    window.dispatchEvent(
      new CustomEvent('get-suggestions', {
        detail: { input },
      })
    );
  }

  showSuggestions(suggestions) {
    this.suggestionsContainer.innerHTML = '';
    suggestions.forEach((suggestion) => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.textContent = suggestion;
      div.addEventListener('click', () => {
        this.guessInput.value = suggestion;
        this.suggestionsContainer.innerHTML = '';
      });
      this.suggestionsContainer.appendChild(div);
    });
  }

  handleNextGame() {
    this.resultMessage.style.display = 'none';
    this.guessInput.disabled = false;
    this.submitGuessBtn.disabled = false;
    this.guessInput.focus();
    window.dispatchEvent(new CustomEvent('next-game'));
  }

  updateGameState(state) {
    this.currentDurationSpan.textContent = (state.currentDuration * 1000).toFixed(0);
    this.maxDurationSpan.textContent = (state.maxDuration * 1000).toFixed(0);
    this.attemptSpan.textContent = state.currentStep;

    const isBonus = state.currentStep === 0;
    this.pointsSpan.textContent = isBonus ? 'BONUS' : '100';
  }

  showResult(result, gameState) {
    this.resultMessage.style.display = 'block';
    this.guessInput.disabled = true;
    this.submitGuessBtn.disabled = true;

    if (result.correct) {
      this.resultMessage.innerHTML = `
        <h3>✓ Correct!</h3>
        <p>Track: ${result.trackName}</p>
        <p>Points: ${result.points}</p>
      `;
      this.resultMessage.className = 'result-message success';
    } else {
      this.resultMessage.innerHTML = `
        <h3>✗ Wrong Answer</h3>
        <p>Try again or skip to hear more!</p>
      `;
      this.resultMessage.className = 'result-message error';
    }
  }

  showGameOver(result) {
    this.resultMessage.style.display = 'block';
    this.guessInput.disabled = true;
    this.submitGuessBtn.disabled = true;
    this.skipBtn.disabled = true;

    this.resultMessage.innerHTML = `
      <h3>Game Over!</h3>
      <p>Track: ${result.trackName}</p>
      <p>Artist: ${result.artist || 'Unknown'}</p>
      <button id="next-game-btn">Next Track</button>
    `;
    this.resultMessage.className = 'result-message game-over';

    const nextBtn = document.getElementById('next-game-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.handleNextGame());
    }
  }

  updateStats(score, userData) {
    const levelInfo = window.GameManager ? window.GameManager.constructor.getLevelInfo(score) : null;

    this.scoreSpan.textContent = score;
    if (levelInfo) {
      this.levelSpan.textContent = levelInfo.level;
      this.progressBar.style.width = levelInfo.progressPercent + '%';
      this.scoreToNextSpan.textContent = levelInfo.scoreToNext;
    }
  }

  // Profile UI methods
  showProfileModal() {
    this.profileModal.style.display = 'block';
    window.dispatchEvent(new CustomEvent('load-profile-data'));
  }

  closeProfileModal() {
    this.profileModal.style.display = 'none';
    this.profileError.style.display = 'none';
  }

  updateProfileDisplay(userData) {
    this.currentNickname.textContent = userData.nickname || 'Guest';
    if (userData.avatarUrl) {
      this.currentAvatar.src = userData.avatarUrl;
    }
    this.nicknameInput.value = userData.nickname || '';
    this.avatarInput.value = userData.avatarUrl || '';
  }

  handleSaveProfile() {
    const nickname = this.nicknameInput.value.trim();
    const avatarUrl = this.avatarInput.value.trim();

    if (!nickname) {
      this.showProfileError('Nickname cannot be empty');
      return;
    }

    window.dispatchEvent(
      new CustomEvent('save-profile', {
        detail: { nickname, avatarUrl },
      })
    );
  }

  showProfileError(message) {
    this.profileError.textContent = message;
    this.profileError.style.display = 'block';
  }

  handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      window.dispatchEvent(new CustomEvent('logout-click'));
    }
  }

  // Loading and error methods
  showLoading() {
    this.loadingSpinner.style.display = 'block';
  }

  hideLoading() {
    this.loadingSpinner.style.display = 'none';
  }

  showError(message) {
    this.errorMessage.textContent = message;
    this.errorContainer.style.display = 'block';
  }

  hideError() {
    this.errorContainer.style.display = 'none';
  }

  clearGameScreen() {
    this.guessInput.value = '';
    this.suggestionsContainer.innerHTML = '';
    this.resultMessage.style.display = 'none';
    this.guessInput.disabled = false;
    this.submitGuessBtn.disabled = false;
    this.skipBtn.disabled = false;
  }
}

export { UIManager };
