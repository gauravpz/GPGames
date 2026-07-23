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
        }
      }
    });
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

    this.isPlaying = true;
    this.isPaused = false;
    this.overlay.style.display = 'none';

    this.actionBtn.className = 'freeze-main-btn active';
    this.actionBtn.innerHTML = `<span class="btn-icon">🛑</span><span class="btn-label">STOP GAME</span>`;

    this.statusBadge.textContent = `🎵 MUSIC PLAYING! Dance & jump like crazy! 💃🕺⚡`;
    this.statusBadge.classList.remove('frozen');

    if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      this.ytPlayer.playVideo();
    }

    this.scheduleRandomFreeze();

    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onFreezeDanceAction(JSON.stringify({ action: 'start' })); } catch(e) {}
    }
  }

  scheduleRandomFreeze() {
    if (!this.isPlaying) return;

    if (!this.isPaused) {
      // Dance phase: play for random 4s to 9s
      const playDuration = Math.floor(Math.random() * 5000 + 4000);
      this.freezeTimer = setTimeout(() => {
        if (!this.isPlaying) return;
        this.triggerFreeze();
      }, playDuration);
    }
  }

  triggerFreeze() {
    this.isPaused = true;

    // Pause video (frozen frame stays 100% visible on screen so kids can check pose!)
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      this.ytPlayer.pauseVideo();
    }

    // Audio SFX & Voice
    if (this.soundEngine) {
      this.soundEngine.playWhistle();
      this.soundEngine.speak("Freeze! Match the screen!");
    }

    // Keep video 100% unobstructed (no text card blocking video frame)
    if (this.overlay) this.overlay.style.display = 'none';
    this.statusBadge.textContent = `🧊 FREEZE! (5s-7s) Match your pose with the frozen screen! 🛑`;
    this.statusBadge.classList.add('frozen');

    // Freeze phase: stay paused for random 5s to 7s
    const freezeDuration = Math.floor(Math.random() * 2000 + 5000);
    this.freezeTimer = setTimeout(() => {
      if (!this.isPlaying) return;
      this.resumeDance();
    }, freezeDuration);

    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onFreezeDanceAction(JSON.stringify({ action: 'freeze' })); } catch(e) {}
    }
  }

  resumeDance() {
    this.isPaused = false;
    this.overlay.style.display = 'none';

    this.statusBadge.textContent = `🎵 MUSIC RESUMED! Dance & jump like crazy! 💃🕺⚡`;
    this.statusBadge.classList.remove('frozen');

    if (this.soundEngine) {
      this.soundEngine.speak("Dance!");
    }

    if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      this.ytPlayer.playVideo();
    }

    this.scheduleRandomFreeze();

    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onFreezeDanceAction(JSON.stringify({ action: 'resume' })); } catch(e) {}
    }
  }

  stopFreezeDance() {
    if (this.freezeTimer) {
      clearTimeout(this.freezeTimer);
      this.freezeTimer = null;
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
