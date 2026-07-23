// Musical Chairs & Freeze Dance Game Mode — 100% Reliable Party Audio Engine & YouTube Music Embed

export class MusicalChairsGame {
  constructor(containerElement, soundEngine, particleEngine) {
    this.container = containerElement;
    this.soundEngine = soundEngine;
    this.particles = particleEngine;

    this.options = ['Gaurav', 'Madhu', 'Papa', 'Mama', 'Anjali', 'Namith', 'Vashvi'];
    this.activePlayers = [];
    this.eliminatedPlayers = [];
    this.chairsCount = 0;
    this.isPlaying = false;
    this.isFrozen = false;
    this.winner = null;
    this.musicTimer = null;
    this.danceAngle = 0;
    this.animFrameId = null;

    this.musicSource = 'youtube'; // Default: YouTube Song Link
    this.currentYtId = 'k4yXQkG2s1E'; // Default Party Track
    this.ytPlayer = null;
    this.ytReady = false;

    this.initDOM();
    this.initCanvas();
    this.bindEvents();
    this.loadYouTubeVideo();
    this.resetGame();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="musical-chairs-wrapper card">
        <div class="chairs-header">
          <div class="chairs-title-group">
            <span class="game-badge">🎵 PARTY GAME</span>
            <h2>Musical Chairs & Freeze Dance</h2>
          </div>
          <div class="chairs-status-badge" id="chairs-status-badge">
            Ready to Play! Touch Start Music 🎵
          </div>
        </div>

        <!-- Music Source Selector Bar -->
        <div class="music-source-bar">
          <div class="music-source-toggles">
            <span class="source-label">🎵 Music Source:</span>
            <button id="src-synth-btn" class="music-source-btn">🎹 Built-in Synth BGM</button>
            <button id="src-yt-btn" class="music-source-btn active">▶️ YouTube Song Link</button>
          </div>

          <div class="yt-input-container" id="yt-input-container" style="display: flex;">
            <input type="text" id="chairs-yt-input" placeholder="Paste YouTube link..." value="https://youtu.be/k4yXQkG2s1E?si=u70ArNQ7LcE9aSY0" />
            <button id="chairs-load-yt-btn" class="btn-secondary">🎵 Load Song</button>
            <select id="chairs-yt-preset" class="theme-select-input">
              <option value="">✨ Quick Presets</option>
              <option value="k4yXQkG2s1E">🔥 Default Party Beat Track</option>
              <option value="L0MK7qz13bU">👑 Frozen — Let It Go</option>
              <option value="XqZsoesa55w">🦈 Baby Shark Party Beat</option>
              <option value="KQ6zr6kCPj8">💃 Party Rock Anthem</option>
              <option value="astISOttWH0">🕺 Gummy Bear Song</option>
            </select>
          </div>
        </div>

        <!-- 2D Interactive Stage -->
        <div class="chairs-stage-container" id="chairs-stage">
          <canvas id="chairs-game-canvas"></canvas>

          <!-- Floating YouTube Video Window -->
          <div id="yt-player-wrapper" class="youtube-chairs-player" style="display: block;">
            <div id="yt-player-frame"></div>
          </div>

          <!-- Big Control Button -->
          <button id="chairs-action-btn" class="chairs-main-btn">
            <span class="btn-icon">▶️</span>
            <span class="btn-label">START MUSIC</span>
          </button>
        </div>

        <!-- Players & Elimination Panel -->
        <div class="chairs-bottom-panel">
          <div class="chairs-input-box">
            <input type="text" id="chairs-names-input" placeholder="Enter players separated by spaces..." value="${this.options.join(' ')}" />
            <button id="chairs-save-btn" class="btn-secondary">💾 Save Players</button>
            <button id="chairs-reset-btn" class="btn-secondary">♻️ Reset Game</button>
          </div>
          <div class="players-live-chips" id="players-live-chips"></div>
        </div>
      </div>
    `;

    this.inputField = this.container.querySelector('#chairs-names-input');
    this.saveBtn = this.container.querySelector('#chairs-save-btn');
    this.resetBtn = this.container.querySelector('#chairs-reset-btn');
    this.actionBtn = this.container.querySelector('#chairs-action-btn');
    this.statusBadge = this.container.querySelector('#chairs-status-badge');
    this.chipsContainer = this.container.querySelector('#players-live-chips');
    this.stage = this.container.querySelector('#chairs-stage');
    this.canvas = this.container.querySelector('#chairs-game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.srcSynthBtn = this.container.querySelector('#src-synth-btn');
    this.srcYtBtn = this.container.querySelector('#src-yt-btn');
    this.ytInputContainer = this.container.querySelector('#yt-input-container');
    this.ytInput = this.container.querySelector('#chairs-yt-input');
    this.loadYtBtn = this.container.querySelector('#chairs-load-yt-btn');
    this.ytPresetSelect = this.container.querySelector('#chairs-yt-preset');
    this.ytPlayerWrapper = this.container.querySelector('#yt-player-wrapper');
  }

  initCanvas() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.stage || !this.canvas) return;
    const rect = this.stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || 600;
    const height = Math.max(340, rect.height || 420);

    this.width = width;
    this.height = height;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.scale(dpr, dpr);
    this.draw();
  }

  bindEvents() {
    this.saveBtn.addEventListener('click', () => this.parseAndSaveNames());
    this.resetBtn.addEventListener('click', () => this.resetGame());
    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.parseAndSaveNames();
    });

    // Music Source Switcher
    this.srcSynthBtn.addEventListener('click', () => {
      this.musicSource = 'synth';
      this.srcSynthBtn.classList.add('active');
      this.srcYtBtn.classList.remove('active');
      this.ytInputContainer.style.display = 'none';
      this.ytPlayerWrapper.style.display = 'none';
      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
        this.ytPlayer.pauseVideo();
      }
    });

    this.srcYtBtn.addEventListener('click', () => {
      this.musicSource = 'youtube';
      this.srcYtBtn.classList.add('active');
      this.srcSynthBtn.classList.remove('active');
      this.ytInputContainer.style.display = 'flex';
      this.ytPlayerWrapper.style.display = 'block';
      this.loadYouTubeVideo();
    });

    this.loadYtBtn.addEventListener('click', () => this.loadYouTubeVideo());
    this.ytInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.loadYouTubeVideo();
    });

    this.ytPresetSelect.addEventListener('change', () => {
      const val = this.ytPresetSelect.value;
      if (val) {
        this.ytInput.value = `https://www.youtube.com/watch?v=${val}`;
        this.loadYouTubeVideo();
      }
    });

    let handled = false;
    this.actionBtn.addEventListener('pointerdown', () => {
      handled = true;
      this.handleActionClick();
    });
    this.actionBtn.addEventListener('click', () => {
      if (handled) { handled = false; return; }
      this.handleActionClick();
    });
  }

  extractYouTubeId(urlOrId) {
    if (!urlOrId) return null;
    const trimmed = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  loadYouTubeVideo() {
    const raw = this.ytInput.value;
    const ytId = this.extractYouTubeId(raw);
    if (!ytId) {
      alert('Please enter a valid YouTube video URL or ID (e.g., https://www.youtube.com/watch?v=L0MK7qz13bU)');
      return;
    }
    this.currentYtId = ytId;
    this.initYouTubePlayer(ytId);
  }

  initYouTubePlayer(videoId) {
    if (!videoId) return;
    this.ytPlayerWrapper.style.display = 'block';

    if (window.YT && window.YT.Player) {
      if (this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
        this.ytPlayer.loadVideoById(videoId);
      } else {
        this.ytPlayer = new window.YT.Player('yt-player-frame', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0
          },
          events: {
            onReady: () => {
              this.ytReady = true;
            }
          }
        });
      }
    } else {
      window.onYouTubeIframeAPIReady = () => {
        this.initYouTubePlayer(videoId);
      };
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }
  }

  parseAndSaveNames() {
    const raw = this.inputField.value.trim();
    if (!raw) return;
    const tokens = raw.split(/[\s,\/\|;]+/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length > 0) {
      this.options = tokens;
      this.inputField.value = this.options.join(' ');
      this.resetGame();
      // Sync players to TV if casting
      if (window.MobileBridge) {
        try { window.MobileBridge.onChairsConfigUpdate(JSON.stringify({ options: this.options })); } catch(e) {}
      }
    }
  }

  /** Set options from TV remote sync — updates players without triggering bridge back */
  setOptions(options) {
    if (!Array.isArray(options) || options.length === 0) return;
    this.options = options.map(opt => typeof opt === 'string' ? opt : (opt.text || String(opt)));
    if (this.inputField) this.inputField.value = this.options.join(' ');
    this._skipBridge = true;
    this.resetGame();
    this._skipBridge = false;
  }

  resetGame() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
    this.stopMusic();

    if (this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
      try {
        this.ytPlayer.seekTo(0);
        this.ytPlayer.pauseVideo();
      } catch(e){}
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.activePlayers = [...this.options];
    this.eliminatedPlayers = [];
    this.chairsCount = Math.max(1, this.activePlayers.length - 1);
    this.isPlaying = false;
    this.isFrozen = false;
    this.winner = null;

    this.initPlayersState();

    this.actionBtn.className = 'chairs-main-btn';
    this.actionBtn.innerHTML = `<span class="btn-icon">▶️</span><span class="btn-label">START MUSIC</span>`;
    this.actionBtn.disabled = false;
    this.statusBadge.textContent = `Round 1 Ready: ${this.activePlayers.length} Players, ${this.chairsCount} Chairs 🪑`;
    this.statusBadge.classList.remove('frozen', 'winner');

    this.renderChips();
    this.draw();

    // Notify TV if casting (skip if triggered remotely to prevent echo loop)
    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onChairsAction(JSON.stringify({ action: 'reset' })); } catch(e) {}
    }
  }

  initPlayersState() {
    const total = this.activePlayers.length;
    this.playersState = this.activePlayers.map((name, idx) => ({
      name,
      idx,
      angle: (idx / total) * Math.PI * 2,
      baseSpeed: 0.010 + (idx % 3) * 0.005,
      speed: 0.010 + (idx % 3) * 0.005,
      pose: 'walking', // 'walking', 'seated', 'stomping'
      stompPhase: 0,
      speechText: ''
    }));
  }

  handleActionClick() {
    if (this.winner) {
      this.resetGame();
      return;
    }

    if (this.isPlaying) {
      // Toggle button while playing: Manual Stop / Freeze!
      this.stopMusicAndFreeze();
    } else {
      // Start music!
      this.startMusicRound();
    }
  }

  playMusic() {
    if (this.musicSource === 'youtube') {
      if (this.soundEngine) this.soundEngine.stopBgm();
      if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
        this.ytPlayer.playVideo();
      }
    } else {
      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
        this.ytPlayer.pauseVideo();
      }
      if (this.soundEngine) {
        this.soundEngine.toggleBgm(true);
      }
    }
  }

  stopMusic() {
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      this.ytPlayer.pauseVideo();
    }
    if (this.soundEngine) {
      this.soundEngine.stopBgm();
    }
  }

  startMusicRound() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
    if (this.intervalTimer) {
      clearTimeout(this.intervalTimer);
      this.intervalTimer = null;
    }

    this.isPlaying = true;
    this.isFrozen = false;
    this.isIntervalPaused = false;
    this.roundStartTime = Date.now();
    this.totalRoundDuration = Math.floor(Math.random() * 12000 + 16000); // 16s - 28s round length

    this.actionBtn.disabled = false;
    this.actionBtn.className = 'chairs-main-btn freeze';
    this.actionBtn.innerHTML = `<span class="btn-icon">🛑</span><span class="btn-label">STOP MUSIC (FREEZE)</span>`;
    this.statusBadge.textContent = `🎵 Party Music Playing! Dance & race around the chairs! 🏃💨`;
    this.statusBadge.classList.remove('frozen');

    if (this.playersState) {
      this.playersState.forEach((p) => {
        p.pose = 'walking';
        p.speechText = '';
        p.stompPhase = 0;
      });
    }

    this.playMusic();

    if (!this._skipBridge) {
      this.scheduleRandomInterval();
    }

    this.animate();

    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onChairsAction(JSON.stringify({ action: 'start' })); } catch(e) {}
    }
  }

  scheduleRandomInterval() {
    if (!this.isPlaying) return;

    const elapsedTime = Date.now() - this.roundStartTime;
    if (elapsedTime >= this.totalRoundDuration) {
      this.stopMusicAndFreeze();
      return;
    }

    if (!this.isIntervalPaused) {
      // Music playing phase: play for random 3.5s - 7s
      const playDuration = Math.floor(Math.random() * 3500 + 3500);
      this.intervalTimer = setTimeout(() => {
        if (!this.isPlaying) return;
        this.isIntervalPaused = true;
        this.stopMusic();
        if (this.soundEngine) this.soundEngine.playWhistle();
        this.statusBadge.textContent = "🛑 PAUSE! Music stopped! Freeze in place! 🧊";
        this.statusBadge.classList.add('frozen');

        // Pause phase: freeze for random 2.5s - 4.5s
        const pauseDuration = Math.floor(Math.random() * 2000 + 2500);
        this.intervalTimer = setTimeout(() => {
          if (!this.isPlaying) return;
          this.isIntervalPaused = false;
          this.playMusic();
          this.statusBadge.textContent = "🎵 Music Resumed! Dance & walk around chairs! 🏃💨";
          this.statusBadge.classList.remove('frozen');
          this.scheduleRandomInterval();
        }, pauseDuration);
      }, playDuration);
    }
  }

  stopMusicAndFreeze() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.intervalTimer) {
      clearTimeout(this.intervalTimer);
      this.intervalTimer = null;
    }

    this.isPlaying = false;
    this.isFrozen = true;
    this.isIntervalPaused = false;
    this.stopMusic();

    if (this.soundEngine) {
      this.soundEngine.playWhistle();
    }

    this.statusBadge.textContent = `🛑 STOP! FREEZE & FIGHT FOR A CHAIR! 🪑💥`;
    this.statusBadge.classList.add('frozen');

    const randBuf = new Uint32Array(1);
    window.crypto.getRandomValues(randBuf);
    const outIdx = randBuf[0] % this.activePlayers.length;
    this.standingPlayerIndex = outIdx;
    const outPlayer = this.activePlayers[outIdx];

    // Trigger dramatic chair fight & sitting physics
    this.triggerChairBattle(outIdx);

    if (this.soundEngine) {
      this.soundEngine.speak(`Freeze! ${outPlayer} was left standing!`);
      this.soundEngine.playBoing();
      setTimeout(() => this.soundEngine.playSlideWhistle(), 500);
    }

    this.actionBtn.disabled = false;
    this.actionBtn.className = 'chairs-main-btn';
    this.actionBtn.innerHTML = `<span class="btn-icon">▶️</span><span class="btn-label">START MUSIC</span>`;

    this.draw();

    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onChairsAction(JSON.stringify({ action: 'freeze', standingPlayerIndex: outIdx })); } catch(e) {}
    }

    // Auto-eliminate standing player after 2.8s stomp animation!
    setTimeout(() => {
      if (this.isFrozen) {
        this.nextRound();
      }
    }, 2800);
  }

  triggerChairBattle(standingIndex) {
    let chairIdx = 0;
    if (this.playersState) {
      this.playersState.forEach((p, idx) => {
        if (idx === standingIndex) {
          p.pose = 'stomping';
          p.stompPhase = 0;
          p.speechText = "No fair! That was my chair! 😱🦶💥";
        } else {
          p.pose = 'seated';
          p.speechText = "Got my seat! 😊🪑";
          chairIdx++;
        }
      });
    }
  }

  stopMusicAndFreezeRemote(presetStandingIndex) {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.isPlaying = false;
    this.isFrozen = true;
    this.stopMusic();

    if (this.soundEngine) {
      this.soundEngine.playWhistle();
    }

    this.statusBadge.textContent = `🛑 STOP! FREEZE & FIGHT FOR A CHAIR! 🪑💥`;
    this.statusBadge.classList.add('frozen');

    const outIdx = (typeof presetStandingIndex === 'number' && presetStandingIndex >= 0 && presetStandingIndex < this.activePlayers.length)
      ? presetStandingIndex
      : 0;
    this.standingPlayerIndex = outIdx;
    const outPlayer = this.activePlayers[outIdx];

    this.triggerChairBattle(outIdx);

    this.actionBtn.disabled = false;
    this.actionBtn.className = 'chairs-main-btn';
    this.actionBtn.innerHTML = `<span class="btn-icon">▶️</span><span class="btn-label">START MUSIC</span>`;

    this.draw();

    setTimeout(() => {
      if (this.isFrozen) {
        this.nextRound();
      }
    }, 2800);
  }

  nextRound() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }

    if (this.standingPlayerIndex !== undefined && this.standingPlayerIndex >= 0) {
      const eliminated = this.activePlayers.splice(this.standingPlayerIndex, 1)[0];
      this.eliminatedPlayers.push(eliminated);
      this.standingPlayerIndex = -1;
    }

    const remainingCount = this.activePlayers.length;

    if (remainingCount === 1) {
      this.winner = this.activePlayers[0];
      this.statusBadge.textContent = `👑 " ${this.winner} " IS THE MUSICAL CHAIRS CHAMPION! 🎉`;
      this.statusBadge.classList.add('winner');

      if (this.soundEngine) {
        this.soundEngine.playVictory();
        this.soundEngine.speak(`${this.winner} is the Musical Chairs Champion!`);
      }
      if (this.particles) this.particles.burst();

      this.actionBtn.className = 'chairs-main-btn winner';
      this.actionBtn.innerHTML = `<span class="btn-icon">👑</span><span class="btn-label">PLAY AGAIN</span>`;
      this.initPlayersState();
      this.renderChips();
      this.draw();
      return;
    }

    this.chairsCount = Math.max(1, remainingCount - 1);
    this.isFrozen = false;
    this.actionBtn.className = 'chairs-main-btn';
    this.actionBtn.innerHTML = `<span class="btn-icon">▶️</span><span class="btn-label">START MUSIC (OR WAIT 10s)</span>`;
    this.statusBadge.classList.remove('frozen');

    this.initPlayersState();
    this.renderChips();
    this.draw();

    // Declare remaining players out loud!
    if (this.soundEngine) {
      this.soundEngine.speak(`${remainingCount} players remaining! Next round starting in 10 seconds!`);
    }

    // Auto-start next round 10s countdown!
    let secondsLeft = 10;
    this.statusBadge.textContent = `Remaining: ${remainingCount} Players (${this.chairsCount} Chairs) | Next round in ${secondsLeft}s... ⏱️`;

    this.autoTimer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        this.statusBadge.textContent = `Remaining: ${remainingCount} Players (${this.chairsCount} Chairs) | Next round in ${secondsLeft}s... ⏱️`;
      } else {
        clearInterval(this.autoTimer);
        this.autoTimer = null;
        if (!this.isPlaying && !this.winner) {
          this.startMusicRound();
        }
      }
    }, 1000);

    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onChairsAction(JSON.stringify({ action: 'next' })); } catch(e) {}
    }
  }

  animate() {
    if (this.isPlaying) {
      this.danceAngle += 0.02;

      if (this.playersState) {
        this.playersState.forEach((p, idx) => {
          p.speed = p.baseSpeed + Math.sin(Date.now() * 0.002 + idx * 2) * 0.004;
          p.angle += p.speed;
        });
      }

      this.draw();
      this.animFrameId = requestAnimationFrame(() => this.animate());
    } else if (this.isFrozen) {
      if (this.playersState) {
        this.playersState.forEach(p => {
          if (p.pose === 'stomping') {
            p.stompPhase += 0.12;
          }
        });
      }
      this.draw();
      this.animFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  renderChips() {
    if (!this.chipsContainer) return;
    let html = '';
    this.activePlayers.forEach((p, idx) => {
      const isStanding = this.isFrozen && idx === this.standingPlayerIndex;
      html += `<span class="player-chip ${isStanding ? 'standing' : 'active'}">${isStanding ? '⚠️ ' : '👤 '}${p}</span>`;
    });
    this.eliminatedPlayers.forEach(p => {
      html += `<span class="player-chip eliminated">❌ ${p}</span>`;
    });
    this.chipsContainer.innerHTML = html;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const ringRadius = Math.min(this.width * 0.38, this.height * 0.38);

    // Draw Ring Path
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 1. Draw Chairs
    const totalChairs = this.winner ? 1 : this.chairsCount;
    for (let i = 0; i < totalChairs; i++) {
      const angle = (i / totalChairs) * Math.PI * 2 - Math.PI / 2;
      const cx = centerX + Math.cos(angle) * (ringRadius - 40);
      const cy = centerY + Math.sin(angle) * (ringRadius - 40);

      this.drawChair(cx, cy, i);
    }

    // 2. Draw Active Players (walking, seated, or stomping)
    const totalPlayers = this.activePlayers.length;
    this.activePlayers.forEach((name, idx) => {
      const pState = (this.playersState && this.playersState[idx]) ? this.playersState[idx] : null;
      let px, py, isStanding;

      if (this.isPlaying && pState) {
        px = centerX + Math.cos(pState.angle) * ringRadius;
        py = centerY + Math.sin(pState.angle) * ringRadius;
        isStanding = false;
      } else if (this.isFrozen) {
        isStanding = idx === this.standingPlayerIndex;
        if (isStanding) {
          const chairAngle = -Math.PI / 2;
          const stompOffset = pState ? Math.sin(pState.stompPhase * 5) * 8 : 0;
          px = centerX + Math.cos(chairAngle) * (ringRadius - 10) + stompOffset;
          py = centerY + Math.sin(chairAngle) * (ringRadius - 10) - Math.abs(stompOffset);
        } else {
          const chairIdx = idx > this.standingPlayerIndex ? idx - 1 : idx;
          const chairAngle = (chairIdx / totalChairs) * Math.PI * 2 - Math.PI / 2;
          px = centerX + Math.cos(chairAngle) * (ringRadius - 40);
          py = centerY + Math.sin(chairAngle) * (ringRadius - 40) - 10;
        }
      } else {
        const angle = (idx / totalPlayers) * Math.PI * 2 - Math.PI / 2;
        px = centerX + Math.cos(angle) * ringRadius;
        py = centerY + Math.sin(angle) * ringRadius;
        isStanding = false;
      }

      this.drawPlayerAvatar(px, py, name, idx, isStanding, pState, centerX, centerY);
    });

    if (this.winner) {
      ctx.save();
      ctx.fillStyle = '#FFE600';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FF2E93';
      ctx.shadowBlur = 25;
      ctx.fillText(`👑 ${this.winner}`, centerX, centerY - 15);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('CHAMPION!', centerX, centerY + 25);
      ctx.restore();
    }
  }

  drawChair(x, y, index) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 15;

    // Chair Seat Cushion
    ctx.fillStyle = '#7000FF';
    ctx.beginPath();
    ctx.roundRect(-22, -12, 44, 30, 8);
    ctx.fill();

    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Chair Backrest
    ctx.fillStyle = '#FF2E93';
    ctx.beginPath();
    ctx.roundRect(-18, -28, 36, 16, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('🪑', 0, 8);

    ctx.restore();
  }

  drawPlayerAvatar(x, y, name, index, isStanding, pState, centerX, centerY) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    const ANIMAL_AVATARS = [
      { emoji: '🦁', color: '#FF8A00' },
      { emoji: '🐼', color: '#00F0FF' },
      { emoji: '🦊', color: '#FF2E93' },
      { emoji: '🐯', color: '#FFE600' },
      { emoji: '🐸', color: '#00FF66' },
      { emoji: '🐰', color: '#7000FF' },
      { emoji: '🦄', color: '#FF00A8' },
      { emoji: '🐵', color: '#FF6B00' },
      { emoji: '🐶', color: '#00D2FF' },
      { emoji: '🐱', color: '#FF3366' },
      { emoji: '🐻', color: '#8B4513' },
      { emoji: '🐘', color: '#94A3B8' }
    ];

    const animal = ANIMAL_AVATARS[index % ANIMAL_AVATARS.length];
    const color = animal.color;

    if (isStanding) {
      // Stomping Animal Animation
      ctx.shadowColor = '#FF0055';
      ctx.shadowBlur = 35;

      ctx.strokeStyle = 'rgba(255, 0, 85, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 15, 28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#FF0055';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '22px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(animal.emoji, 0, 0);

      // Speech bubble
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#FF0055';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-75, -58, 150, 26, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText("No fair! That was my chair! 😱", 0, -45);
      ctx.restore();
    } else if (pState && pState.pose === 'seated') {
      // Seated Animal Pose on Chair Cushion!
      ctx.shadowColor = '#00FF66';
      ctx.shadowBlur = 22;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -6, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(animal.emoji, 0, -6);
    } else {
      // Walking Animal Pose
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(animal.emoji, 0, 0);
    }

    // Radial offset outward away from circle center so name tag never overlaps chairs or avatars!
    const dx = x - centerX;
    const dy = y - centerY;
    const radAngle = Math.atan2(dy, dx);
    const textDist = 42;
    const labelX = Math.cos(radAngle) * textDist;
    const labelY = Math.sin(radAngle) * textDist;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, labelX, labelY);

    ctx.restore();
  }

  pause() {
    this.isPlaying = false;
    if (this.musicTimer) clearTimeout(this.musicTimer);
    this.stopMusic();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  destroy() {
    this.pause();
  }
}
