// Canvas Wheel Renderer & Physics Engine

export class Wheel {
  constructor(canvasContainer, id, title = 'Wheel 1', options = []) {
    this.container = canvasContainer;
    this.id = id;
    this.title = title;
    
    this.canvas = document.createElement('canvas');
    this.canvas.style.cursor = 'pointer';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.rotationAngle = 0; // Current angle in radians
    this.isSpinning = false;
    this.currentSliceIndex = 0;
    this.onTickCallback = null;
    this.onCompleteCallback = null;
    this.onClickCallback = null;
    this.onThrustCallback = null;

    this.ledPhase = 0;
    this.winHighlightIndex = -1;
    this.winHighlightAlpha = 0;
    this.animFrameId = null;
    this.isDestroyed = false;

    this.themes = {
      neon: ['#FF2E93', '#7000FF', '#00F0FF', '#00FF66', '#FFE600', '#FF8A00', '#FF0055', '#A000FF', '#00D2FF', '#39FF14', '#FFD700', '#FF4500'],
      rainbow: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF9500', '#4CD964', '#5AC8FA', '#007AFF'],
      gold: ['#D4AF37', '#FFD700', '#DAA520', '#B8860B', '#F3E5AB', '#CFB53B', '#E6C687', '#AA7C11', '#FFD700', '#D4AF37', '#F3E5AB', '#DAA520'],
      pastel: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E8AEFF', '#FFB3E6', '#BFFCC6', '#FFC6FF', '#BDB2FF', '#A0C4FF', '#CAFFBF']
    };

    this.colorPalette = this.themes.neon;

    this.extraDurationMs = 0;
    this.extraRotations = 0;
    this.spinDirection = 1;

    let handledTouch = false;
    this.canvas.addEventListener('pointerdown', (e) => {
      handledTouch = true;
      if (this.isSpinning) {
        this.addThrust();
      } else if (this.onClickCallback) {
        this.onClickCallback(this);
      }
    });

    this.canvas.addEventListener('click', (e) => {
      if (handledTouch) {
        handledTouch = false;
        return;
      }
      if (this.isSpinning) {
        this.addThrust();
      } else if (this.onClickCallback) {
        this.onClickCallback(this);
      }
    });

    this.setOptions(options.length > 0 ? options : this.getDefaultOptions());
    this.resize();
  }

  addThrust() {
    if (!this.isSpinning) return;
    this.extraDurationMs += 2500;
    this.extraRotations += (this.spinDirection || 1) * (Math.PI * 4);
    if (this.onThrustCallback) {
      this.onThrustCallback();
    }
  }

  destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  getDefaultOptions() {
    return [
      { text: 'Prize 1', color: '#FF2E93' },
      { text: 'Prize 2', color: '#7000FF' },
      { text: 'Prize 3', color: '#00F0FF' },
      { text: 'Prize 4', color: '#00FF66' },
      { text: 'Prize 5', color: '#FFE600' },
      { text: 'Prize 6', color: '#FF8A00' }
    ];
  }

