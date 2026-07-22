// Main Orchestrator for Multi-Wheel Spinner Game

import { Wheel } from './wheel.js';
import { soundEngine } from './audio.js';
import { ParticleSystem } from './particles.js';

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
        options: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6']
      },
      {
        title: 'Action / Task',
        options: ['Sing a Song', 'Do 10 Pushups', 'Tell a Joke', 'Imitate Someone', 'High Five Next Person', 'Dance for 10s']
      },
      {
        title: 'Multiplier / Bonus',
        options: ['1x Points', '2x Points', '3x Points', 'Loss of Turn', 'Jackpot +100', 'Swap Points']
      }
    ];

    this.wheelConfigs = JSON.parse(JSON.stringify(this.defaultConfigs));

    this.presets = {
      truth_dare: [
        { title: 'Type', options: ['TRUTH 🗣️', 'DARE ⚡', 'TRUTH 🗣️', 'DARE ⚡'] },
        { title: 'Intensity', options: ['Mild 🌿', 'Medium 🌶️', 'Spicy 🔥', 'Extreme 💥'] },
        { title: 'Condition', options: ['Do it now', 'Double dare', 'Pass to left', 'Free Pass'] }
      ],
      dinner_pick: [
        { title: 'Cuisine', options: ['Pizza 🍕', 'Sushi 🍣', 'Tacos 🌮', 'Burger 🍔', 'Pasta 🍝', 'Ramen 🍜', 'Curry 🍛'] },
        { title: 'Service', options: ['Dine In 🍽️', 'Takeout 🥡', 'Delivery 🚗', 'Cook at Home 👨‍🍳'] },
        { title: 'Dessert', options: ['Ice Cream 🍦', 'Brownie 🍫', 'Cheesecake 🍰', 'Skip Dessert ❌'] }
      ],
      decision_maker: [
        { title: 'Decision', options: ['YES! ✅', 'NO ❌', 'MAYBE ❓', 'DEFINITELY 💯', 'ASK AGAIN 🔄'] },
        { title: 'Timeframe', options: ['Right Now ⏱️', 'Later Today 🌅', 'Tomorrow 📅', 'Next Week 🗓️'] },
        { title: 'Consequence', options: ['Treat Yourself 🎁', 'Share with Friend 🤝', 'Keep Secret 🤫'] }
      ],
      numbers_dice: [
        { title: 'Dice 1', options: ['1 ⚀', '2 ⚁', '3 ⚂', '4 ⚃', '5 ⚄', '6 ⚅'] },
        { title: 'Dice 2', options: ['1 ⚀', '2 ⚁', '3 ⚂', '4 ⚃', '5 ⚄', '6 ⚅'] },
        { title: 'Modifier', options: ['+1', '-1', 'x2', 'x3', '+5'] }
      ],
      team_members: [
        { title: 'Team Member', options: ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Chris'] },
        { title: 'Role', options: ['Lead Meeting 🎙️', 'Take Notes 📝', 'Code Review 💻', 'Demo Feature 🚀'] },
        { title: 'Perk', options: ['Free Coffee ☕', 'Leave 15m Early 🏃', 'Pick Song 🎵', 'Kudos Star ⭐'] }
      ]
    };

    this.loadFromStorage();
    this.initDOM();
    this.initParticleEngine();
    this.setupEventListeners();
    this.renderWheels();
    this.updateTabEditor();
    this.updateTabsVisibility();
    this.renderHistoryList();
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
        spinHistory: this.spinHistory.slice(-100) // Keep last 100 entries max
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
    this.funnyToggleBtn = document.getElementById('funny-toggle-btn');

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
  setupEventListeners() {
    if (this.wheelCountBtns) {
      this.wheelCountBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const count = parseInt(e.target.dataset.count, 10);
          this.setWheelCount(count);
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
      this.spinAllBtn.addEventListener('click', () => this.spinAll());
    }

    if (this.autoRemoveBtn) {
      this.autoRemoveBtn.addEventListener('click', () => {
        this.autoRemoveEnabled = !this.autoRemoveEnabled;
        this.autoRemoveBtn.classList.toggle('active', this.autoRemoveEnabled);
        const textSpan = this.autoRemoveBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `Auto-Remove: ${this.autoRemoveEnabled ? 'ON' : 'OFF'}`;
        if (this.autoRemoveEnabled && soundEngine.funnyMode) soundEngine.playQuack();
      });
    }

    if (this.mainRemoveBtn) {
      this.mainRemoveBtn.addEventListener('click', () => {
        this.removeLandedOptions();
      });
    }

    if (this.reverseSpinBtn) {
      this.reverseSpinBtn.addEventListener('click', () => {
        this.reverseSpinEnabled = !this.reverseSpinEnabled;
        this.reverseSpinBtn.classList.toggle('active', this.reverseSpinEnabled);
        const textSpan = this.reverseSpinBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `Reverse: ${this.reverseSpinEnabled ? 'ON' : 'OFF'}`;
        if (soundEngine.funnyMode) soundEngine.playQuack();
      });
    }

    if (this.multiThrustBtn) {
      this.multiThrustBtn.addEventListener('click', () => {
        this.multiThrustEnabled = !this.multiThrustEnabled;
        this.multiThrustBtn.classList.toggle('active', this.multiThrustEnabled);
        const textSpan = this.multiThrustBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `Thrust Kicks: ${this.multiThrustEnabled ? 'ON' : 'OFF'}`;
        if (soundEngine.funnyMode) soundEngine.playQuack();
      });
    }

    if (this.funnyToggleBtn) {
      this.funnyToggleBtn.addEventListener('click', () => {
        const isFunny = soundEngine.funnyMode;
        soundEngine.toggleFunnyMode(!isFunny);
        this.funnyToggleBtn.classList.toggle('active', !isFunny);
        const textSpan = this.funnyToggleBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `Funny Mode: ${!isFunny ? 'ON' : 'OFF'}`;
        if (!isFunny) soundEngine.playQuack();
      });
    }

    if (this.bgmToggleBtn) {
      this.bgmToggleBtn.addEventListener('click', () => {
        const isMuted = soundEngine.bgmMuted;
        soundEngine.toggleBgm(isMuted);
        this.bgmToggleBtn.classList.toggle('active', isMuted);
        const textSpan = this.bgmToggleBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `Music: ${isMuted ? 'ON' : 'OFF'}`;
      });
    }

    if (this.sfxToggleBtn) {
      this.sfxToggleBtn.addEventListener('click', () => {
        const isMuted = soundEngine.sfxMuted;
        soundEngine.toggleSfx(isMuted);
        this.sfxToggleBtn.classList.toggle('active', !isMuted);
        const textSpan = this.sfxToggleBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = `SFX: ${!isMuted ? 'ON' : 'OFF'}`;
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

    if (this.presetSelect) {
      this.presetSelect.addEventListener('change', (e) => {
        const key = e.target.value;
        if (key && this.presets[key]) {
          const presetData = this.presets[key];
          presetData.forEach((item, idx) => {
            if (idx < 3) {
              this.wheelConfigs[idx] = { title: item.title, options: [...item.options] };
            }
          });
          this.renderWheels();
          this.updateTabEditor();
          this.saveToStorage();
        }
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

    // Handle window resize for canvases
    window.addEventListener('resize', () => {
      this.wheels.forEach(w => w.resize());
    });

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
    this.wheelConfigs = JSON.parse(JSON.stringify(this.defaultConfigs));
    this.activeWheelCount = 2;
    this.spinDuration = 5;
    this.lastLandedResults = [];

    // Reset UI
    if (this.spinDurationInput) this.spinDurationInput.value = 5;
    if (this.durationValDisplay) this.durationValDisplay.textContent = '5s';
    if (this.wheelCountBtns) {
      this.wheelCountBtns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.count, 10) === 2);
      });
    }
    if (this.presetSelect) this.presetSelect.value = '';

    this.renderWheels();
    this.updateTabsVisibility();
    this.updateTabEditor();
    this.hideToast();
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
        if (soundEngine.funnyMode) {
          soundEngine.playBoing();
        } else {
          soundEngine.playTick(1.5);
        }
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
  updateTabEditor() {
    const config = this.wheelConfigs[this.activeTab];
    if (config) {
      this.titleInput.value = config.title;
      this.optionsInput.value = config.options.join('\n');
    }
  }

  saveCurrentTabConfig() {
    const title = this.titleInput.value.trim() || `Wheel ${this.activeTab + 1}`;
    const options = this.optionsInput.value
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0);

    if (options.length === 0) {
      alert('Please enter at least one option line!');
      return;
    }

    this.wheelConfigs[this.activeTab] = { title, options };

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
  async spinAll() {
    if (this.wheels.some(w => w.isSpinning)) return;

    soundEngine.ensureContext();
    if (soundEngine.funnyMode) soundEngine.playBoing();
    this.spinAllBtn.disabled = true;

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
        return wheel.spin(this.spinDuration, null, profile.speedMultiplier, profile.easePower, this.reverseSpinEnabled, this.multiThrustEnabled).then(result => {
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
      const targetText = res.result;
      if (this.wheelConfigs[idx]) {
        // Filter out the landed option from the wheel options list
        const updatedOptions = this.wheelConfigs[idx].options.filter(opt => {
          const txt = typeof opt === 'string' ? opt : opt.text;
          return txt !== targetText;
        });

        // Ensure at least 1 fallback item if all options removed
        if (updatedOptions.length === 0) {
          updatedOptions.push('Item 1');
        }

        this.wheelConfigs[idx].options = updatedOptions;

        if (this.wheels[idx]) {
          this.wheels[idx].setOptions(updatedOptions);
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
}

// Start App when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
