// Web Audio API Procedural Audio & Music Engine with Funny Sound Effects

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.bgmInterval = null;
    this.isBgmPlaying = false;
    this.bgmMuted = false;
    this.sfxMuted = false;
    this.voiceMuted = false;
    this.volume = 0.5;
    this.step = 0;
  }

  toggleVoice(enable) {
    this.voiceMuted = !enable;
  }

  speak(text) {
    if (this.voiceMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // cancel any active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch(e) {
      console.warn("Speech synthesis error", e);
    }
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.25;
    this.bgmGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;
    this.sfxGain.connect(this.masterGain);
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  toggleBgm(enable) {
    this.ensureContext();
    this.bgmMuted = !enable;
    if (enable) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
  }

  toggleSfx(enable) {
    this.sfxMuted = !enable;
  }

  toggleFunnyMode(enable) {
    this.funnyMode = enable;
  }

  syncAudioState(config) {
    if (!config) return;
    if (typeof config.sfxMuted === 'boolean') {
      this.sfxMuted = config.sfxMuted;
    }
    if (typeof config.funnyMode === 'boolean') {
      this.funnyMode = config.funnyMode;
    }
    if (typeof config.bgmMuted === 'boolean') {
      this.bgmMuted = config.bgmMuted;
      if (!this.bgmMuted) {
        this.ensureContext();
        this.startBgm();
      } else {
        this.stopBgm();
      }
    }
  }

  // Cartoon Pop sound on slice tick
  playPop(pitchRatio = 1.0) {
    if (this.sfxMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 500 * pitchRatio;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.025);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch(e){}
      };

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {
      console.warn("Pop sound error", e);
    }
  }

  // Classic Tick sound
  playTick(pitchRatio = 1.0) {
    if (this.sfxMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 * pitchRatio, now);
      osc.frequency.exponentialRampToValueAtTime(120 * pitchRatio, now + 0.04);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch(e){}
      };

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {
      console.warn("Tick audio error", e);
    }
  }

  // Hilarious Cartoon Boing (Spring wobble) sound!
  playBoing() {
    if (this.sfxMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const carrier = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const masterGain = this.ctx.createGain();

      // Carrier sweeps pitch up rapidly
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(140, now);
      carrier.frequency.exponentialRampToValueAtTime(520, now + 0.35);

      // LFO for spring wobble vibrato
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(28, now); // 28Hz fast spring wobble

      lfoGain.gain.setValueAtTime(60, now); // Vibrato depth
      lfoGain.gain.exponentialRampToValueAtTime(5, now + 0.35);

      lfo.connect(carrier.frequency);

      masterGain.gain.setValueAtTime(0.5, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      carrier.connect(masterGain);
      masterGain.connect(this.sfxGain);

      carrier.onended = () => {
        try {
          carrier.disconnect();
          lfo.disconnect();
          lfoGain.disconnect();
          masterGain.disconnect();
        } catch(e){}
      };

      lfo.start(now);
      carrier.start(now);

      lfo.stop(now + 0.4);
      carrier.stop(now + 0.4);
    } catch (e) {
      console.warn("Boing sound error", e);
    }
  }

  // Funny Cartoon Quack / Honk sound!
  playQuack() {
    if (this.sfxMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Quack pitch drop
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(160, now + 0.2);

      osc2.frequency.setValueAtTime(390, now);
      osc2.frequency.exponentialRampToValueAtTime(195, now + 0.2);

      // Formant quack filter peak
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.Q.setValueAtTime(5, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.23);
      osc2.stop(now + 0.23);
    } catch (e) {
      console.warn("Quack sound error", e);
    }
  }

  // Cartoon Slide Whistle Drop
  playSlideWhistle() {
    if (this.sfxMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.45);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch (e) {
      console.warn("Slide whistle error", e);
    }
  }

  // Comical Victory Celebration Fanfare!
  playVictory() {
    if (this.sfxMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (this.funnyMode) {
      // Play Boing + Quack + Bouncy Mario style victory chime!
      this.playBoing();
      setTimeout(() => this.playQuack(), 200);

      const funnyNotes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      funnyNotes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.08, this.ctx.currentTime + 0.12);

          gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

          osc.connect(gain);
          gain.connect(this.sfxGain);

          osc.start();
          osc.stop(this.ctx.currentTime + 0.22);
        }, 300 + idx * 80);
      });
      return;
    }

    // Standard Fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.55);
      }, idx * 110);
    });
  }

  startBgm() {
    if (this.isBgmPlaying || this.bgmMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.step = 0;

    // Playful bouncy synth melody generator
    const scale = [261.63, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99];
    const bassline = [130.81, 164.81, 196.00, 146.83];

    this.bgmInterval = setInterval(() => {
      if (!this.isBgmPlaying || this.bgmMuted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Bass synth note
      if (this.step % 2 === 0) {
        const bassFreq = bassline[Math.floor(this.step / 2) % bassline.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        bassGain.gain.setValueAtTime(0.2, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.bgmGain);

        bassOsc.onended = () => {
          try {
            bassOsc.disconnect();
            filter.disconnect();
            bassGain.disconnect();
          } catch(e){}
        };

        bassOsc.start(now);
        bassOsc.stop(now + 0.23);
      }

      // Playful pitch bend melody note
      const melFreq = scale[(this.step * 2 + (this.step % 3)) % scale.length];
      const melOsc = this.ctx.createOscillator();
      const melGain = this.ctx.createGain();
      melOsc.type = 'triangle';
      melOsc.frequency.setValueAtTime(melFreq, now);
      melOsc.frequency.exponentialRampToValueAtTime(melFreq * 1.05, now + 0.15);

      melGain.gain.setValueAtTime(0.14, now);
      melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      melOsc.connect(melGain);
      melGain.connect(this.bgmGain);

      melOsc.onended = () => {
        try {
          melOsc.disconnect();
          melGain.disconnect();
        } catch(e){}
      };

      melOsc.start(now);
      melOsc.stop(now + 0.17);

      this.step = (this.step + 1) % 16;
    }, 170);
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // Referee Whistle SFX for Musical Chairs
  playWhistle() {
    if (this.sfxMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    // Whistle high trill pitch
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, now);

    lfo.type = 'square';
    lfo.frequency.setValueAtTime(35, now); // Trill speed
    lfoGain.gain.setValueAtTime(120, now); // Trill depth

    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.onended = () => {
      try {
        osc.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
        gain.disconnect();
      } catch(e){}
    };

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.6);
    osc.stop(now + 0.65);
  }
}

export const soundEngine = new SoundEngine();
window.soundEngine = soundEngine;
