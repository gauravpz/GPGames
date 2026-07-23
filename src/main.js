import { Wheel } from './wheel.js';
import { soundEngine } from './audio.js';
import { ParticleSystem } from './particles.js';
import { PaperGame } from './paperGame.js';
import { MusicalChairsGame } from './musicalChairs.js';

const STORAGE_KEY = 'spinverse_data';

class App {
  constructor() {
    this.activeWheelCount = 2; // Default 2 wheels
    this.spinDuration = 5; // Default 5 seconds
    this.wheels = [];
    this.activeTab = 0;
    this.spinHistory = [];
    this.spinCounter = 0;

    this.defaultConfigs = [
      {
        title: 'Player / Subject',
        options: ['Gaurav', 'Madhu', 'Papa', 'Mama', 'Dadi', 'Dadaji', 'Pappu', 'Chhakka', '12']
      },
      {
        title: 'Action / Task',
        options: [
          'Sing Your Favorite Song',
          '5 High Fives in 3 Seconds!',
          'Show Your Best Dance Move',
          'Mimic Someone in the Room',
          'Impersonate Your Mother',
          'Tell a Joke & Make Us Laugh',
          'Name 5 Neighbors of India',
          'Hop Around Like a Rabbit',
          'Tell a Short Story About God',
          'Recite a Quick Poem',
          '1 Sentence in 3 Languages',
          'Name Everyone Alphabetically',
          'Start a Whispering Chain',
          'Mirror Someone\'s Moves',
          'Spell K, O, R with Your Body',
          'Act Like a Mute Teacher',
          'Say a Tongue Twister Fast',
          'Write Your Name With Your Nose',
          'Act like your teacher',
          'Name 4 rivers'
        ]
      },
      {
        title: 'Multiplier / Bonus',
        options: ['1x Points', '2x Points', '3x Points', 'Loss of Turn', 'Jackpot +100', 'Swap Points']
      }
    ];

    this.wheelConfigs = JSON.parse(JSON.stringify(this.defaultConfigs));

    this.loadFromStorage();
    this.initDOM();
    this.initParticleEngine();
    this.initPaperGame();
    this.initMusicalChairsGame();
    this.syncPlayerListToGames();
    this.setupEventListeners();
    this.setupArcadeLauncher();
    this.renderWheels();
    this.updateTabEditor();
    this.updateTabsVisibility();
    this.renderHistoryList();
    this.activateTVSetup();
  }

  syncPlayerListToGames() {
    const rawPlayers = this.wheelConfigs[0]?.options;
    if (!Array.isArray(rawPlayers) || rawPlayers.length === 0) return;
    const players = rawPlayers.map(opt => typeof opt === 'string' ? opt : (opt.text || String(opt)));
    if (this.paperGame && typeof this.paperGame.setOptions === 'function') {
      this.paperGame.setOptions(players);
    }
    if (this.chairsGame && typeof this.chairsGame.setOptions === 'function') {
      this.chairsGame.setOptions(players);
    }
  }

  initPaperGame() {
    const container = document.getElementById('paper-game-view');
    if (container) {
      this.paperGame = new PaperGame(container, soundEngine, this.particles);
    }
  }

  initMusicalChairsGame() {
    const container = document.getElementById('chairs-game-view');
    if (container) {
      this.chairsGame = new MusicalChairsGame(container, soundEngine, this.particles);
    }
  }

  setupArcadeLauncher() {
    const wheelsTab = document.getElementById('game-mode-wheels-btn');
    const paperTab = document.getElementById('game-mode-paper-btn');
    const chairsTab = document.getElementById('game-mode-chairs-btn');

    const wheelsView = document.getElementById('wheels-game-view');
    const paperView = document.getElementById('paper-game-view');
    const chairsView = document.getElementById('chairs-game-view');

    if (wheelsTab && paperTab && chairsTab && wheelsView && paperView && chairsView) {
      this.addFastTouch(wheelsTab, () => {
        wheelsTab.classList.add('active');
        paperTab.classList.remove('active');
        chairsTab.classList.remove('active');

        wheelsView.style.display = 'flex';
        paperView.style.display = 'none';
        chairsView.style.display = 'none';

        if (this.paperGame) this.paperGame.pause();
        if (this.chairsGame) this.chairsGame.pause();

        this.wheels.forEach(w => w.resize());

        // Sync tab to TV
        if (window.MobileBridge) try { window.MobileBridge.onTabChange('wheels'); } catch(e) {}
      });

      this.addFastTouch(paperTab, () => {
        paperTab.classList.add('active');
        wheelsTab.classList.remove('active');
        chairsTab.classList.remove('active');

        wheelsView.style.display = 'none';
        paperView.style.display = 'block';
        chairsView.style.display = 'none';

        this.syncPlayerListToGames();
        if (this.chairsGame) this.chairsGame.pause();
        if (this.paperGame) this.paperGame.resize();

        // Sync tab to TV
        if (window.MobileBridge) try { window.MobileBridge.onTabChange('paper'); } catch(e) {}
      });

      this.addFastTouch(chairsTab, () => {
        chairsTab.classList.add('active');
        wheelsTab.classList.remove('active');
        paperTab.classList.remove('active');

        wheelsView.style.display = 'none';
        paperView.style.display = 'none';
        chairsView.style.display = 'block';

        this.syncPlayerListToGames();
        if (this.paperGame) this.paperGame.pause();
        if (this.chairsGame) this.chairsGame.resize();

        // Sync tab to TV
        if (window.MobileBridge) try { window.MobileBridge.onTabChange('chairs'); } catch(e) {}
      });
    }
  }

