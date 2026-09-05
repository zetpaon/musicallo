// Authentication Module
// Handles user login, registration, and profile management

let currentAuthUser = null;
let userData = null;

class AuthManager {
  constructor(auth, db) {
    this.auth = auth;
    this.db = db;
    this.isLoginMode = true;
  }

  // Initialize auth state listener
  initAuthStateListener(callback) {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        currentAuthUser = user;
        this.loadUserData(user.uid, callback);
      } else {
        currentAuthUser = null;
        userData = null;
        callback(null);
      }
    });
  }

  // Load user data from Firestore
  async loadUserData(uid, callback) {
    try {
      const doc = await this.db.collection('users').doc(uid).get();
      if (doc.exists) {
        userData = doc.data();
      } else {
        userData = {
          score: 0,
          nickname: this.auth.currentUser.email,
          avatarUrl: '',
          playedTracks: {},
        };
        await this.db.collection('users').doc(uid).set(userData);
      }
      callback(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
      callback(null);
    }
  }

  // User login
  async login(email, password) {
    try {
      await this.auth.signInWithEmailAndPassword(email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // User registration
  async register(email, password) {
    try {
      await this.auth.createUserWithEmailAndPassword(email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // User logout
  async logout() {
    try {
      await this.auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update user profile
  async updateProfile(nickname, avatarUrl) {
    if (!currentAuthUser) return { success: false, error: 'Not logged in' };

    try {
      await this.db.collection('users').doc(currentAuthUser.uid).set(
        {
          nickname: nickname.trim(),
          avatarUrl: avatarUrl.trim(),
        },
        { merge: true }
      );
      userData = { ...userData, nickname, avatarUrl };
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Save score to Firestore
  async saveScore(score) {
    if (!currentAuthUser) return;

    try {
      await this.db.collection('users').doc(currentAuthUser.uid).set(
        {
          score: score,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }

  // Save played track timestamp
  async savePlayedTrack(trackId) {
    if (!currentAuthUser || !userData) return;

    try {
      if (!userData.playedTracks) {
        userData.playedTracks = {};
      }
      userData.playedTracks[trackId] = Date.now();

      await this.db.collection('users').doc(currentAuthUser.uid).update({
        playedTracks: userData.playedTracks,
      });
    } catch (error) {
      console.error('Error saving played track:', error);
    }
  }

  // Get current user
  getCurrentUser() {
    return currentAuthUser;
  }

  // Get user data
  getUserData() {
    return userData;
  }

  // Check if user is logged in
  isLoggedIn() {
    return currentAuthUser !== null;
  }

  // Toggle auth mode (login/register)
  toggleAuthMode() {
    this.isLoginMode = !this.isLoginMode;
    return this.isLoginMode;
  }
}

export { AuthManager, currentAuthUser, userData };
