export class FreezeDanceGame {
  constructor(container, soundEngine, particles) {
    this.container = container;
    this.soundEngine = soundEngine;
    this.particles = particles;

    this.isPlaying = false;
    this.isPaused = false;
    this.freezeTimer = null;
    this.currentYtId = 'rVBHH5DwYFA'; // Default Freeze Dance Track
    this.ytPlayer = null;
    this.ytReady = false;

    this.initDOM();
    this.bindEvents();
    this.loadYouTubeVideo();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="freeze-dance-wrapper card">
        <div class="freeze-header">
          <div class="freeze-title-group">
            <span class="game-badge">💃 KIDS PARTY GAME</span>
            <h2>Freeze Dance & Party Video</h2>
          </div>
          <div class="freeze-status-badge" id="freeze-status-badge">
            Ready to Dance! Load YouTube Track & Touch Start 🎵
          </div>
        </div>

        <!-- Toolbar & Preset Selector -->
        <div class="freeze-toolbar">
          <div class="freeze-url-box">
            <label for="freeze-yt-input">🎵 YouTube Song Link:</label>
            <input type="text" id="freeze-yt-input" placeholder="Paste YouTube URL..." value="https://youtu.be/rVBHH5DwYFA?si=foprXlkd68dA3zE0" />
            <button id="freeze-load-btn" class="btn-secondary">🎵 Load Song</button>
            <select id="freeze-yt-preset" class="theme-select-input">
              <option value="">✨ Quick Presets</option>
              <option value="rVBHH5DwYFA">🔥 Default Freeze Dance Track</option>
              <option value="k4yXQkG2s1E">🎉 Party Beat Track</option>
              <option value="2UcZWXvgMZE">🧊 Freeze Dance Song for Kids</option>
              <option value="L0MK7qz13bU">👑 Frozen — Let It Go</option>
              <option value="XqZsoesa55w">🦈 Baby Shark Freeze Beat</option>
              <option value="KQ6zr6kCPj8">💃 Party Rock Anthem</option>
              <option value="astISOttWH0">🕺 Gummy Bear Song</option>
            </select>
          </div>
        </div>

        <!-- Almost Full-Screen Video Arena -->
        <div class="freeze-stage-container" id="freeze-stage">
          <div id="freeze-video-container" class="freeze-video-frame">
            <div id="freeze-yt-player-frame"></div>
          </div>

          <!-- Animated Frozen Overlay Screen Banner -->
          <div id="freeze-overlay" class="freeze-overlay" style="display: none;">
            <div class="freeze-ice-card">
              <div class="freeze-ice-emoji">🧊 🥶 🗿 😱 🧊</div>
              <h1 class="freeze-ice-title">FROZEN!</h1>
              <p class="freeze-ice-sub">Music Paused! Kids Freeze in Place! 🛑</p>
            </div>
          </div>

          <!-- Action Controls Overlay -->
          <div class="freeze-action-bar">
            <button id="freeze-action-btn" class="freeze-main-btn">
              <span class="btn-icon">▶️</span>
              <span class="btn-label">START FREEZE DANCE</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.statusBadge = this.container.querySelector('#freeze-status-badge');
    this.actionBtn = this.container.querySelector('#freeze-action-btn');
    this.ytInput = this.container.querySelector('#freeze-yt-input');
    this.loadBtn = this.container.querySelector('#freeze-load-btn');
    this.presetSelect = this.container.querySelector('#freeze-yt-preset');
    this.overlay = this.container.querySelector('#freeze-overlay');
  }