  setOptions(optionsList) {
    this.options = optionsList.map((opt, idx) => {
      if (typeof opt === 'string') {
        return {
          text: opt,
          color: this.colorPalette[idx % this.colorPalette.length]
        };
      }
      return {
        text: opt.text || `Item ${idx + 1}`,
        color: opt.color || this.colorPalette[idx % this.colorPalette.length]
      };
    });
    this.winHighlightIndex = -1;
    this.winHighlightAlpha = 0;

    // Reset wheel rotation angle to align slice 0 under 12 o'clock needle for new options count
    const numSlices = Math.max(1, this.options.length);
    const sliceAngle = (Math.PI * 2) / numSlices;
    this.rotationAngle = (1.5 * Math.PI) - (0.5 * sliceAngle);

    this.draw();
  }

  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.colorPalette = this.themes[themeName];
      this.options.forEach((opt, idx) => {
        opt.color = this.colorPalette[idx % this.colorPalette.length];
      });
      this.draw();
    }
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const w = rect.width > 100 ? rect.width : 450;
    const h = rect.height > 100 ? rect.height : w;
    const size = Math.min(w, h);
    const dpr = window.devicePixelRatio || 1;

    this.size = size;
    this.canvas.width = Math.floor(size * dpr);
    this.canvas.height = Math.floor(size * dpr);
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;

    this.draw();
  }

  _animateLEDs() {
    if (this.isDestroyed) return;
    this.ledPhase += 0.06;
    let needsAnim = false;
    if (this.winHighlightAlpha > 0) {
      this.winHighlightAlpha -= 0.015;
      needsAnim = true;
    }
    
    if (needsAnim || this.isSpinning) {
      this.draw();
      this.animFrameId = requestAnimationFrame(() => this._animateLEDs());
    } else {
      this.animFrameId = null;
    }
  }

  triggerHighlightAnim() {
    if (this.isDestroyed) return;
    if (!this.animFrameId) {
      this.animFrameId = requestAnimationFrame(() => this._animateLEDs());
    }
  }

  draw() {
    const size = this.size;
    if (!size || size <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = this.ctx;
    
    // Reset transform to identity then scale by DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 4;
    const numSlices = Math.max(1, this.options.length);
    const sliceAngle = (Math.PI * 2) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Outer Neon Glow Ring (clean static border, no blinking LEDs)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1b4b';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Draw Slices
    for (let i = 0; i < numSlices; i++) {
      const startAngle = this.rotationAngle + (i * sliceAngle);
      const endAngle = startAngle + sliceAngle;
      const option = this.options[i];
      const sliceColor = (option && option.color) ? option.color : this.colorPalette[i % this.colorPalette.length];
      let sliceText = (option && option.text !== undefined) ? String(option.text) : (typeof option === 'string' ? option : `Item ${i + 1}`);

      // Slice sector
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = sliceColor;
      ctx.fill();

      // Slice border stroke
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Text label inside slice — Unified Outward Radial Direction & 32px Pointer Clearance!
      const midAngle = startAngle + sliceAngle / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // 1. Slim, clean font weight for optimal legibility
      const fontWeight = numSlices > 12 ? '600' : '700';
      
      // 2. Fine stroke outline so letters are sharp and crisp
      const strokeWidth = numSlices > 14 ? 1.8 : (numSlices > 8 ? 2.2 : 2.8);

      // 3. Center Hub Clearance & Pointer Clearance
      const hubRadius = Math.max(18, Math.floor(size * 0.058));
      const textDistance = radius - 30; // Outer rim & needle pointer clearance
      const minTextRadius = hubRadius + 14; // Strict 14px buffer from center hub edge
      const maxRadiusWidth = Math.max(20, textDistance - minTextRadius); // Strict width bound!

      const maxArcHeight = 2 * textDistance * Math.sin(sliceAngle / 2) * 0.85;

      // 4. Font size caps and balanced scaling
      const maxCap = numSlices > 14 ? 15 : (numSlices > 10 ? 19 : (numSlices > 6 ? 23 : 26));
      let fontSize = Math.min(maxCap, Math.floor(radius / (numSlices > 10 ? 6.0 : 4.8)));
      fontSize = Math.max(9, fontSize);

      ctx.font = `${fontWeight} ${fontSize}px system-ui, -apple-system, sans-serif`;

      const words = sliceText.split(' ');
      let lines = [];
      let currentLine = '';

      words.forEach(w => {
        const test = currentLine ? `${currentLine} ${w}` : w;
        if (ctx.measureText(test).width > maxRadiusWidth && currentLine) {
          lines.push(currentLine);
          currentLine = w;
        } else {
          currentLine = test;
        }
      });
      if (currentLine) lines.push(currentLine);

      // 5. Fit lines cleanly into slice arc height & radius width
      const maxAllowedLineHeight = maxArcHeight / (lines.length || 1);
      while (
        (fontSize > maxAllowedLineHeight || lines.some(l => ctx.measureText(l).width > maxRadiusWidth)) &&
        fontSize > 8
      ) {
        fontSize--;
        ctx.font = `${fontWeight} ${fontSize}px system-ui, -apple-system, sans-serif`;
      }

      const lineHeight = fontSize * 1.15;
      const startY = -((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, lineIdx) => {
        const yPos = startY + (lineIdx * lineHeight);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, textDistance, yPos);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line, textDistance, yPos);
      });

      ctx.restore();
    }

    // Winning slice highlight glow overlay
    if (this.winHighlightIndex >= 0 && this.winHighlightAlpha > 0) {
      const hlStart = this.rotationAngle + (this.winHighlightIndex * sliceAngle);
      const hlEnd = hlStart + sliceAngle;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, hlStart, hlEnd);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.3, this.winHighlightAlpha)})`;
      ctx.shadowColor = '#FFE600';
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.restore();
    }

    // Center Hub / Peg — Compact & sleek with strict text clearance
    const hubRadius = Math.max(18, Math.floor(size * 0.058));
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Center Icon / Title initials
    ctx.fillStyle = '#FFFFFF';
    const hubFontSize = Math.max(10, Math.floor(hubRadius * 0.48));
    ctx.font = `bold ${hubFontSize}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', centerX, centerY);
    ctx.restore();

    // Draw Pointer Spotlight Laser Beam onto incoming slice at 12 o'clock
    this.drawPointerBeam(centerX, 4, radius);

    // Top Pointer Arrow (positioned slightly away from wheel rim)
    this.drawPointer(centerX, 4);
  }

  drawPointerBeam(centerX, topY, radius) {
    const ctx = this.ctx;
    const pointerHeight = Math.max(18, Math.floor(this.size * 0.045));
    const tipY = topY + pointerHeight;
    const beamLength = radius * 0.65;
    const beamSpread = Math.max(14, Math.floor(this.size * 0.06));

    ctx.save();

    // Ultra-Sheer Non-Blocking Beam Glow (Bright spotlight sheen without covering text)
    const beamGrad = ctx.createLinearGradient(centerX, tipY, centerX, tipY + beamLength);
    beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.22)');     // Soft bright cyan tip at pointer
    beamGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.06)');   // Extremely sheer cone
    beamGrad.addColorStop(1, 'rgba(255, 46, 147, 0.0)');     // Transparent fade

    ctx.beginPath();
    ctx.moveTo(centerX, tipY);
    ctx.lineTo(centerX - beamSpread, tipY + beamLength);
    ctx.lineTo(centerX + beamSpread, tipY + beamLength);
    ctx.closePath();

    ctx.fillStyle = beamGrad;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 15;
    ctx.fill();

    // Soft Spotlight Beam Rim Edges
    ctx.beginPath();
    ctx.moveTo(centerX, tipY);
    ctx.lineTo(centerX - beamSpread, tipY + beamLength);
    ctx.moveTo(centerX, tipY);
    ctx.lineTo(centerX + beamSpread, tipY + beamLength);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  drawPointer(centerX, topY) {
    const ctx = this.ctx;
    const pointerWidth = Math.max(12, Math.floor(this.size * 0.038));
    const pointerHeight = Math.max(18, Math.floor(this.size * 0.045));

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX - pointerWidth, topY);
    ctx.lineTo(centerX + pointerWidth, topY);
    ctx.lineTo(centerX, topY + pointerHeight);
    ctx.closePath();

    ctx.fillStyle = '#FF2E93';
    ctx.shadowColor = '#FF2E93';
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  // Spin wheel to random target over specified duration (in seconds)
  spin(durationSeconds = 5, targetIndex = null, speedMultiplier = 1.0, easePower = 3.5, reverseDirection = false, enableThrusts = true) {
    if (this.isSpinning || this.options.length === 0) return Promise.reject();

    this.isSpinning = true;
    const direction = reverseDirection ? -1 : 1;
    this.spinDirection = direction;

    const numSlices = this.options.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    // Pick random target slice if not explicitly provided
    if (targetIndex === null || targetIndex < 0 || targetIndex >= numSlices) {
      // Use crypto.getRandomValues for true hardware randomness
      const randomBuffer = new Uint32Array(1);
      window.crypto.getRandomValues(randomBuffer);
      targetIndex = randomBuffer[0] % numSlices;
    }

    // Pointer is at Top (270 deg = 1.5 * Math.PI radians)
    const targetSliceAngle = (1.5 * Math.PI) - (targetIndex + 0.5) * sliceAngle;

    // Extra full spins for longer, dramatic, luxurious spin
    const extraRotations = (Math.floor(Math.random() * 4) + Math.round(8 * speedMultiplier)) * Math.PI * 2;
    
    // Calculate final target angle with direction support
    const currentMod = (this.rotationAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const startAngle = this.rotationAngle;

    let targetModAngle = (targetSliceAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    let delta = 0;
    if (direction === 1) {
      delta = extraRotations + ((targetModAngle - currentMod + Math.PI * 2) % (Math.PI * 2));
    } else {
      delta = -(extraRotations + ((currentMod - targetModAngle + Math.PI * 2) % (Math.PI * 2)));
    }
    const finalAngle = startAngle + delta;

    const startTime = performance.now();
    const durationMs = (durationSeconds * speedMultiplier) * 1000;
    let lastSliceCalculated = this.getWinningIndexAtAngle(this.rotationAngle);

    return new Promise((resolve) => {
      const animate = (now) => {
        const elapsed = now - startTime;
        const totalDuration = durationMs + this.extraDurationMs;
        const rawProgress = Math.min(1, elapsed / totalDuration);

        // Oiled Bearings Silky Smooth Easing (Zero Jerk, Zero Abrupt Stops)
        let oiledProgress = 0;
        if (rawProgress <= 0) {
          oiledProgress = 0;
        } else if (rawProgress >= 1) {
          oiledProgress = 1;
        } else if (rawProgress < 0.18) {
          const u = rawProgress / 0.18;
          oiledProgress = 0.06 * (6 * Math.pow(u, 5) - 15 * Math.pow(u, 4) + 10 * Math.pow(u, 3));
        } else {
          const u = (rawProgress - 0.18) / 0.82;
          const easeOutGlide = 1 - Math.pow(1 - u, 4.5);
          oiledProgress = 0.06 + 0.94 * easeOutGlide;
        }

        const currentFinalAngle = finalAngle + this.extraRotations;
        this.rotationAngle = startAngle + (currentFinalAngle - startAngle) * oiledProgress;

        // Check for slice boundary cross to trigger tick sound
        const currentSlice = this.getWinningIndexAtAngle(this.rotationAngle);
        if (currentSlice !== lastSliceCalculated) {
          lastSliceCalculated = currentSlice;
          if (this.onTickCallback) {
            const speedRatio = 1 - rawProgress;
            this.onTickCallback(speedRatio);
          }
        }

        this.draw();

        if (rawProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isSpinning = false;
          // Lock exact target slice directly as physical & textual winner
          const winningIndex = targetIndex;
          this.winHighlightIndex = winningIndex;
          this.winHighlightAlpha = 1.0;
          this.rotationAngle = targetSliceAngle;
          this.draw();
          this.triggerHighlightAnim();

          const winningSlice = this.options[winningIndex] || this.options[0];
          if (this.onCompleteCallback) {
            this.onCompleteCallback(winningSlice, winningIndex);
          }
          resolve({ winningSlice, index: winningIndex });
        }
      };

      requestAnimationFrame(animate);
    });
  }

  getWinningIndexAtAngle(angle) {
    const numSlices = this.options.length;
    if (numSlices === 0) return 0;
    const sliceAngle = (Math.PI * 2) / numSlices;
    
    // Top pointer is at 1.5 * Math.PI (270 deg)
    const normAngle = (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    let relativeAngle = (1.5 * Math.PI - normAngle) % (Math.PI * 2);
    while (relativeAngle < 0) relativeAngle += Math.PI * 2;

    const index = Math.floor((relativeAngle + 1e-6) / sliceAngle) % numSlices;
    return index;
  }
}
