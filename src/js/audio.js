// Audio Management Module
// Handles audio playback, trimming, and playback state

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.audioBuffer = null;
    this.source = null;
    this.isPlaying = false;
    this.currentPlayStart = 0;
    this.currentPlayEnd = 0;
    this.startTime = 0;
    this.pauseTime = 0;
  }

  // Initialize audio context
  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Load audio from URL
  async loadAudio(url) {
    try {
      await this.initAudioContext();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return { success: true };
    } catch (error) {
      console.error('Error loading audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Play audio segment
  playSegment(startTime, endTime) {
    if (!this.audioBuffer || !this.audioContext) {
      return { success: false, error: 'Audio not loaded' };
    }

    // Stop current playback
    this.stopPlayback();

    this.currentPlayStart = startTime;
    this.currentPlayEnd = endTime;

    try {
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = this.audioBuffer;

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1;

      this.source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      this.startTime = this.audioContext.currentTime;
      this.isPlaying = true;

      // Play from startTime to endTime
      this.source.start(0, startTime);

      // Schedule stop at endTime
      const duration = endTime - startTime;
      this.stopTimeout = setTimeout(() => {
        this.stopPlayback();
      }, duration * 1000);

      return { success: true };
    } catch (error) {
      console.error('Error playing audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop audio playback
  stopPlayback() {
    if (this.source && this.isPlaying) {
      try {
        this.source.stop();
      } catch (error) {
        // Already stopped
      }
    }

    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
    }

    this.isPlaying = false;
    this.pauseTime = 0;
  }

  // Resume playback
  resumePlayback() {
    if (!this.isPlaying && this.pauseTime > 0) {
      const remainingDuration = this.currentPlayEnd - this.pauseTime;
      return this.playSegment(this.pauseTime, this.currentPlayEnd);
    }
  }

  // Pause playback
  pausePlayback() {
    if (this.isPlaying) {
      const elapsed = this.audioContext.currentTime - this.startTime;
      this.pauseTime = this.currentPlayStart + elapsed;
      this.stopPlayback();
    }
  }

  // Get current playback time
  getCurrentTime() {
    if (this.isPlaying && this.audioContext) {
      return this.currentPlayStart + (this.audioContext.currentTime - this.startTime);
    }
    return this.pauseTime;
  }

  // Check if audio is currently playing
  getIsPlaying() {
    return this.isPlaying;
  }

  // Get audio duration
  getDuration() {
    if (this.audioBuffer) {
      return this.audioBuffer.duration;
    }
    return 0;
  }

  // Preload audio for track
  async preloadTrackAudio(track) {
    if (!track || !track.audioUrl) {
      return { success: false, error: 'Track or audio URL missing' };
    }

    try {
      return await this.loadAudio(track.audioUrl);
    } catch (error) {
      console.error('Error preloading track audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Set volume
  setVolume(volume) {
    if (this.source && this.source.context) {
      const gainNode = this.source.context.createGain();
      gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Clear audio buffer
  clearAudio() {
    this.stopPlayback();
    this.audioBuffer = null;
    this.source = null;
  }

  // Cleanup
  dispose() {
    this.clearAudio();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export { AudioManager };