  bindEvents() {
    this.actionBtn.addEventListener('click', () => this.handleActionClick());
    this.loadBtn.addEventListener('click', () => this.handleUrlLoad());
    this.presetSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        this.ytInput.value = `https://www.youtube.com/watch?v=${e.target.value}`;
        this.handleUrlLoad();
      }
    });
  }

  extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : (url.length === 11 ? url : null);
  }

  handleUrlLoad() {
    const url = this.ytInput.value.trim();
    const videoId = this.extractYouTubeId(url);
    if (!videoId) {
      alert('Please enter a valid YouTube video URL or ID!');
      return;
    }
    this.currentYtId = videoId;
    if (this.isPlaying) {
      this.stopFreezeDance();
    }
    this.loadYouTubeVideo();
    this.statusBadge.textContent = `🎵 YouTube Song Loaded! Press Start Freeze Dance 💃`;
  }

  loadYouTubeVideo() {
    if (window.YT && window.YT.Player) {
      this.initYTPlayer();
    } else {
      if (!window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = () => {
          if (window._freezeInstance) window._freezeInstance.initYTPlayer();
        };
      }
      window._freezeInstance = this;

      if (!document.getElementById('yt-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }
  }

  initYTPlayer() {
    const frame = document.getElementById('freeze-yt-player-frame');
    if (!frame) return;

    if (this.ytPlayer) {
      try {
        this.ytPlayer.loadVideoById(this.currentYtId);
        return;
      } catch(e) {}
    }

    this.ytPlayer = new window.YT.Player('freeze-yt-player-frame', {
      height: '100%',
      width: '100%',
      videoId: this.currentYtId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1
      },
      events: {
        onReady: () => {
          this.ytReady = true;
        },
        onStateChange: (event) => {
          if (event && window.YT && window.YT.PlayerState && event.data === window.YT.PlayerState.ENDED) {
            this.handleSongEnded();
          }
        }
      }
    });
  }

  handleSongEnded() {
    this.stopFreezeDance();
    if (this.soundEngine) {
      this.soundEngine.speak("Great job dancing! The song has finished!");
    }
    this.statusBadge.textContent = `🎉 SONG FINISHED! Great Job Dancing Everyone! 🏆`;
    this.statusBadge.classList.remove('frozen');
  }

  handleActionClick() {
    if (this.isPlaying) {
      this.stopFreezeDance();
    } else {
      this.startFreezeDance();
    }
  }

  startFreezeDance() {
    if (this.freezeTimer) {
      clearTimeout(this.freezeTimer);
      this.freezeTimer = null;
    }
    if (this.freezeCountdownInterval) {
      clearInterval(this.freezeCountdownInterval);
      this.freezeCountdownInterval = null;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.isFirstFreeze = true;
    this.freezeCount = 0;
    this.overlay.style.display = 'none';

    this.actionBtn.className = 'freeze-main-btn active';
    this.actionBtn.innerHTML = `<span class="btn-icon">🛑</span><span class="btn-label">STOP GAME</span>`;

    this.statusBadge.textContent = `🎵 MUSIC PLAYING! Dance & jump like crazy! (First Freeze in 20s) 💃🕺⚡`;
    this.statusBadge.classList.remove('frozen');

    if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      this.ytPlayer.playVideo();
    }

    this.scheduleFreeze();

    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onFreezeDanceAction(JSON.stringify({ action: 'start' })); } catch(e) {}
    }
  }

  scheduleFreeze() {
    if (!this.isPlaying) return;

    // Check if song has ended or is within 1s of end
    if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function' && typeof this.ytPlayer.getDuration === 'function') {
      const currentTime = this.ytPlayer.getCurrentTime();
      const duration = this.ytPlayer.getDuration();
      if (duration > 0 && currentTime >= duration - 1.5) {
        this.handleSongEnded();
        return;
      }
    }

    if (!this.isPaused) {
      // First freeze occurs 20s after song start; subsequent freezes occur every 10s!
      const playDuration = this.isFirstFreeze ? 20000 : 10000;
      this.freezeTimer = setTimeout(() => {
        if (!this.isPlaying) return;
        this.triggerFreeze();
      }, playDuration);
    }
  }

  triggerFreeze() {
    this.isPaused = true;
    this.freezeCount++;

    // Pause video (frozen frame stays 100% visible on screen so kids can check pose!)
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      this.ytPlayer.pauseVideo();
    }

    // Audio SFX & Voice (Only speak long prompt on first 2 freezes!)
    if (this.soundEngine) {
      this.soundEngine.playWhistle();
      if (this.freezeCount <= 2) {
        this.soundEngine.speak("Freeze! Are you in the same pose as on the screen?");
      } else {
        this.soundEngine.speak("Freeze!");
      }
    }

    // Freeze Duration Progression:
    // Freezes 1-3: 10 seconds
    // Freezes 4-7: 7 seconds
    // Freeze 8+: 5 seconds till song ends
    let freezeSeconds = 5;
    if (this.freezeCount <= 3) {
      freezeSeconds = 10;
    } else if (this.freezeCount <= 7) {
      freezeSeconds = 7;
    }

    // Keep video 100% unobstructed (no text card blocking video frame)
    if (this.overlay) this.overlay.style.display = 'none';
    this.statusBadge.classList.add('frozen');

    if (this.freezeCountdownInterval) {
      clearInterval(this.freezeCountdownInterval);
      this.freezeCountdownInterval = null;
    }

    // Live second-by-second countdown ticker badge!
    let remainingSeconds = freezeSeconds;
    this.statusBadge.textContent = `🧊 FREEZE! Countdown: ${remainingSeconds}s... ⏱️`;

    this.freezeCountdownInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds > 0) {
        this.statusBadge.textContent = `🧊 FREEZE! Countdown: ${remainingSeconds}s... ⏱️`;
      } else {
        clearInterval(this.freezeCountdownInterval);
        this.freezeCountdownInterval = null;
        if (this.isPlaying && this.isPaused) {
          this.resumeDance();
        }
      }
    }, 1000);

    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onFreezeDanceAction(JSON.stringify({ action: 'freeze' })); } catch(e) {}
    }
  }

  resumeDance() {
    if (this.freezeCountdownInterval) {
      clearInterval(this.freezeCountdownInterval);
      this.freezeCountdownInterval = null;
    }

    this.isPaused = false;
    this.isFirstFreeze = false;
    if (this.overlay) this.overlay.style.display = 'none';

    this.statusBadge.textContent = `🎵 MUSIC RESUMED! Next Freeze in 10s! 💃🕺⚡`;
    this.statusBadge.classList.remove('frozen');

    if (this.soundEngine) {
      this.soundEngine.speak("Dance!");
    }

    if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      this.ytPlayer.playVideo();
    }

    this.scheduleFreeze();

    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onFreezeDanceAction(JSON.stringify({ action: 'resume' })); } catch(e) {}
    }
  }

  stopFreezeDance() {
    if (this.freezeTimer) {
      clearTimeout(this.freezeTimer);
      this.freezeTimer = null;
    }
    if (this.freezeCountdownInterval) {
      clearInterval(this.freezeCountdownInterval);
      this.freezeCountdownInterval = null;
    }

    this.isPlaying = false;
    this.isPaused = false;

    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      this.ytPlayer.pauseVideo();
    }

    this.overlay.style.display = 'none';
    this.actionBtn.className = 'freeze-main-btn';
    this.actionBtn.innerHTML = `<span class="btn-icon">▶️</span><span class="btn-label">START FREEZE DANCE</span>`;

    this.statusBadge.textContent = `Ready to Dance! Load YouTube Track & Touch Start 🎵`;
    this.statusBadge.classList.remove('frozen');

    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onFreezeDanceAction(JSON.stringify({ action: 'stop' })); } catch(e) {}
    }
  }

  pause() {
    this.stopFreezeDance();
  }

  destroy() {
    this.pause();
  }
}
