# Multi-Wheel Spinner Game 🎡

A modern, highly customizable Multi-Wheel Spinner web app — plus native **Android TV** and **Android Mobile (Cast to TV)** apps.

| App | File | Target |
|---|---|---|
| 🌐 Web App | `dist/` | Browser (Render.com) |
| 📺 Android TV | `android-tv/` → `SpinVerse-TV-MiTV4L.apk` | MiTV4L, Android 9 |
| 📱 Android Mobile | `android-mobile/` → `SpinVerse-Mobile-Cast.apk` | Android 15, casts to MiTV4L |

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

- **💃 Freeze Dance Party Video Game (NEW 4th GAME)**: Added a brand new 4th game mode featuring an almost full-screen embedded YouTube video player (`height: clamp(520px, 75vh, 750px)`), automatic random YouTube video play/pause engine (plays for 4s-9s, freezes for 3s-8s randomly), animated **`FROZEN! 🧊`** video overlay card, referee whistle SFX, voice prompts ("Freeze!", "Dance!"), custom URL loader, and quick party song presets.
- **StartGames.bat Batch Script**: Created Windows launcher script (`StartGames.bat`) to automatically launch the local Vite development server (`npm run dev`) with one click.
- **Musical Chairs Visual Freeze Dance & Grand Oval Arena**: Implemented random music play/pause intervals with visual **Ice Statue Freeze Poses (`🧊 FREEZE!`)** for animal avatars (lion, panda, fox, tiger, frog, etc.), 50% relaxed walking speed, YouTube default track, 5s auto-start round timer, and screen-filling **Grand Oval Arena Track**.
- **Sky Bird Paper Removal Feature**: Added option removal controls for **Sky Bird Paper Picker** game, including direct `🗑️ Remove Winner` action button upon bird reveal, `🔄 Auto-Remove: ON/OFF` toggle, and live name chips with `✕` removal buttons. Automatically syncs options list over `SpinBridge` to the TV.
- **Arcade TV Casting Support**: Added full TV projection/casting mirroring support for **Sky Bird Paper Picker** and **Musical Chairs & Freeze Dance** games, enabling tab switching, configurations, and game state updates to sync seamlessly over `SpinBridge`.
- Initial project creation with Vite + HTML5 Canvas + Web Audio API.
- Implemented `Wheel` class supporting dynamic slice angle calculation, glow borders, text wrapping, and pointer tick collision events.
- Created `SoundEngine` supporting Web Audio synthesizer BGM, tick sound FX, and victory arpeggios.
- Created `ParticleSystem` for celebratory particle burst explosions.
- Created custom options editor with tab support for Wheel 1, Wheel 2, and Wheel 3.
- Integrated quick preset dropdown loader for easy game setups.
- **Fixed Wheel Spin Bug**: Fixed string array initialization in `Wheel.setOptions()` ensuring string options automatically map to proper slice objects with colors and text.
- **Oiled Bearings Silky Smooth Physics**: Implemented C2-continuous quintic S-curve easing (`Slow Acceleration` → `High-Speed Glide` → `Whisper-Soft Deceleration`) with zero derivative jerk and zero sudden stops, giving both Wheels and 3D Bubbles a magnetic, lubricated bearing feel.
- **Instant 0ms Touch Response**: Added `addFastTouch` pointerdown event handlers to all top controls (`Cast to TV`, `Mode Toggle`, `TV Mode`, `Fullscreen`, `Reset All`, `Funny Mode`, `Music`, `SFX`) for instant touch activation on mobile devices.
- **Persistent Custom Names & Activities**: Replaced generic `'Player 1'` placeholders with real family/player names (`Gaurav`, `Madhu`, `Papa`, `Mama`, `Dadi`, `Dadaji`, `Pappu`, `Chhakka`, `12`), automatically persisted in local flash storage so custom entries stay active across app launches until explicitly changed.
- **Fixed Canvas Scaling & Slice Text Visibility**: Fixed CSS wrapper height calculations (`min-height: 440px`) so wheels fill the entire container card, preventing the center hub from obscuring slice text labels.
- **Fixed Top Pointer Result Alignment**: Fixed the spin target math (`1.5 * Math.PI` pointer alignment) and dynamically computed winning slice directly from the physical landing angle, ensuring 100% accuracy between the slice pointing at the top needle and the winner modal result.
- **Untruncated Full Text on Slices**: Replaced text trimming (`...`) with intelligent multi-line word wrapping and dynamic font scaling, ensuring 100% full option text is rendered on every slice.
- **Non-blocking Floating Result Banner (5-second auto-close)**: Sleek floating result banner in the top-right corner. Automatically closes after 5 seconds or via manual `✕` button.
- **Main Area Option Elimination Controls**: Added `🗑️ Remove Landed Options` button directly on the main control bar and a `🔄 Auto-Remove: ON/OFF` toggle switch for automatic elimination of landed options right on the main screen without any popup required.
- **Fixed Listener Error & Added Null Guards**: Removed obsolete button references and wrapped all DOM listener attachments in fail-safe null guards across `setupEventListeners()`.
- **v3.1 — Performance, Pointer Synchronization & TV Music Fixes**:
  - **Fixed 3-5 Minute Casting Freeze**: Added `destroy()` lifecycle management to `Wheel` and `BubbleWheel` classes to terminate orphaned `requestAnimationFrame` loops on wheel re-creation/config updates. Paused hidden phone wheel canvas rendering when in Cast Controller mode, and eliminated heavy continuous GPU `shadowBlur` bottlenecks to ensure zero thermal throttling or webview hanging during extended casting sessions.
  - **Fixed Pointer vs Winner Text Desync**: Synchronized target slice indices over `SpinBridge` between Phone and TV Presentation display so both screens land on 100% identical physical slice angles. Fixed schema mismatch (`winningSlice`) in `BubbleWheel`, normalized angle modulo math, and locked exact target index to visual top needle position.
  - **Fixed TV Casting Music**: Added `syncAudioState()` to automatically transfer BGM and SFX state (`bgmMuted`, `sfxMuted`, `funnyMode`) over `SpinBridge` to the TV presentation WebView, and automatically initialized/resumed Web Audio synth BGM playback on TV load.
  - **Fixed Option Elimination**: Updated `removeLandedOptions()` to eliminate landed options from Wheel 1 as default while keeping Wheel 2 tasks intact across spins. Fixed slice angle re-alignment and badge state so that when an option (like `Pappu`) is removed, the wheel realigns slice 0 under the top needle and the badge updates to `🗑️ "Pappu" removed!` instead of showing a mismatched winner.
  - **Auto-Split Single Line Options**: Added `parseOptionLines()` helper so single-line option entries (separated by commas `,`, slashes `/`, pipes `|`, semicolons `;`, or multiple spaces) automatically split and spread cleanly across separate lines upon saving or starting.
  - **35% / 65% Side-by-Side Dual-Wheel Layout**: Configured `.wheels-grid.layout-2` with a 35% width column for Wheel 1 (Player list) and a 65% width column for Wheel 2 (Action / Task list) sitting side-by-side with zero overlap, giving Wheel 2 massive space for multi-word task options.
  - **Camera Punch-Hole Safe Header**: Reduced header logo size (`font-size: 1.15rem`) and added `env(safe-area-inset-top)` padding so app title never overlaps or hides behind top camera cutouts or status bars on modern devices.
  - **Interactive Mid-Spin Touch Thrust**: Added `addThrust()` physics to `Wheel` and `BubbleWheel`. Touching a specific spinning wheel dynamically boosts its velocity and extends spin duration with audio feedback, allowing users to tap repeatedly to keep only that wheel spinning until they stop tapping and it decelerates smoothly to a standstill on its own.
  - **Preserve Given & Saved Options on Reset All**: Updated `resetAll()` in `src/main.js` so that pressing "Reset All" restores any temporarily eliminated options back to the wheels without wiping out custom user-entered options.
  - **Removed Bubble Mode**: Completely cleaned up and removed the unused 3D Bubble Mode toggle button and `bubbleMode.js` source code to keep the UI clean, fast, and focused on multi-wheel spinning.
  - **10-Hour Extended Performance & TV Sync**: Added `osc.onended` Web Audio node cleanup to eliminate node accumulation, ensured flat memory footprint (~2MB) across extended casting sessions, and exported both TV and Mobile APKs directly to `D:\` (`D:\spinverse-tv.apk` and `D:\spinverse-mobile.apk`).
  - **Removed Funny Mode**: Completely removed Funny Mode toggles, quack, and cartoon boing sounds. Restored clean, crisp, professional tick sound FX for all slice boundaries and spin thrusts.
  - **Fixed Phone Wheel Visibility**: Guaranteed wheels remain 100% visible, interactive, and spinnable on the phone display at all times.
  - **Radial Outward Text & Pointer Clearance**: Set `textDistance = radius - 32` so the 12 o'clock needle pointer never overlaps any slice text. Aligned all slice text in one unified outward radial direction from center to rim.
  - **Fixed Touch Spin Physics**: Fixed unassigned direction variable in `Wheel.spin()` so touching any wheel or clicking "SPIN WHEELS!" immediately launches all wheels into silky smooth motion.
  - **Strict Central Circle Clearance**: Reduced center hub size and enforced dynamic `maxRadiusWidth = textDistance - (hubRadius + 14)` bound so slice names NEVER hide behind or touch the center `SPIN` circle.
  - **Game Arcade Launcher**: Added top Game Arcade navigation bar allowing users to switch seamlessly between **🎡 SpinVerse Wheels** and **🕊️ Sky Bird Paper Picker**.
  - **Custom Mobile Launcher Icon**: Designed and created a high-resolution dark neon adaptive vector icon (`ic_launcher_background.xml` & `ic_launcher_foreground.xml`) featuring a glowing 6-slice neon wheel, golden pointer needle, and flying carrier bird silhouette.

  - **Musical Chairs & Freeze Dance Game Mode (`musicalChairs.js`)**: Integrated complete party game with 2D dancing avatars circle, chair ring arrangement, random timer music stop, sharp referee whistle SFX, and automated standing player elimination.
  - **YouTube Music Player & Built-in Synth Support**: Added dual audio source toggle allowing players to stream any YouTube video/song link (e.g. *Frozen Let It Go*, *Baby Shark*, *Party Mix*) or use the built-in procedural Web Audio synth. When music stops, YouTube video pauses instantly in sync with referee whistle!

- **YouTube Link Music Embed in Musical Chairs**: Players can now paste any custom YouTube video link or select quick party presets (*Frozen*, *Baby Shark*, *Party Rock Anthem*, *Gummy Bear*). The embedded video streams in a floating mini stage window and automatically **pauses/plays in 0ms sync** with referee freeze whistles!
- **Hilarious Comedy Carrier Bird Routines**: The bird now performs hilarious procedural comedy routines before swooping down:
  - **Loud Sneeze (`loud_sneeze`)**: Gasps (*"Aaaah..."*) and sneezes loudly (*"ACHOOO!! 🤧💥"*), playing a comical sneeze sound FX and blowing all papers swirling across the stage!
  - **Poo Drop (`poo_drop`)**: Tail wiggle with a funny plop sound (*"Oops! Nature calls! 💩"*), dropping a falling poop emoji particle to the floor!
  - **Fruit Tree Snack (`tree_fruit_snack`)**: Flies over to the mini Fruit Tree, pecks cherries (*"Munch munch! 🍒😋"*), and wipes her beak!
  - **Party Shimmy & Somersault**: Disco sunglasses shimmy (*"Party Shimmy! 🕶️💃"*) and triple flip somersaults (*"Crazy Somersault! 🤸⚡"*).
- **Animated Stand Fan & Fruit Tree**: Added a 2D metallic Stand Fan with spinning blades, oscillating head, and wind stream trails, plus a mini Fruit Tree with apples/cherries on stage.
- **Unified Global Player List**: Wheel 1's player list (`Gaurav`, `Madhu`, `Papa`, `Mama`, etc.) now automatically syncs across **all three games** (**SpinVerse Wheels**, **Sky Bird Paper Picker**, and **Musical Chairs & Freeze Dance**)!
- **3D Aerodynamic Flying Paper Physics**: Realistic leaf-flutter physics with 3D depth roll angles, wind vortex lift forces, aerodynamic tilt gliding, and ground drop shadows.
- **Web Speech Synthesis (Text-to-Speech Announcer)**: Added native `window.speechSynthesis` voice announcer engine with header toggle (`🗣️ Voice: ON/OFF`). Automatically speaks winning slice results, carrier bird picks, sneeze reactions, and musical chairs eliminations out loud!
- **Wheel Theme Selector**: Choose between **Neon Cyber**, **Rainbow Carnival**, **Golden Luxury**, and **Pastel Dream** slice color schemes dynamically.
- **Musical Chairs Stage & Announcer**: Added TTS voice warnings on player freeze/elimination (*"Freeze! Namith was left standing!"*) and champion crowning (*"Gaurav is the Musical Chairs Champion!"*).

### v4.0 – "SpinVerse Party Games Arcade" Update 🎮

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
- **3-4 Mid-Spin Speed Thrusts / Boosts**: As each wheel decelerates, 3 to 4 mid-spin thrust surges kick in to dynamically boost rotation velocity with audio thrust feedback!
- **Reverse Spin Option**: Toggle switch (`↺ Reverse: ON/OFF`) allows wheels to spin counter-clockwise with exact needle landing calculation.
- **📺 TV Projection Mode**: One-click **`📺 TV Mode`** button in header optimizes layout, hides configuration inputs, scales wheels up to giant high-definition TV sizes (520px+ canvas height), increases typography for 15ft living room viewing, and triggers fullscreen automatically for Chromecast/TV casting!
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

---

## 📺 Android TV App (MiTV4L / Android 9)

A native Android TV APK is available in the `android-tv/` folder. It wraps the web app in a WebView optimized for 1080p TV screens with remote control support.

### Target
| Property | Value |
|---|---|
| Device | Xiaomi MiTV4L |
| Android | 9 (API 28) |
| Kernel | 4.9.113 |
| Input | D-pad TV remote |

### TV UX Flow
1. **Launch** → Full-screen **Setup Overlay** appears
2. **Enter options** for each wheel via TV keyboard (remote opens on-screen keyboard)
3. **Wheel 3 is optional** — leave empty for 2-wheel mode
4. **Tap/select "START SPINNING!"** → Wheels fill the entire screen, no scrolling
5. **D-pad OK / Enter** → Spins all wheels
6. **Back button** → Exit confirmation dialog

### Build & Sideload (PowerShell)
```powershell
# 1. Build the web app
npm run build

