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

    this.colorPalette = [
      '#FF2E93', '#7000FF', '#00F0FF', '#00FF66',
      '#FFE600', '#FF8A00', '#FF0055', '#A000FF',
      '#00D2FF', '#39FF14', '#FFD700', '#FF4500'
    ];

    this.setOptions(options.length > 0 ? options : this.getDefaultOptions());

    this.canvas.addEventListener('click', () => {
      if (this.onClickCallback) {
        this.onClickCallback(this);
      }
    });

    // Start LED animation loop
    this._animateLEDs();

    this.resize();
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
    this.draw();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const w = rect.width > 100 ? rect.width : 450;
    const h = rect.height > 100 ? rect.height : w;
    const size = Math.min(w, h, 650);
    const dpr = window.devicePixelRatio || 1;

    this.size = size;
    this.canvas.width = Math.floor(size * dpr);
    this.canvas.height = Math.floor(size * dpr);
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;

    this.draw();
  }

  _animateLEDs() {
    this.ledPhase += 0.06;
    if (this.winHighlightAlpha > 0) {
      this.winHighlightAlpha -= 0.008;
    }
    if (!this.isSpinning) {
      this.draw();
    }
    requestAnimationFrame(() => this._animateLEDs());
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
    const radius = (size / 2) - 16;
    const numSlices = Math.max(1, this.options.length);
    const sliceAngle = (Math.PI * 2) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Outer Neon Glow Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1b4b';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.restore();

    // LED-style rim dots
    const numLEDs = 24;
    for (let i = 0; i < numLEDs; i++) {
      const ledAngle = (i / numLEDs) * Math.PI * 2 + this.ledPhase;
      const ledX = centerX + Math.cos(ledAngle) * (radius + 3);
      const ledY = centerY + Math.sin(ledAngle) * (radius + 3);
      const brightness = 0.4 + 0.6 * Math.abs(Math.sin(this.ledPhase * 2 + i * 0.6));
      const ledColor = i % 2 === 0 ? `rgba(255, 46, 147, ${brightness})` : `rgba(0, 240, 255, ${brightness})`;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(ledX, ledY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = ledColor;
      ctx.shadowColor = ledColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

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

      // Text label inside slice - Multi-line word wrapping for FULL untruncated text!
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Base font size calculation
      let fontSize = Math.max(12, Math.min(24, Math.floor(radius / (numSlices > 10 ? 7 : 5.5))));
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;

      const maxRadiusWidth = radius * 0.65;
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

      // If single long line exceeds width, scale down font size so full text fits
      while (lines.some(l => ctx.measureText(l).width > maxRadiusWidth) && fontSize > 9) {
        fontSize--;
        ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
      }

      const lineHeight = fontSize * 1.1;
      const startY = -((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, lineIdx) => {
        const yPos = startY + (lineIdx * lineHeight);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, radius - 18, yPos);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line, radius - 18, yPos);
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

    // Center Hub / Peg
    const hubRadius = Math.max(22, Math.floor(size * 0.075));
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Center Icon / Title initials
    ctx.fillStyle = '#FFFFFF';
    const hubFontSize = Math.max(11, Math.floor(hubRadius * 0.5));
    ctx.font = `bold ${hubFontSize}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', centerX, centerY);
    ctx.restore();

    // Top Pointer Arrow (positioned at 12 o'clock)
    this.drawPointer(centerX, 8);
  }

  drawPointer(centerX, topY) {
    const ctx = this.ctx;
    const pointerWidth = Math.max(16, Math.floor(this.size * 0.05));
    const pointerHeight = Math.max(30, Math.floor(this.size * 0.08));

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX - pointerWidth, topY);
    ctx.lineTo(centerX + pointerWidth, topY);
    ctx.lineTo(centerX, topY + pointerHeight);
    ctx.closePath();

    ctx.fillStyle = '#FF2E93';
    ctx.shadowColor = '#FF2E93';
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  // Spin wheel to random target over specified duration (in seconds)
  spin(durationSeconds = 5, targetIndex = null, speedMultiplier = 1.0, easePower = 3.5, reverseDirection = false, enableThrusts = true) {
    if (this.isSpinning || this.options.length === 0) return Promise.reject();

    this.isSpinning = true;
    const numSlices = this.options.length;
    const sliceAngle = (Math.PI * 2) / numSlices;
    const direction = reverseDirection ? -1 : 1;

    // Pick random target slice if not explicitly provided
    if (targetIndex === null || targetIndex < 0 || targetIndex >= numSlices) {
      // Use crypto.getRandomValues for true hardware randomness
      const randomBuffer = new Uint32Array(1);
      window.crypto.getRandomValues(randomBuffer);
      targetIndex = randomBuffer[0] % numSlices;
    }

    // Pointer is at Top (270 deg = 1.5 * Math.PI radians)
    const targetSliceAngle = (1.5 * Math.PI) - (targetIndex + 0.5) * sliceAngle;

    // Minimum full spins vary per wheel speed multiplier
    const extraRotations = (Math.floor(Math.random() * 3) + Math.round(5 * speedMultiplier)) * Math.PI * 2;
    
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

    // 3 to 4 mid-spin thrust timestamps (surges when speed drops)
    const thrustTimes = enableThrusts ? [0.38, 0.58, 0.74, 0.86] : [];
    const thrustBoosts = [0.065, 0.048, 0.035, 0.022];
    const thrustTriggered = [false, false, false, false];

    return new Promise((resolve) => {
      const animate = (now) => {
        const elapsed = now - startTime;
        const rawProgress = Math.min(1, elapsed / durationMs);

        // Apply 3-4 mid-spin speed thrust surges as speed drops
        let effectiveProgress = rawProgress;
        if (enableThrusts) {
          for (let tIdx = 0; tIdx < thrustTimes.length; tIdx++) {
            if (rawProgress >= thrustTimes[tIdx]) {
              const dt = rawProgress - thrustTimes[tIdx];
              const surge = Math.sin(Math.min(Math.PI, dt * 7.5)) * thrustBoosts[tIdx];
              effectiveProgress += surge;

              if (!thrustTriggered[tIdx]) {
                thrustTriggered[tIdx] = true;
                if (this.onThrustCallback) {
                  this.onThrustCallback(tIdx);
                }
              }
            }
          }
        }

        // Custom ease-out deceleration curve per wheel
        const easeOut = 1 - Math.pow(1 - Math.min(1, effectiveProgress), easePower);
        this.rotationAngle = startAngle + (finalAngle - startAngle) * easeOut;

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
          // Trigger winning slice highlight
          this.winHighlightIndex = this.getWinningIndexAtAngle(finalAngle);
          this.winHighlightAlpha = 1.0;
          this.rotationAngle = finalAngle;
          this.draw();

          // Calculate exact winning slice directly from the physical landing angle
          const winningIndex = this.getWinningIndexAtAngle(this.rotationAngle);
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
    let relativeAngle = (1.5 * Math.PI - (angle % (Math.PI * 2))) % (Math.PI * 2);
    while (relativeAngle < 0) relativeAngle += Math.PI * 2;

    const index = Math.floor(relativeAngle / sliceAngle) % numSlices;
    return index;
  }
}