  // ─── LocalStorage ────────────────────────────────────────────────
  loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.wheelConfigs && Array.isArray(data.wheelConfigs)) {
        this.wheelConfigs = data.wheelConfigs;
      }
      if (typeof data.activeWheelCount === 'number') {
        this.activeWheelCount = Math.min(3, Math.max(1, data.activeWheelCount));
      }
      if (typeof data.spinDuration === 'number') {
        this.spinDuration = data.spinDuration;
      }
      if (Array.isArray(data.spinHistory)) {
        this.spinHistory = data.spinHistory;
        this.spinCounter = data.spinHistory.length;
      }
    } catch (e) {
      console.warn('Failed to load saved data:', e);
    }
  }

  saveToStorage() {
    try {
      const data = {
        wheelConfigs: this.wheelConfigs,
        activeWheelCount: this.activeWheelCount,
        spinDuration: this.spinDuration,
        spinHistory: this.spinHistory.slice(-100)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Sync config to TV if casting
      if (window.MobileBridge) {
        try {
          window.MobileBridge.onConfigUpdate(JSON.stringify({
            wheelConfigs: this.wheelConfigs,
            activeWheelCount: this.activeWheelCount,
            audioConfig: {
              bgmMuted: soundEngine.bgmMuted,
              sfxMuted: soundEngine.sfxMuted,
              funnyMode: soundEngine.funnyMode
            }
          }));
        } catch(e) {}
      }
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  // ─── DOM Init ────────────────────────────────────────────────────
  initDOM() {
    this.wheelsGrid = document.getElementById('wheels-grid');
    this.spinAllBtn = document.getElementById('spin-all-btn');
    this.spinDurationInput = document.getElementById('spin-duration');
    this.durationValDisplay = document.getElementById('duration-val');
    this.wheelCountBtns = document.querySelectorAll('#wheel-count-selector .segment-btn');

    this.autoRemoveBtn = document.getElementById('auto-remove-toggle-btn');
    this.mainRemoveBtn = document.getElementById('main-remove-landed-btn');
    this.autoRemoveEnabled = false;

    this.reverseSpinBtn = document.getElementById('reverse-spin-toggle-btn');
    this.multiThrustBtn = document.getElementById('multi-thrust-toggle-btn');
    this.reverseSpinEnabled = false;
    this.multiThrustEnabled = true;

    this.bgmToggleBtn = document.getElementById('bgm-toggle-btn');
    this.sfxToggleBtn = document.getElementById('sfx-toggle-btn');
    this.ttsToggleBtn = document.getElementById('tts-toggle-btn');
    this.funnyToggleBtn = document.getElementById('funny-toggle-btn');
    this.themeSelector = document.getElementById('theme-selector');

    this.tvModeBtn = document.getElementById('tv-mode-btn');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    this.resetAllBtn = document.getElementById('reset-all-btn');

    this.tabBtns = document.querySelectorAll('#wheel-tabs .tab-btn');
    this.titleInput = document.getElementById('wheel-title-input');
    this.optionsInput = document.getElementById('wheel-options-input');
    this.applyConfigBtn = document.getElementById('apply-wheel-config-btn');
    this.shuffleOptionsBtn = document.getElementById('shuffle-options-btn');
    this.presetSelect = document.getElementById('preset-select');

    this.toast = document.getElementById('result-toast');
    this.toastResultsList = document.getElementById('toast-results-list');
    this.toastCloseBtn = document.getElementById('toast-close-btn');
    this.toastProgressBar = document.getElementById('toast-progress-bar');
    this.toastTimer = null;
    this.lastLandedResults = [];

    this.historyList = document.getElementById('history-list');
    this.clearHistoryBtn = document.getElementById('clear-history-btn');

    // Restore saved spin duration into the slider
    if (this.spinDurationInput) {
      this.spinDurationInput.value = this.spinDuration;
    }
    if (this.durationValDisplay) {
      this.durationValDisplay.textContent = `${this.spinDuration}s`;
    }

    // Restore saved wheel count selection
    if (this.wheelCountBtns) {
      this.wheelCountBtns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.count, 10) === this.activeWheelCount);
      });
    }
  }

  initParticleEngine() {
    const particleCanvas = document.getElementById('particle-canvas');
    this.particles = new ParticleSystem(particleCanvas);
  }

  // ─── Event Listeners ────────────────────────────────────────────
  addFastTouch(btn, handler) {
    if (!btn) return;
    let handled = false;
    btn.addEventListener('pointerdown', (e) => {
      handled = true;
      handler(e);
    });
    btn.addEventListener('click', (e) => {
      if (handled) {
        handled = false;
        return;
      }
      handler(e);
    });
  }

  setupEventListeners() {
    if (this.wheelCountBtns) {
      this.wheelCountBtns.forEach(btn => {
        this.addFastTouch(btn, (e) => {
          const count = parseInt(e.target.dataset.count, 10);
          if (count) this.setWheelCount(count);
        });
      });
    }

    if (this.spinDurationInput && this.durationValDisplay) {
      this.spinDurationInput.addEventListener('input', (e) => {
        this.spinDuration = parseInt(e.target.value, 10);
        this.durationValDisplay.textContent = `${this.spinDuration}s`;
        this.saveToStorage();
      });
    }

    if (this.spinAllBtn) {
      this.addFastTouch(this.spinAllBtn, () => this.spinAll());
    }

    if (this.autoRemoveBtn) {
      this.addFastTouch(this.autoRemoveBtn, () => {
        this.autoRemoveEnabled = !this.autoRemoveEnabled;
        this.autoRemoveBtn.classList.toggle('active', this.autoRemoveEnabled);
        const textSpan = this.autoRemoveBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `Auto-Remove: ${this.autoRemoveEnabled ? 'ON' : 'OFF'}`;
      });
    }

    if (this.mainRemoveBtn) {
      this.addFastTouch(this.mainRemoveBtn, () => {
        this.removeLandedOptions();
      });
    }

    if (this.reverseSpinBtn) {
      this.addFastTouch(this.reverseSpinBtn, () => {
        this.reverseSpinEnabled = !this.reverseSpinEnabled;
        this.reverseSpinBtn.classList.toggle('active', this.reverseSpinEnabled);
        const textSpan = this.reverseSpinBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `Reverse: ${this.reverseSpinEnabled ? 'ON' : 'OFF'}`;
      });
    }

    if (this.multiThrustBtn) {
      this.addFastTouch(this.multiThrustBtn, () => {
        this.multiThrustEnabled = !this.multiThrustEnabled;
        this.multiThrustBtn.classList.toggle('active', this.multiThrustEnabled);
        const textSpan = this.multiThrustBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `Thrust Kicks: ${this.multiThrustEnabled ? 'ON' : 'OFF'}`;
      });
    }

    if (this.bgmToggleBtn) {
      this.addFastTouch(this.bgmToggleBtn, () => {
        const isMuted = soundEngine.bgmMuted;
        soundEngine.toggleBgm(isMuted);
        this.bgmToggleBtn.classList.toggle('active', isMuted);
        const textSpan = this.bgmToggleBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `Music: ${isMuted ? 'ON' : 'OFF'}`;
      });
    }

    if (this.sfxToggleBtn) {
      this.addFastTouch(this.sfxToggleBtn, () => {
        const isMuted = soundEngine.sfxMuted;
        soundEngine.toggleSfx(isMuted);
        this.sfxToggleBtn.classList.toggle('active', !isMuted);
        const textSpan = this.sfxToggleBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `SFX: ${!isMuted ? 'ON' : 'OFF'}`;
      });
    }

    if (this.ttsToggleBtn) {
      this.addFastTouch(this.ttsToggleBtn, () => {
        const isMuted = soundEngine.voiceMuted;
        soundEngine.toggleVoice(isMuted);
        this.ttsToggleBtn.classList.toggle('active', !isMuted);
        const textSpan = this.ttsToggleBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `Voice: ${!isMuted ? 'ON' : 'OFF'}`;
      });
    }

    if (this.themeSelector) {
      this.themeSelector.addEventListener('change', (e) => {
        const theme = e.target.value;
        this.wheels.forEach(w => w.setTheme(theme));
      });
    }

    // TV Mode toggle
    if (this.tvModeBtn) {
      this.addFastTouch(this.tvModeBtn, () => {
        const isTV = document.body.classList.toggle('tv-mode');
        this.tvModeBtn.classList.toggle('active', isTV);
        const textSpan = this.tvModeBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = isTV ? 'Exit TV' : 'TV Mode';
        
        // Trigger canvas resize so wheels auto-expand to giant TV sizes!
        setTimeout(() => {
          this.wheels.forEach(w => w.resize());
        }, 100);

        if (isTV && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      });
    }

    const floatingExitBtn = document.getElementById('tv-floating-exit-btn');
    if (floatingExitBtn) {
      this.addFastTouch(floatingExitBtn, () => {
        document.body.classList.remove('tv-mode');
        if (this.tvModeBtn) {
          this.tvModeBtn.classList.remove('active');
          const textSpan = this.tvModeBtn.querySelector('.btn-text');
          if (textSpan) textSpan.textContent = 'TV Mode';
        }
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setTimeout(() => {
          this.wheels.forEach(w => w.resize());
        }, 100);
      });
    }

    // Fullscreen toggle
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    // Reset all
    if (this.resetAllBtn) {
      this.resetAllBtn.addEventListener('click', () => this.resetAll());
    }

    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.activeTab = parseInt(e.target.dataset.tab, 10);
          this.tabBtns.forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.updateTabEditor();
        });
      });
    }

    if (this.applyConfigBtn) {
      this.applyConfigBtn.addEventListener('click', () => {
        this.saveCurrentTabConfig();
      });
    }

    if (this.shuffleOptionsBtn) {
      this.shuffleOptionsBtn.addEventListener('click', () => {
        if (!this.optionsInput) return;
        const lines = this.optionsInput.value.split('\n').filter(l => l.trim() !== '');
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        this.optionsInput.value = lines.join('\n');
        this.saveCurrentTabConfig();
      });
    }



    if (this.toastCloseBtn) {
      this.toastCloseBtn.addEventListener('click', () => {
        this.hideToast();
      });
    }

    // Clear history
    if (this.clearHistoryBtn) {
      this.clearHistoryBtn.addEventListener('click', () => {
        this.spinHistory = [];
        this.spinCounter = 0;
        this.renderHistoryList();
        this.saveToStorage();
      });
    }

    // Keyboard shortcut: Space to spin
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        // Don't fire if user is typing in an input/textarea
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        e.preventDefault();
        this.spinAll();
      }
    });

    // Handle window resize and screen orientation change for canvases
    const handleResize = () => {
      this.wheels.forEach(w => w.resize());
      setTimeout(() => this.wheels.forEach(w => w.resize()), 150);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Update fullscreen button text on fullscreen change
    document.addEventListener('fullscreenchange', () => {
      if (this.fullscreenBtn) {
        const isFS = !!document.fullscreenElement;
        const textSpan = this.fullscreenBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = isFS ? 'Exit FS' : 'Fullscreen';
        this.fullscreenBtn.classList.toggle('active', isFS);
      }
    });
  }

  // ─── Fullscreen ──────────────────────────────────────────────────
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  // ─── Reset All ───────────────────────────────────────────────────
  resetAll() {
    // Preserve user given & saved options in wheelConfigs! Restore full option list to active wheels
    this.lastLandedResults = [];

    // Re-apply saved options and reset physical wheel orientation
    this.wheels.forEach((w, idx) => {
      if (w && this.wheelConfigs[idx]) {
        w.setOptions(this.wheelConfigs[idx].options);
      }
    });

    // Reset winner badges
    for (let i = 0; i < 3; i++) {
      const badge = document.getElementById(`winner-badge-${i}`);
      if (badge) {
        badge.classList.remove('revealed');
        badge.textContent = 'Ready to Spin!';
      }
    }

    this.renderWheels();
    this.updateTabsVisibility();
    this.updateTabEditor();
    this.showToast('♻️ Wheels reset to saved options!');
    this.saveToStorage();
  }

  // ─── Wheel Count ─────────────────────────────────────────────────
  setWheelCount(count) {
    if (count < 1 || count > 3 || count === this.activeWheelCount) return;
    this.activeWheelCount = count;

    this.wheelCountBtns.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.count, 10) === count);
    });

    this.renderWheels();
    this.updateTabsVisibility();
    this.saveToStorage();
  }

  updateTabsVisibility() {
    this.tabBtns.forEach((btn, idx) => {
      btn.style.display = idx < this.activeWheelCount ? 'block' : 'none';
    });
    if (this.activeTab >= this.activeWheelCount) {
      this.activeTab = 0;
      this.tabBtns[0]?.click();
    }
  }

  // ─── Render Wheels ───────────────────────────────────────────────
  renderWheels() {
    if (this.wheels && this.wheels.length > 0) {
      this.wheels.forEach(w => w && w.destroy && w.destroy());
    }
    this.wheelsGrid.innerHTML = '';
    this.wheels = [];
    this.wheelsGrid.className = `wheels-grid layout-${this.activeWheelCount}`;

    for (let i = 0; i < this.activeWheelCount; i++) {
      const config = this.wheelConfigs[i];
      const card = document.createElement('div');
      card.className = 'wheel-card card';

      const title = document.createElement('div');
      title.className = 'wheel-title';
      title.textContent = config.title || `Wheel ${i + 1}`;

      const wrapper = document.createElement('div');
      wrapper.className = 'wheel-canvas-wrapper';
      wrapper.id = `wheel-container-${i}`;

      const badge = document.createElement('div');
      badge.className = 'wheel-winner-badge';
      badge.id = `winner-badge-${i}`;
      badge.textContent = 'Ready to spin!';

      const optionsListDiv = document.createElement('div');
      optionsListDiv.className = 'wheel-options-chips';
      optionsListDiv.id = `wheel-options-chips-${i}`;
      this.renderOptionChips(optionsListDiv, config.options);

      card.appendChild(title);
      card.appendChild(wrapper);
      card.appendChild(badge);
      card.appendChild(optionsListDiv);
      this.wheelsGrid.appendChild(card);

      const wheelInstance = new Wheel(wrapper, i, config.title, config.options);
      wheelInstance.onTickCallback = (speedRatio) => {
        soundEngine.playTick(0.8 + speedRatio * 0.5);
      };
      wheelInstance.onThrustCallback = () => {
        soundEngine.playTick(1.5);
      };
      wheelInstance.onClickCallback = () => {
        this.spinAll();
      };
      this.wheels.push(wheelInstance);
    }
  }

  renderOptionChips(container, options) {
    container.innerHTML = '';
    options.forEach(opt => {
      const chip = document.createElement('span');
      chip.className = 'option-chip';
      chip.textContent = typeof opt === 'string' ? opt : opt.text;
      container.appendChild(chip);
    });
  }

  // ─── Tab Editor ──────────────────────────────────────────────────
  parseOptionLines(rawInputText) {
    if (!rawInputText) return [];

    const rawTrimmed = rawInputText.trim();
    if (!rawTrimmed) return [];

    // Single line input mode: split on delimiters (commas, slashes, pipes, semicolons) or spaces if no newlines
    if (!rawTrimmed.includes('\n')) {
      if (/[,\/\|;]/.test(rawTrimmed)) {
        return rawTrimmed
          .split(/[,\/\|;]+/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
      // If user typed e.g. "Gaurav Madhu Papa Mama" (multiple space-separated names)
      const words = rawTrimmed.split(/\s+/).map(w => w.trim()).filter(w => w.length > 0);
      if (words.length > 1) {
        return words;
      }
    }

    // Multiline mode: split by newlines, also handling any inline delimiters (e.g. commas)
    const lines = rawTrimmed
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const result = [];
    lines.forEach(line => {
      if (/[,\/\|;]/.test(line)) {
        const parts = line.split(/[,\/\|;]+/).map(p => p.trim()).filter(p => p.length > 0);
        result.push(...parts);
      } else {
        result.push(line);
      }
    });

    return result;
  }

  updateTabEditor() {
    const config = this.wheelConfigs[this.activeTab];
    if (config) {
      this.titleInput.value = config.title;
      this.optionsInput.value = config.options.join('\n');
    }
  }

  saveCurrentTabConfig() {
    const title = this.titleInput.value.trim() || `Wheel ${this.activeTab + 1}`;
    const options = this.parseOptionLines(this.optionsInput.value);

    if (options.length === 0) {
      alert('Please enter at least one option line!');
      return;
    }

    // Automatically spread the parsed options across multiple lines in the input field!
    this.optionsInput.value = options.join('\n');

    this.wheelConfigs[this.activeTab] = { title, options };

    if (this.activeTab === 0) {
      this.syncPlayerListToGames();
    }

    if (this.wheels[this.activeTab]) {
      this.wheels[this.activeTab].title = title;
      this.wheels[this.activeTab].setOptions(options);

      const card = this.wheelsGrid.children[this.activeTab];
      if (card) {
        card.querySelector('.wheel-title').textContent = title;
        const chipsDiv = document.getElementById(`wheel-options-chips-${this.activeTab}`);
        if (chipsDiv) this.renderOptionChips(chipsDiv, options);
      }
    }

    this.saveToStorage();
  }

  // ─── Spin All ────────────────────────────────────────────────────
  async spinAll(presetTargetIndices = null) {
    if (this.wheels.some(w => w.isSpinning)) return;

    soundEngine.ensureContext();
    soundEngine.playTick(1.2);
    this.spinAllBtn.disabled = true;

    // Pick/sync exact target indices so Phone and TV land on 100% identical targets
    let targetIndices = presetTargetIndices;
    if (!Array.isArray(targetIndices) || targetIndices.length < this.activeWheelCount) {
      targetIndices = this.wheels.map(w => {
        const randBuf = new Uint32Array(1);
        crypto.getRandomValues(randBuf);
        return randBuf[0] % Math.max(1, w.options.length);
      });

      // Notify phone bridge → triggers TV wheels with matching target indices
      if (window.MobileBridge) {
        try { window.MobileBridge.onSpin(JSON.stringify(targetIndices)); } catch(e) {}
      }
    }

    try {
      // Reset winner badges
      for (let i = 0; i < this.activeWheelCount; i++) {
        const badge = document.getElementById(`winner-badge-${i}`);
        if (badge) {
          badge.classList.remove('revealed');
          badge.textContent = 'Spinning...';
        }
      }

      // Launch all wheel spins simultaneously with different speeds, thrusts & direction physics
      const speedProfiles = [
        { speedMultiplier: 0.82, easePower: 2.8 },
        { speedMultiplier: 1.35, easePower: 4.2 },
        { speedMultiplier: 1.1, easePower: 3.5 }
      ];

      const spinPromises = this.wheels.map((wheel, idx) => {
        const profile = speedProfiles[idx] || speedProfiles[0];
        const targetIdx = (targetIndices && typeof targetIndices[idx] === 'number') ? targetIndices[idx] : null;
        return wheel.spin(this.spinDuration, targetIdx, profile.speedMultiplier, profile.easePower, this.reverseSpinEnabled, this.multiThrustEnabled).then(result => {
          const badge = document.getElementById(`winner-badge-${idx}`);
          if (badge && result && result.winningSlice) {
            badge.textContent = `🎉 ${result.winningSlice.text}`;
            badge.classList.add('revealed');
          }
          return { wheelIndex: idx, title: wheel.title, result: result && result.winningSlice ? result.winningSlice.text : 'Winner' };
        });
      });

      const results = await Promise.all(spinPromises);

      // Play Victory sound fanfare and trigger particle confetti burst
      soundEngine.playVictory();
      this.particles.burst();

      // Announce result with TTS Voice
      const speechText = results.map(r => r.result).join('! ');
      soundEngine.speak(speechText);

      // Show non-blocking 5-second result toast
      this.showResultsToast(results);

      // Add to spin history
      this.addToHistory(results);

      // Enable main area remove button
      if (this.mainRemoveBtn) this.mainRemoveBtn.disabled = false;

      // Auto remove landed options if feature enabled
      if (this.autoRemoveEnabled) {
        setTimeout(() => {
          this.removeLandedOptions();
        }, 800);
      }
    } catch (err) {
      console.error('Error during spin:', err);
    } finally {
      this.spinAllBtn.disabled = false;
    }
  }

  // ─── Results Toast ───────────────────────────────────────────────
  showResultsToast(results) {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.lastLandedResults = results;
    this.toastResultsList.innerHTML = '';

    results.forEach(res => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.innerHTML = `
        <div class="result-item-title">${res.title}</div>
        <div class="result-item-value">${res.result}</div>
      `;
      this.toastResultsList.appendChild(item);
    });

    // Reset progress bar animation
    this.toastProgressBar.style.transition = 'none';
    this.toastProgressBar.style.width = '100%';
    
    // Trigger layout reflow for animation
    void this.toastProgressBar.offsetWidth;
    this.toastProgressBar.style.transition = 'width 5s linear';
    this.toastProgressBar.style.width = '0%';

    this.toast.classList.remove('hidden');

    // Auto close toast after 5 seconds (increased from 3s for readability)
    this.toastTimer = setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  hideToast() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toast.classList.add('hidden');
  }

  // ─── Spin History ────────────────────────────────────────────────
  addToHistory(results) {
    this.spinCounter++;
    const entry = {
      id: this.spinCounter,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      results: results.map(r => ({ title: r.title, value: r.result }))
    };
    this.spinHistory.unshift(entry); // Newest first

    // Cap at 100 entries
    if (this.spinHistory.length > 100) {
      this.spinHistory = this.spinHistory.slice(0, 100);
    }

    this.renderHistoryList();
    this.saveToStorage();
  }

  renderHistoryList() {
    if (!this.historyList) return;

    if (this.spinHistory.length === 0) {
      this.historyList.innerHTML = '<div class="history-empty">No spins yet — hit SPIN to get started!</div>';
      return;
    }

    this.historyList.innerHTML = '';
    this.spinHistory.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'history-entry';

      const num = document.createElement('span');
      num.className = 'history-number';
      num.textContent = `#${entry.id}`;

      const resultsDiv = document.createElement('div');
      resultsDiv.className = 'history-results';
      entry.results.forEach(r => {
        const chip = document.createElement('span');
        chip.className = 'history-result-chip';
        chip.textContent = `${r.title}: ${r.value}`;
        resultsDiv.appendChild(chip);
      });

      const timeSpan = document.createElement('span');
      timeSpan.className = 'history-time';
      timeSpan.textContent = entry.timestamp;

      row.appendChild(num);
      row.appendChild(resultsDiv);
      row.appendChild(timeSpan);
      this.historyList.appendChild(row);
    });
  }

  // ─── Option Elimination ──────────────────────────────────────────
  removeLandedOptions() {
    if (!this.lastLandedResults || this.lastLandedResults.length === 0) return;

    this.lastLandedResults.forEach(res => {
      const idx = res.wheelIndex;
      // Default behavior: Only remove landed options from Wheel 1 (idx === 0); keep Wheel 2 & 3 intact!
      if (idx !== 0) return;

      const targetText = String(res.result).trim().toLowerCase();
      if (this.wheelConfigs[idx] && Array.isArray(this.wheelConfigs[idx].options)) {
        // Filter out the landed option from Wheel 1 options list
        const updatedOptions = this.wheelConfigs[idx].options.filter(opt => {
          const txt = String(typeof opt === 'string' ? opt : (opt.text || '')).trim().toLowerCase();
          return txt !== targetText;
        });

        // Ensure at least 1 fallback item if all options removed
        if (updatedOptions.length === 0) {
          updatedOptions.push('Item 1');
        }

        this.wheelConfigs[idx].options = updatedOptions;

        if (this.wheels[idx]) {
          this.wheels[idx].setOptions(updatedOptions);

          const badge = document.getElementById(`winner-badge-${idx}`);
          if (badge) {
            badge.textContent = `🗑️ "${res.result}" removed!`;
            badge.classList.remove('revealed');
          }

          const chipsDiv = document.getElementById(`wheel-options-chips-${idx}`);
          if (chipsDiv) this.renderOptionChips(chipsDiv, updatedOptions);
        }
      }
    });

    this.updateTabEditor();
    this.saveToStorage();
    if (soundEngine.funnyMode) soundEngine.playQuack();
    this.hideToast();
  }

  // ─── TV Setup Overlay ─────────────────────────────────────────────
  /**
   * Detects if running inside Android TV WebView.
   * If so: shows the TV setup overlay so users enter their wheel items
   * upfront, THEN starts the fullscreen spinner UI.
   * On desktop browsers the overlay is never shown.
   */
  activateTVSetup() {
    // Detect Android TV WebView specifically via TVBridge JS interface
    const isTVWebView = typeof window.TVBridge !== 'undefined';

    if (!isTVWebView) return;

    const overlay = document.getElementById('tv-setup-overlay');
    const startBtn = document.getElementById('tv-start-btn');
    if (!overlay || !startBtn) return;

    // Pre-fill setup inputs from current/saved wheel configs
    for (let i = 0; i < 3; i++) {
      const titleInput = document.getElementById(`tv-title-${i}`);
      const optionsInput = document.getElementById(`tv-options-${i}`);
      if (titleInput && this.wheelConfigs[i]) {
        titleInput.value = this.wheelConfigs[i].title || '';
      }
      if (optionsInput && this.wheelConfigs[i]) {
        const opts = this.wheelConfigs[i].options || [];
        optionsInput.value = opts
          .map(o => (typeof o === 'string' ? o : o.text))
          .join('\n');
      }
    }

    // Show the overlay
    overlay.style.display = 'flex';

    // Focus the first title input for immediate TV keyboard use
    const firstInput = document.getElementById('tv-title-0');
    if (firstInput) setTimeout(() => firstInput.focus(), 300);

    // "START SPINNING" button handler
    startBtn.addEventListener('click', () => {
      // Read inputs and update wheel configs
      let newWheelCount = 1;
      for (let i = 0; i < 3; i++) {
        const titleInput = document.getElementById(`tv-title-${i}`);
        const optionsInput = document.getElementById(`tv-options-${i}`);
        const titleVal = titleInput ? titleInput.value.trim() : '';
        const optionsVal = optionsInput ? optionsInput.value.trim() : '';
        const lines = this.parseOptionLines(optionsVal);

        if (i === 0 || lines.length > 0) {
          // Update config for wheels that have content
          this.wheelConfigs[i] = {
            title: titleVal || `Wheel ${i + 1}`,
            options: lines.length > 0 ? lines : (this.wheelConfigs[i]?.options || ['Item 1'])
          };
          if (i > 0 && lines.length > 0) newWheelCount = i + 1;
          if (i === 0) newWheelCount = Math.max(1, newWheelCount);
        }
      }
      this.activeWheelCount = newWheelCount;

      // Hide setup overlay
      overlay.style.display = 'none';

      // Activate TV mode
      document.body.classList.add('tv-mode');
      if (this.tvModeBtn) {
        this.tvModeBtn.classList.add('active');
        const textSpan = this.tvModeBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = 'Exit TV';
      }

      // Sync wheel count buttons
      if (this.wheelCountBtns) {
        this.wheelCountBtns.forEach(btn => {
          btn.classList.toggle('active', parseInt(btn.dataset.count, 10) === this.activeWheelCount);
        });
      }

      // Update wheels grid layout class
      const grid = document.getElementById('wheels-grid');
      if (grid) {
        grid.classList.remove('layout-1', 'layout-2', 'layout-3');
        grid.classList.add(`layout-${this.activeWheelCount}`);
      }

      // Rebuild and resize wheels
      this.renderWheels();
      this.updateTabEditor();
      this.updateTabsVisibility();
      this.saveToStorage();

      // Slight delay for DOM reflow then resize canvases to fill new size
      setTimeout(() => {
        this.wheels.forEach(w => w.resize());
      }, 150);
    });
  }
}

