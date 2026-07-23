// Sky Bird Paper Picker — Flying Papers, Bird Stunts & Gravity Drop

export class PaperGame {
  constructor(containerElement, soundEngine, particleEngine) {
    this.container = containerElement;
    this.soundEngine = soundEngine;
    this.particles = particleEngine;

    this.options = ['Gaurav', 'Madhu', 'Papa', 'Mama', 'Anjali', 'Namith', 'Vashvi'];
    this.paperSlips = [];
    this.isFlying = false;
    this.isBirdActive = false;
    this.chosenIndex = -1;
    this.animFrameId = null;
    this.windActive = false;
    this.lastPickedName = null;
    this.autoRemoveEnabled = false;

    this.initDOM();
    this.initCanvas();
    this.bindEvents();
    this.resetStack();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="paper-game-wrapper card">
        <div class="paper-game-header">
          <div class="paper-title-group">
            <span class="game-badge">🕊️ SKY BIRD PICKER</span>
            <h2>Flying Papers & Carrier Bird</h2>
          </div>
          <!-- Result Badge & Action Row in Header -->
          <div class="paper-header-result-row">
            <div id="paper-winner-badge" class="paper-winner-badge-header">
              Ready! Touch Start Fan to blow papers 🌀
            </div>
            <button id="paper-remove-picked-badge-btn" class="btn-secondary danger-badge" style="display:none;">
              🗑️ Remove Winner
            </button>
          </div>
        </div>

        <!-- Animation Stage 100% Clear Sky -->
        <div class="paper-stage-container" id="paper-stage">
          <canvas id="paper-game-canvas"></canvas>
        </div>

        <!-- Control Panel at Bottom (Outside Canvas Stage) -->
        <div class="paper-input-box">
          <input type="text" id="paper-names-input" placeholder="Type names separated by spaces (e.g. Gaurav Madhu Papa Mama)..." value="${this.options.join(' ')}" />
          <button id="paper-save-btn" class="btn-secondary">💾 Save</button>
          <button id="paper-remove-picked-btn" class="btn-secondary danger" style="display:none;">🗑️ Remove Picked</button>
          <button id="paper-auto-remove-btn" class="btn-secondary toggle-btn">🔄 Auto-Remove: OFF</button>
          
          <!-- Interactive Fan Button -->
          <button id="fan-trigger-btn" class="fan-btn-inline" title="Touch Fan to blow papers!">
            <span class="fan-icon">🌀</span>
            <span class="fan-label">START FAN</span>
          </button>
        </div>

        <!-- Live Option Chips with ✕ delete -->
        <div class="paper-name-chips" id="paper-name-chips"></div>
      </div>
    `;

    this.inputField = this.container.querySelector('#paper-names-input');
    this.saveBtn = this.container.querySelector('#paper-save-btn');
    this.fanBtn = this.container.querySelector('#fan-trigger-btn');
    this.winnerBadge = this.container.querySelector('#paper-winner-badge');
    this.removePickedHeaderBtn = this.container.querySelector('#paper-remove-picked-badge-btn');
    this.removePickedBtn = this.container.querySelector('#paper-remove-picked-btn');
    this.autoRemoveBtn = this.container.querySelector('#paper-auto-remove-btn');
    this.chipsContainer = this.container.querySelector('#paper-name-chips');
    this.stage = this.container.querySelector('#paper-stage');
    this.canvas = this.container.querySelector('#paper-game-canvas');
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
    const height = Math.max(380, rect.height || 450);

    this.width = width;
    this.height = height;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.scale(dpr, dpr);
    if (!this.isFlying) {
      this.draw();
    }
  }

  bindEvents() {
    this.saveBtn.addEventListener('click', () => this.parseAndSaveNames());
    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.parseAndSaveNames();
    });

    if (this.removePickedHeaderBtn) {
      this.removePickedHeaderBtn.addEventListener('click', () => this.removePickedPaper());
    }
    if (this.removePickedBtn) {
      this.removePickedBtn.addEventListener('click', () => this.removePickedPaper());
    }
    if (this.autoRemoveBtn) {
      this.autoRemoveBtn.addEventListener('click', () => this.toggleAutoRemove());
    }

    const triggerFan = () => {
      if (this.isFlying) return;
      this.startFlyingPapers();
    };

    let handled = false;
    this.fanBtn.addEventListener('pointerdown', (e) => {
      handled = true;
      triggerFan();
    });
    this.fanBtn.addEventListener('click', (e) => {
      if (handled) { handled = false; return; }
      triggerFan();
    });
  }

  parseAndSaveNames() {
    const raw = this.inputField.value.trim();
    if (!raw) return;

    const tokens = raw.split(/[\s,\/\|;]+/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length > 0) {
      this.options = tokens;
      this.inputField.value = this.options.join(' ');
      this.winnerBadge.textContent = `Saved ${this.options.length} names! Touch Fan to blow 🌀`;
      this.resetStack();
      // Sync options to TV if casting
      if (window.MobileBridge) {
        try { window.MobileBridge.onPaperConfigUpdate(JSON.stringify({ options: this.options })); } catch(e) {}
      }
    }
  }

  /** Set options from TV remote sync — updates the game without triggering bridge back */
  setOptions(options) {
    if (!Array.isArray(options) || options.length === 0) return;
    this.options = options.map(String);
    if (this.inputField) this.inputField.value = this.options.join(' ');
    this.resetStack();
    this.renderChips();
  }

  resetStack() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.isFlying = false;
    this.isBirdActive = false;
    this.windActive = false;
    this.fanBtn.classList.remove('active', 'spinning');
    this.fanBtn.disabled = false;

    const colors = ['#FF2E93', '#7000FF', '#00F0FF', '#00FF66', '#FFE600', '#FF8A00', '#00D2FF'];

    const centerX = this.width / 2;
    const centerY = this.height - 90;

    this.paperSlips = this.options.map((name, idx) => ({
      name,
      x: centerX + (Math.random() - 0.5) * 12,
      y: centerY - idx * 4,
      vx: 0,
      vy: 0,
      angle: (Math.random() - 0.5) * 0.15,
      vAngle: 0,
      width: Math.max(90, Math.min(150, name.length * 14 + 40)),
      height: 40,
      color: colors[idx % colors.length],
      isPicked: false,
      isLanded: true
    }));

    this.bird = {
      x: -120,
      y: 130,
      vx: 0,
      vy: 0,
      angle: 0,
      wingPhase: 0,
      state: 'idle', // 'idle' -> 'entering' -> 'greeting' -> 'stunting' -> 'swooping' -> 'carrying' -> 'revealing'
      speechText: '',
      isWinking: false,
      stuntTimer: 0,
      stuntPhase: 0,
      targetPaper: null
    };

    this.draw();
    this.renderChips();
  }

  startFlyingPapers(presetChosenIndex) {
    if (this.isFlying || this.options.length === 0) return;
    this.isFlying = true;
    this.windActive = true;
    this.fanBtn.classList.add('active', 'spinning');
    this.fanBtn.disabled = true;
    this.winnerBadge.textContent = '🌀 Wind blowing papers into the sky...';

    if (this.soundEngine) {
      this.soundEngine.playTick(1.2);
    }

    // Launch papers into realistic fluttering air currents
    this.paperSlips.forEach((p, i) => {
      p.isLanded = false;
      p.vx = (Math.random() - 0.5) * 16;
      p.vy = -(Math.random() * 14 + 10);
      p.vAngle = (Math.random() - 0.5) * 0.3;
    });

    // Use preset index (TV remote) or pick a new one (phone initiator)
    if (typeof presetChosenIndex === 'number' && presetChosenIndex >= 0 && presetChosenIndex < this.options.length) {
      this.chosenIndex = presetChosenIndex;
    } else {
      const randBuf = new Uint32Array(1);
      window.crypto.getRandomValues(randBuf);
      this.chosenIndex = randBuf[0] % this.options.length;
      // Notify TV of the chosen index
      if (window.MobileBridge) {
        try { window.MobileBridge.onPaperAction(this.chosenIndex); } catch(e) {}
      }
    }

    // Launch Bird after 1.8s of flying papers
    setTimeout(() => {
      this.launchCarrierBird();
    }, 1800);

    this.animate();
  }

  launchCarrierBird() {
    this.isBirdActive = true;
    this.bird.x = -100;
    this.bird.y = 140;
    this.bird.state = 'entering';
    this.bird.targetPaper = this.paperSlips[this.chosenIndex];
    this.winnerBadge.textContent = '🕊️ Look! Carrier Bird is flying in!';

    if (this.soundEngine) {
      this.soundEngine.playTick(1.6);
    }
  }

  animate() {
    this.updatePhysics();
    this.draw();

    if (this.isFlying) {
      this.animFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  updatePhysics() {
    // 1. Paper slips wind & gravity physics
    const floorY = this.height - 55;

    this.paperSlips.forEach((p, idx) => {
      if (p.isPicked) {
        // Paper attached to bird beak
        p.x += (this.bird.x - p.x) * 0.3;
        p.y += (this.bird.y + 20 - p.y) * 0.3;
        p.angle += (0 - p.angle) * 0.15;
        return;
      }

      if (this.windActive) {
        // Active wind lift & realistic turbulence flutter
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.vAngle;

        p.vy += 0.22; // gravity
        p.vx += (Math.sin(Date.now() * 0.005 + idx * 1.5) * 0.75); // turbulent sway
        p.vy += (Math.cos(Date.now() * 0.006 + idx * 1.2) * 0.4);

        p.vx *= 0.98;
        p.vy *= 0.98;
        p.vAngle *= 0.96;

        // Paper-to-Paper collision prevention (lightweight)
        for (let j = idx + 1; j < this.paperSlips.length; j++) {
          const p2 = this.paperSlips[j];
          if (p.isPicked || p2.isPicked) continue;

          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const distSq = dx * dx + dy * dy;
          const minSpace = (p.width + p2.width) * 0.4;
          const minSpaceSq = minSpace * minSpace;

          if (distSq < minSpaceSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const overlap = minSpace - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            p.x -= nx * overlap * 0.4;
            p.y -= ny * overlap * 0.4;
            p2.x += nx * overlap * 0.4;
            p2.y += ny * overlap * 0.4;
          }
        }

        // Stage boundary bouncing
        const margin = 45;
        if (p.x < margin) { p.x = margin; p.vx = Math.abs(p.vx) * 0.8; }
        if (p.x > this.width - margin) { p.x = this.width - margin; p.vx = -Math.abs(p.vx) * 0.8; }
        if (p.y < margin) { p.y = margin; p.vy = Math.abs(p.vy) * 0.8; }
        if (p.y > floorY) { p.y = floorY; p.vy = -Math.abs(p.vy) * 0.5; }
      } else {
        // Wind stopped -> Drop flat to floor under natural gravity!
        if (!p.isLanded) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.65; // Stronger gravity drop
          p.vx *= 0.92;
          p.angle += (0 - p.angle) * 0.15; // Flatten out horizontally

          if (p.y >= floorY - (idx * 2)) {
            p.y = floorY - (idx * 2);
            p.vy = 0;
            p.vx = 0;
            p.angle = 0;
            p.isLanded = true;
          }
        }
      }
    });

    // 2. Carrier Bird AI & Stunt Choreography
    if (this.isBirdActive) {
      this.bird.wingPhase += 0.28;
      const target = this.bird.targetPaper;

      if (this.bird.state === 'entering') {
        // Fly to top center stage
        const targetX = this.width / 2;
        const targetY = 140;
        const dx = targetX - this.bird.x;
        const dy = targetY - this.bird.y;
        this.bird.x += dx * 0.08;
        this.bird.y += dy * 0.08;

        if (Math.hypot(dx, dy) < 15) {
          this.bird.state = 'greeting';
          this.bird.stuntTimer = Date.now();
          this.bird.isWinking = true;
          this.bird.speechText = "Hello Party People! 🕊️✨";
          if (this.soundEngine) this.soundEngine.playTick(1.8);
        }
      } else if (this.bird.state === 'greeting') {
        // Hover, wink eye, and show greeting speech bubble for 1.6s
        this.bird.y = 140 + Math.sin(Date.now() * 0.005) * 4;
        if (Date.now() - this.bird.stuntTimer > 1600) {
          this.bird.state = 'stunting';
          this.bird.isWinking = false;
          this.bird.speechText = "Watch my Stunts! 🌀🚀";
          this.bird.stuntTimer = Date.now();
          this.bird.stuntPhase = 0;
        }
      } else if (this.bird.state === 'stunting') {
        // Perform 360° Loop-de-loop flight stunt!
        this.bird.stuntPhase += 0.09;
        const stuntRadius = 40;
        const centerX = this.width / 2;
        const centerY = 150;

        this.bird.x = centerX + Math.cos(this.bird.stuntPhase) * stuntRadius;
        this.bird.y = centerY + Math.sin(this.bird.stuntPhase) * stuntRadius;
        this.bird.angle = this.bird.stuntPhase + Math.PI / 2;

        if (this.bird.stuntPhase >= Math.PI * 2) {
          this.bird.state = 'swooping';
          this.bird.angle = 0;
          this.bird.speechText = "Target Locked! 🎯";
          this.winnerBadge.textContent = '🎯 Carrier Bird swooping to grab the winner!';
        }
      } else if (this.bird.state === 'swooping') {
        // Swoop down rapidly toward winning paper
        const dx = target.x - this.bird.x;
        const dy = (target.y - 20) - this.bird.y;
        const dist = Math.hypot(dx, dy);

        this.bird.x += dx * 0.12;
        this.bird.y += dy * 0.12;

        if (dist < 22) {
          // GRAB WINNING PAPER! STOP WIND -> OTHER PAPERS DROP FLAT!
          this.bird.state = 'carrying';
          target.isPicked = true;
          this.windActive = false; // Wind turns off, others drop to floor!
          this.fanBtn.classList.remove('spinning');
          this.bird.speechText = "Got it! 📜✨";

          if (this.soundEngine) this.soundEngine.playPop(1.6);
        }
      } else if (this.bird.state === 'carrying') {
        // Fly up to center stage with winning paper
        const destX = this.width / 2;
        const destY = this.height / 2 - 50;

        const dx = destX - this.bird.x;
        const dy = destY - this.bird.y;
        const dist = Math.hypot(dx, dy);

        this.bird.x += dx * 0.08;
        this.bird.y += dy * 0.08;

        if (dist < 15) {
          this.bird.state = 'revealing';
          this.bird.speechText = '';
          this.revealWinner();
        }
      } else if (this.bird.state === 'revealing') {
        // Hover at center presenting winner
        this.bird.y = (this.height / 2 - 50) + Math.sin(Date.now() * 0.004) * 5;
      }
    }
  }

  revealWinner() {
    const winnerName = this.options[this.chosenIndex] || 'Winner';
    this.lastPickedName = winnerName;
    this.winnerBadge.textContent = `🎉 " ${winnerName} " is the Chosen Winner!`;
    this.winnerBadge.classList.add('revealed');

    if (this.soundEngine) {
      this.soundEngine.speak(`Winner is ${winnerName}!`);
    }

    if (this.removePickedHeaderBtn) {
      this.removePickedHeaderBtn.textContent = `🗑️ Remove "${winnerName}"`;
      this.removePickedHeaderBtn.style.display = 'inline-flex';
    }
    if (this.removePickedBtn) {
      this.removePickedBtn.textContent = `🗑️ Remove "${winnerName}"`;
      this.removePickedBtn.style.display = 'inline-flex';
    }

    if (this.autoRemoveEnabled) {
      setTimeout(() => {
        if (this.lastPickedName === winnerName) {
          this.removePickedPaper();
        }
      }, 1800);
    }

    if (this.soundEngine) this.soundEngine.playVictory();
    if (this.particles) this.particles.burst();

    this.fanBtn.classList.add('finished');
    this.fanBtn.innerHTML = `<span class="fan-icon">🔄</span><span class="fan-label">RETRY</span>`;
    this.fanBtn.disabled = false;

    this.fanBtn.onclick = () => {
      this.winnerBadge.classList.remove('revealed');
      this.fanBtn.innerHTML = `<span class="fan-icon">🌀</span><span class="fan-label">START FAN</span>`;
      if (this.removePickedHeaderBtn) this.removePickedHeaderBtn.style.display = 'none';
      if (this.removePickedBtn) this.removePickedBtn.style.display = 'none';
      this.resetStack();
      this.fanBtn.onclick = null;
      this.bindEvents();
    };
  }

  removePickedPaper() {
    if (!this.lastPickedName) return;
    const targetName = this.lastPickedName;
    const targetLower = targetName.trim().toLowerCase();

    const updated = this.options.filter(name => name.trim().toLowerCase() !== targetLower);
    this.options = updated.length > 0 ? updated : ['Item 1'];
    this.inputField.value = this.options.join(' ');
    this.lastPickedName = null;

    if (this.removePickedHeaderBtn) this.removePickedHeaderBtn.style.display = 'none';
    if (this.removePickedBtn) this.removePickedBtn.style.display = 'none';

    this.winnerBadge.textContent = `🗑️ "${targetName}" removed! Touch Fan to blow 🌀`;
    this.winnerBadge.classList.remove('revealed');
    this.fanBtn.innerHTML = `<span class="fan-icon">🌀</span><span class="fan-label">START FAN</span>`;
    this.fanBtn.classList.remove('finished');
    this.fanBtn.disabled = false;

    this.resetStack();

    // Sync options to TV if casting
    if (window.MobileBridge) {
      try { window.MobileBridge.onPaperConfigUpdate(JSON.stringify({ options: this.options })); } catch(e) {}
    }
  }

  removePaperByName(nameToRemove) {
    const targetLower = String(nameToRemove).trim().toLowerCase();
    const updated = this.options.filter(name => name.trim().toLowerCase() !== targetLower);
    this.options = updated.length > 0 ? updated : ['Item 1'];
    this.inputField.value = this.options.join(' ');

    if (this.lastPickedName && this.lastPickedName.trim().toLowerCase() === targetLower) {
      this.lastPickedName = null;
      if (this.removePickedHeaderBtn) this.removePickedHeaderBtn.style.display = 'none';
      if (this.removePickedBtn) this.removePickedBtn.style.display = 'none';
    }

    this.winnerBadge.textContent = `🗑️ "${nameToRemove}" removed!`;
    this.resetStack();

    if (window.MobileBridge) {
      try { window.MobileBridge.onPaperConfigUpdate(JSON.stringify({ options: this.options })); } catch(e) {}
    }
  }

  toggleAutoRemove() {
    this.autoRemoveEnabled = !this.autoRemoveEnabled;
    if (this.autoRemoveBtn) {
      this.autoRemoveBtn.textContent = `🔄 Auto-Remove: ${this.autoRemoveEnabled ? 'ON' : 'OFF'}`;
      this.autoRemoveBtn.classList.toggle('active', this.autoRemoveEnabled);
    }
  }

  renderChips() {
    if (!this.chipsContainer) return;
    if (!this.options || this.options.length === 0) {
      this.chipsContainer.innerHTML = '';
      return;
    }
    let html = '';
    this.options.forEach((name) => {
      const isPicked = this.lastPickedName && this.lastPickedName.trim().toLowerCase() === name.trim().toLowerCase();
      html += `
        <span class="paper-chip ${isPicked ? 'picked' : ''}">
          <span class="chip-text">📜 ${name}</span>
          <button class="chip-delete-btn" data-name="${name.replace(/"/g, '&quot;')}" title="Remove ${name}">✕</button>
        </span>
      `;
    });
    this.chipsContainer.innerHTML = html;

    const delBtns = this.chipsContainer.querySelectorAll('.chip-delete-btn');
    delBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nameVal = btn.dataset.name;
        if (nameVal) this.removePaperByName(nameVal);
      });
    });
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Wooden/Glass Tray at base
    const trayWidth = 240;
    const trayHeight = 24;
    const trayX = (this.width - trayWidth) / 2;
    const trayY = this.height - 50;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(trayX, trayY, trayWidth, trayHeight, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. Draw Paper Slips
    this.paperSlips.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Glow / Shadow
      ctx.shadowColor = p.isPicked ? '#FFE600' : 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = p.isPicked ? 30 : 10;

      const pw = p.isPicked ? p.width * 1.4 : p.width;
      const ph = p.isPicked ? p.height * 1.4 : p.height;

      // Paper card body
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 8);
      ctx.fill();

      // Border
      ctx.strokeStyle = p.isPicked ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = p.isPicked ? 3.5 : 1.5;
      ctx.stroke();

      // Name Text inside paper slip
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      const fontSize = p.isPicked ? 23 : 16;
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.name, 0, 0);

      ctx.restore();
    });

    // 3. Draw Carrier Bird & Speech Bubble
    if (this.isBirdActive) {
      this.drawBird(this.bird.x, this.bird.y, this.bird.wingPhase, this.bird.angle, this.bird.isWinking);
      if (this.bird.speechText) {
        this.drawSpeechBubble(this.bird.x, this.bird.y - 32, this.bird.speechText);
      }
    }
  }

  drawBird(x, y, wingPhase, angle, isWinking) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const wingAngle = Math.sin(wingPhase) * 0.45;

    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 18;

    // Bird Body
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bird Head
    ctx.beginPath();
    ctx.arc(15, -4, 9, 0, Math.PI * 2);
    ctx.fill();

    // Golden Beak
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(22, -5);
    ctx.lineTo(30, -2);
    ctx.lineTo(22, 1);
    ctx.closePath();
    ctx.fill();

    // Eye / Wink Eye Animation!
    if (isWinking) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(17, -5, 3, 0, Math.PI); // Winking curved eye
      ctx.stroke();
    } else {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(17, -5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Left Wing
    ctx.save();
    ctx.rotate(-wingAngle);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.quadraticCurveTo(-15, -28, -28, -12);
    ctx.quadraticCurveTo(-12, -8, -4, -4);
    ctx.fill();
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.rotate(wingAngle);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.moveTo(2, -4);
    ctx.quadraticCurveTo(15, -28, 28, -12);
    ctx.quadraticCurveTo(12, -8, 2, -4);
    ctx.fill();
    ctx.restore();

    // Tail Feathers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(-17, -2);
    ctx.lineTo(-30, -8);
    ctx.lineTo(-27, 0);
    ctx.lineTo(-30, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawSpeechBubble(x, y, text) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const paddingX = 12;
    const paddingY = 6;
    const bubbleW = textWidth + paddingX * 2;
    const bubbleH = 26;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.roundRect(x - bubbleW / 2, y - bubbleH / 2, bubbleW, bubbleH, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  pause() {
    this.isFlying = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  destroy() {
    this.pause();
  }
}
