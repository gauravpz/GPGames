// Musical Chairs & Freeze Dance Game Mode — 100% Reliable Party Audio Engine

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

    this.initDOM();
    this.initCanvas();
    this.bindEvents();
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

        <!-- 2D Interactive Stage -->
        <div class="chairs-stage-container" id="chairs-stage">
          <canvas id="chairs-game-canvas"></canvas>

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
    this.options = options.map(String);
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
    this.stopMusic();

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

    this.actionBtn.className = 'chairs-main-btn';
    this.actionBtn.innerHTML = `<span class="btn-icon">▶️</span><span class="btn-label">START MUSIC</span>`;
    this.actionBtn.disabled = false;
    this.statusBadge.textContent = `Round 1: ${this.activePlayers.length} Players, ${this.chairsCount} Chairs 🪑`;
    this.statusBadge.classList.remove('frozen', 'winner');

    this.renderChips();
    this.draw();

    // Notify TV if casting (skip if triggered remotely to prevent echo loop)
    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onChairsAction(JSON.stringify({ action: 'reset' })); } catch(e) {}
    }
  }

  handleActionClick() {
    if (this.winner) {
      this.resetGame();
      return;
    }

    if (this.isFrozen) {
      this.nextRound();
      return;
    }

    if (!this.isPlaying) {
      this.startMusicRound();
    }
  }

  playMusic() {
    if (this.soundEngine) {
      this.soundEngine.toggleBgm(true);
    }
  }

  stopMusic() {
    if (this.soundEngine) {
      this.soundEngine.stopBgm();
    }
  }

  startMusicRound() {
    this.isPlaying = true;
    this.isFrozen = false;
    this.actionBtn.disabled = true;
    this.statusBadge.textContent = `🎵 Party Music Playing! Dance around the chairs! 💃🕺`;
    this.statusBadge.classList.remove('frozen');

    this.playMusic();

    // Random music duration between 7s and 18s before freeze!
    // Skip timer when triggered remotely — the phone controls timing and sends freeze.
    if (!this._skipBridge) {
      const duration = Math.floor(Math.random() * 11000 + 7000);
      this.musicTimer = setTimeout(() => {
        this.stopMusicAndFreeze();
      }, duration);
    }

    this.animate();

    // Notify TV if casting (skip if triggered remotely to prevent echo loop)
    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onChairsAction(JSON.stringify({ action: 'start' })); } catch(e) {}
    }
  }

  stopMusicAndFreeze() {
    this.isPlaying = false;
    this.isFrozen = true;

    this.stopMusic();

    if (this.soundEngine) {
      this.soundEngine.playWhistle();
    }

    this.statusBadge.textContent = `🛑 STOP! FREEZE & FIND A CHAIR! 🪑`;
    this.statusBadge.classList.add('frozen');

    const randBuf = new Uint32Array(1);
    window.crypto.getRandomValues(randBuf);
    const outIdx = randBuf[0] % this.activePlayers.length;
    this.standingPlayerIndex = outIdx;
    const outPlayer = this.activePlayers[outIdx];

    if (this.soundEngine) {
      this.soundEngine.speak(`Freeze! ${outPlayer} was left standing!`);
    }

    this.actionBtn.disabled = false;
    this.actionBtn.className = 'chairs-main-btn freeze';
    this.actionBtn.innerHTML = `<span class="btn-icon">❌</span><span class="btn-label">ELIMINATE "${outPlayer}"</span>`;

    this.draw();

    // Notify TV of the freeze and who's standing (skip if triggered remotely)
    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onChairsAction(JSON.stringify({ action: 'freeze', standingPlayerIndex: outIdx })); } catch(e) {}
    }
  }

  /**
   * Freeze variant for TV-side remote triggering — uses a preset standingPlayerIndex
   * so both phone and TV land on exactly the same eliminated player.
   */
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

    this.statusBadge.textContent = `🛑 STOP! FREEZE & FIND A CHAIR! 🪑`;
    this.statusBadge.classList.add('frozen');

    const outIdx = (typeof presetStandingIndex === 'number' && presetStandingIndex >= 0 && presetStandingIndex < this.activePlayers.length)
      ? presetStandingIndex
      : 0;
    this.standingPlayerIndex = outIdx;
    const outPlayer = this.activePlayers[outIdx];

    this.actionBtn.disabled = false;
    this.actionBtn.className = 'chairs-main-btn freeze';
    this.actionBtn.innerHTML = `<span class="btn-icon">❌</span><span class="btn-label">ELIMINATE "${outPlayer}"</span>`;

    this.draw();
  }

  nextRound() {
    if (this.standingPlayerIndex !== undefined && this.standingPlayerIndex >= 0) {
      const eliminated = this.activePlayers.splice(this.standingPlayerIndex, 1)[0];
      this.eliminatedPlayers.push(eliminated);
      this.standingPlayerIndex = -1;
    }

    if (this.activePlayers.length === 1) {
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
      this.renderChips();
      this.draw();
      return;
    }

    this.chairsCount = Math.max(1, this.activePlayers.length - 1);
    this.isFrozen = false;
    this.actionBtn.className = 'chairs-main-btn';
    this.actionBtn.innerHTML = `<span class="btn-icon">▶️</span><span class="btn-label">START MUSIC</span>`;
    this.statusBadge.textContent = `Round Ready: ${this.activePlayers.length} Players, ${this.chairsCount} Chairs 🪑`;
    this.statusBadge.classList.remove('frozen');

    this.renderChips();
    this.draw();

    // Notify TV if casting (skip if triggered remotely to prevent echo loop)
    if (window.MobileBridge && !this._skipBridge) {
      try { window.MobileBridge.onChairsAction(JSON.stringify({ action: 'next' })); } catch(e) {}
    }
  }

  animate() {
    if (this.isPlaying) {
      this.danceAngle += 0.04;
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
    const ringRadius = Math.min(this.width, this.height) * 0.32;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const totalChairs = this.winner ? 1 : this.chairsCount;
    for (let i = 0; i < totalChairs; i++) {
      const angle = (i / totalChairs) * Math.PI * 2 - Math.PI / 2;
      const cx = centerX + Math.cos(angle) * (ringRadius - 30);
      const cy = centerY + Math.sin(angle) * (ringRadius - 30);

      this.drawChair(cx, cy, i);
    }

    const totalPlayers = this.activePlayers.length;
    this.activePlayers.forEach((name, idx) => {
      let angle;
      if (this.isPlaying) {
        angle = (idx / totalPlayers) * Math.PI * 2 + this.danceAngle;
      } else {
        angle = (idx / totalPlayers) * Math.PI * 2 - Math.PI / 2;
      }

      const px = centerX + Math.cos(angle) * ringRadius;
      const py = centerY + Math.sin(angle) * ringRadius;

      const isStanding = this.isFrozen && idx === this.standingPlayerIndex;
      this.drawPlayerAvatar(px, py, name, idx, isStanding);
    });

    if (this.winner) {
      ctx.save();
      ctx.fillStyle = '#FFE600';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FF2E93';
      ctx.shadowBlur = 20;
      ctx.fillText(`👑 ${this.winner}`, centerX, centerY - 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('CHAMPION!', centerX, centerY + 20);
      ctx.restore();
    }
  }

  drawChair(x, y, index) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 12;

    ctx.fillStyle = '#7000FF';
    ctx.beginPath();
    ctx.roundRect(-16, -8, 32, 22, 6);
    ctx.fill();

    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FF2E93';
    ctx.beginPath();
    ctx.roundRect(-14, -20, 28, 12, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('🪑', 0, 6);

    ctx.restore();
  }

  drawPlayerAvatar(x, y, name, index, isStanding) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    const colors = ['#FF2E93', '#00F0FF', '#00FF66', '#FFE600', '#FF8A00', '#7000FF', '#00D2FF'];
    const color = colors[index % colors.length];

    if (isStanding) {
      ctx.shadowColor = '#FF0055';
      ctx.shadowBlur = 25;

      ctx.fillStyle = '#FF0055';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isStanding ? '🏃' : '💃', 0, 0);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(name, 0, 28);

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