// Start App when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();

  // ── Global functions called by Android native bridges ──────────────

  /** Called from TV Presentation injection: triggers spin with synced targets */
  window.spinNow = (targetsJson) => {
    if (window.app) {
      let targets = null;
      if (targetsJson) {
        try {
          targets = typeof targetsJson === 'string' ? JSON.parse(targetsJson) : targetsJson;
        } catch(e) {}
      }
      window.app.spinAll(targets);
    }
  };

  /** Called from SpinBridge when phone config changes → updates TV wheels & audio state */
  window.applyConfig = (jsonStr) => {
    try {
      const raw = typeof jsonStr === 'string' ? jsonStr : JSON.stringify(jsonStr);
      const data = JSON.parse(raw);
      if (!window.app) return;
      if (data.wheelConfigs) window.app.wheelConfigs = data.wheelConfigs;
      if (data.activeWheelCount) window.app.activeWheelCount = data.activeWheelCount;
      if (data.audioConfig) {
        soundEngine.syncAudioState(data.audioConfig);
      }
      if (data.paperOptions && window.app.paperGame) {
        window.app.paperGame.setOptions(data.paperOptions);
      }
      if (data.chairsOptions && window.app.chairsGame) {
        window.app.chairsGame.setOptions(data.chairsOptions);
      }
      if (data.activeTab) {
        window.switchTab(data.activeTab);
      }

      // Sync grid layout class
      const grid = document.getElementById('wheels-grid');
      if (grid) {
        grid.classList.remove('layout-1', 'layout-2', 'layout-3');
        grid.classList.add(`layout-${window.app.activeWheelCount}`);
      }
      window.app.renderWheels();
      window.app.updateTabsVisibility();
      setTimeout(() => { window.app.wheels.forEach(w => w.resize && w.resize()); }, 150);
    } catch(e) { console.warn('[SpinVerse] applyConfig error:', e); }
  };

  /** Phone remains 100% full visual game UI */
  window.activateCastControllerMode = () => {
    const badge = document.getElementById('cast-status-badge');
    if (badge) badge.style.display = 'flex';
  };

  /** Restore phone UI */
  window.deactivateCastControllerMode = () => {
    const badge = document.getElementById('cast-status-badge');
    if (badge) badge.style.display = 'none';
  };

  // ── TV Remote: Tab switching ───────────────────────────────────────

  /** Called from WheelPresentation (TV) to switch to the correct game tab */
  window.switchTab = (tabName) => {
    const wheelsTab = document.getElementById('game-mode-wheels-btn');
    const paperTab  = document.getElementById('game-mode-paper-btn');
    const chairsTab = document.getElementById('game-mode-chairs-btn');
    const wheelsView = document.getElementById('wheels-game-view');
    const paperView  = document.getElementById('paper-game-view');
    const chairsView = document.getElementById('chairs-game-view');

    if (!wheelsTab || !paperTab || !chairsTab) return;

    if (tabName === 'wheels') {
      wheelsTab.classList.add('active');
      paperTab.classList.remove('active');
      chairsTab.classList.remove('active');
      if (wheelsView) wheelsView.style.display = 'flex';
      if (paperView)  paperView.style.display  = 'none';
      if (chairsView) chairsView.style.display = 'none';
      if (window.app?.paperGame)  window.app.paperGame.pause();
      if (window.app?.chairsGame) window.app.chairsGame.pause();
      setTimeout(() => { window.app?.wheels?.forEach(w => w.resize?.()); }, 100);
    } else if (tabName === 'paper') {
      paperTab.classList.add('active');
      wheelsTab.classList.remove('active');
      chairsTab.classList.remove('active');
      if (wheelsView) wheelsView.style.display = 'none';
      if (paperView)  paperView.style.display  = 'block';
      if (chairsView) chairsView.style.display = 'none';
      if (window.app?.chairsGame) window.app.chairsGame.pause();
      window.app?.paperGame?.resize();
    } else if (tabName === 'chairs') {
      chairsTab.classList.add('active');
      wheelsTab.classList.remove('active');
      paperTab.classList.remove('active');
      if (wheelsView) wheelsView.style.display = 'none';
      if (paperView)  paperView.style.display  = 'none';
      if (chairsView) chairsView.style.display = 'block';
      if (window.app?.paperGame)  window.app.paperGame.pause();
      window.app?.chairsGame?.resize();
    }
  };

  // ── TV Remote: Paper Game ─────────────────────────────────────────

  /** Called from WheelPresentation to trigger paper fan with a preset chosen index */
  window.triggerPaperAction = (chosenIndex) => {
    if (window.app?.paperGame) {
      window.app.paperGame.startFlyingPapers(chosenIndex);
    }
  };

  /** Called from WheelPresentation to sync paper game player names */
  window.syncPaperConfig = (jsonStr) => {
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (window.app?.paperGame && Array.isArray(data.options)) {
        window.app.paperGame.setOptions(data.options);
      }
    } catch(e) { console.warn('[SpinVerse] syncPaperConfig error:', e); }
  };

  // ── TV Remote: Musical Chairs Game ───────────────────────────────

  /** Called from WheelPresentation to drive the chairs game remotely */
  window.triggerChairsAction = (jsonStr) => {
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (!window.app?.chairsGame) return;
      const game = window.app.chairsGame;
      game._skipBridge = true;
      if (data.action === 'start') {
        game.startMusicRound();
      } else if (data.action === 'freeze') {
        game.stopMusicAndFreezeRemote(data.standingPlayerIndex);
      } else if (data.action === 'next') {
        game.nextRound();
      } else if (data.action === 'reset') {
        game.resetGame();
      }
      game._skipBridge = false;
    } catch(e) { console.warn('[SpinVerse] triggerChairsAction error:', e); }
  };

  /** Called from WheelPresentation to sync chair game player names */
  window.syncChairsConfig = (jsonStr) => {
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (window.app?.chairsGame && Array.isArray(data.options)) {
        window.app.chairsGame.setOptions(data.options);
      }
    } catch(e) { console.warn('[SpinVerse] syncChairsConfig error:', e); }
  };
});