# 2. Sync dist → Android assets
Remove-Item -Recurse -Force android-tv\app\src\main\assets\*
Copy-Item -Recurse -Force dist\* android-tv\app\src\main\assets\

# 3. Build the APK
cd android-tv
.\gradlew.bat assembleDebug

# 4. Deploy to MiTV4L (connect via USB or same Wi-Fi + ADB over TCP/IP)
adb connect <MiTV4L_IP>:5555
adb install app\build\outputs\apk\debug\app-debug.apk
```

### v3.0 — Android TV Port
- **Android TV WebView App**: Wraps HTML5 Canvas app in a fullscreen `Activity` — no Compose, no Leanback library
- **No-Scroll Fullscreen Wheels**: `body.tv-mode` CSS locks `overflow: hidden`, wheels use CSS flexbox `flex: 1` to fill 100vh
- **TV Setup Overlay**: Full-screen input screen shown at launch — collect wheel items before spinning
- **Smart WebView Detection**: `activateTVSetup()` in `main.js` detects Android WebView via UA string or `window.TVBridge` bridge
- **D-pad Remote Control**: DPAD_CENTER/Enter → Spin wheels; Back → Exit dialog; Play/Pause → Spin
- **System Font Fallback**: Roboto/system-ui used in place of Google Fonts CDN (unavailable offline)
- **TV Banner**: 320×180px launcher banner for Android TV home screen
- **Target API 28**: Matches MiTV4L Android 9 exactly; `minSdk 26`

