# Multi-Wheel Spinner Game 🎡

A modern, highly customizable, and interactive Multi-Wheel Spinner web application built with HTML5 Canvas, Web Audio API, and Vanilla JavaScript.

## 🌟 Features

- **Multi-Wheel Configuration**: Switch seamlessly between **1, 2, or 3 active wheels** spinning simultaneously.
- **Custom Wheel Options**: Custom titles, unlimited custom items (line-separated editor), item shuffling, and quick slice option presets (e.g. *Truth or Dare*, *What to Eat*, *Decision Maker*, *Dice Roll*, *Team Challenges*).
- **Custom Spin Duration**: User-controlled duration slider (2s to 15s) with physics-based deceleration curves (`cubic-bezier` easing).
- **Procedural Music & Audio Engine**:
  - Web Audio API synthesizer for upbeat background music loop (Music ON/OFF toggle).
  - Cartoon Bubble Pops, Spring Boings, Duck Quacks/Honks, and comically pitched victory fanfares (**Funny Mode: ON/OFF** toggle).
  - Slice pointer tick sound FX on boundary hit (SFX ON/OFF toggle).
- **Hardware-Grade Randomness**: Cryptographically secure random selection (`window.crypto.getRandomValues`) for fair unbiased outcomes.
- **Visual Polish & Confetti**: Dark mode glassmorphism UI, high-DPI crisp Canvas wheel rendering with neon glow effects, LED-style animated rim dots, winning slice highlight glow, and celebratory particle confetti burst overlay.
- **Spin History Log**: Persistent scrollable log of all past spin results with timestamps.
- **LocalStorage Persistence**: Wheel configs, spin duration, and history survive page refreshes.
- **Fullscreen Mode**: Immersive fullscreen toggle for party play.
- **Keyboard Shortcut**: Press **Space** to spin wheels instantly.
- **Reset All**: One-click restore to default wheel configs.
- **Mobile Responsive**: Touch-optimized control targets for mobile devices (including Android 15 & iOS).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)

### Installation & Development
```powershell
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## 📝 Recent Changes & Updates
- Initial project creation with Vite + HTML5 Canvas + Web Audio API.
- Implemented `Wheel` class supporting dynamic slice angle calculation, glow borders, text wrapping, and pointer tick collision events.
- Created `SoundEngine` supporting Web Audio synthesizer BGM, tick sound FX, and victory arpeggios.
- Created `ParticleSystem` for celebratory particle burst explosions.
- Created custom options editor with tab support for Wheel 1, Wheel 2, and Wheel 3.
- Integrated quick preset dropdown loader for easy game setups.
- **Fixed Wheel Spin Bug**: Fixed string array initialization in `Wheel.setOptions()` ensuring string options automatically map to proper slice objects with colors and text.
- **Added Click-to-Spin**: Allowed direct click on any wheel canvas to spin wheels.
- **Doubled Wheel Size**: Increased maximum canvas wheel diameter from 420px to 800px with auto-scaling text, pointer, and center hub.
- **Dedicated Wheel 1 & Wheel 2 Customization**: Streamlined mode focused on Wheel 1 & Wheel 2 options with dedicated tab editors.
- **Enhanced Option Labels & Display**: Added high-contrast text outlines (extra bold font + dark stroke) directly on canvas slices, plus interactive option tag chips under each wheel card showing all active choices at a glance.
- **Independent Asynchronous Wheel Speeds**: Wheel 1 and Wheel 2 now spin at different speeds and physics deceleration curves (Wheel 1 finishes earlier with snappy deceleration; Wheel 2 spins longer with a dramatic suspenseful slowdown).
- **Fixed Canvas Scaling & Slice Text Visibility**: Fixed CSS wrapper height calculations (`min-height: 440px`) so wheels fill the entire container card, preventing the center hub from obscuring slice text labels.
- **Fixed Top Pointer Result Alignment**: Fixed the spin target math (`1.5 * Math.PI` pointer alignment) and dynamically computed winning slice directly from the physical landing angle, ensuring 100% accuracy between the slice pointing at the top needle and the winner modal result.
- **Untruncated Full Text on Slices**: Replaced text trimming (`...`) with intelligent multi-line word wrapping and dynamic font scaling, ensuring 100% full option text is rendered on every slice.
- **Non-blocking Floating Result Banner (5-second auto-close)**: Sleek floating result banner in the top-right corner. Automatically closes after 5 seconds or via manual `✕` button.
- **Main Area Option Elimination Controls**: Added `🗑️ Remove Landed Options` button directly on the main control bar and a `🔄 Auto-Remove: ON/OFF` toggle switch for automatic elimination of landed options right on the main screen without any popup required.
- **Fixed Listener Error & Added Null Guards**: Removed obsolete button references and wrapped all DOM listener attachments in fail-safe null guards across `setupEventListeners()`.

### v2.0 – "Working, Awesome & Practical" Update 🚀
- **3-Wheel Support**: Added 3rd wheel option with dedicated tab, layout, and independent spin physics profile.
- **Spin History Panel**: Scrollable log of all past spin results with spin number, result chips, and timestamps.
- **LocalStorage Persistence**: Wheel configs, spin duration, active wheel count, and spin history now persist across browser sessions.
- **Fullscreen Mode**: Toggle button in header for immersive party/presentation mode using the Fullscreen API.
- **Keyboard Shortcut**: Press `Space` to spin (disabled when typing in input fields).
- **Reset All**: One-click button to restore all wheel configs to defaults.
- **LED-Style Rim Dots**: 24 animated pulsing LED dots around each wheel rim alternating pink/cyan for a game-show effect.
- **Winning Slice Highlight Glow**: After spin lands, the winning slice gets a glowing golden highlight that fades out.
- **Winner Badge Animation**: Result badges now bounce in with a spring animation when results land.
- **Spin Button Pulse Animation**: The SPIN button pulses with a glowing animation when idle to attract attention.
- **Animated Background Gradient**: Subtle slow-moving gradient shift on the page background for a lively feel.
- **Wheel Card Hover Effect**: Cards lift and glow on hover.
- **Improved Mobile Responsive**: Better wrapping, icon-only buttons on small screens, stacked grid layouts on mobile, and 480px breakpoint for tiny screens.
- **Toast Duration Increase**: Result toast auto-close increased from 3s to 5s for better readability.
- **Render Deployment Blueprint**: Added `render.yaml` for instant free static site hosting on Render.

---

## 🌐 Deploying to Render.com

1. Sign in to [Render.com](https://dashboard.render.com/).
2. Click **New +** -> **Static Site**.
3. Connect your GitHub repository `gauravpz/GPGames`.
4. Render will auto-detect settings from `render.yaml` or set manually:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
5. Click **Create Static Site** — your live URL will be ready in seconds!

