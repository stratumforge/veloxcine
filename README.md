# VeloxCine™: Universal Streaming, Subtitle & Aspect Suite
**Created by StratumForge Labs™**

VeloxCine™ is an all-in-one browser extension (Manifest V3) for streaming platforms (Netflix, Amazon Prime Video, Disney+ Hotstar, Apple TV+, and open HTML5 video) that gives viewers total control over playback speed, ad-skipping, subtitle styling, black bar elimination, and video upscaling.

---

## 🌟 Core Features

* **⚡ 16x Hyper-Warp Ad-Skipper:** Automatically speeds up commercial ad breaks to 16.0x, mutes them silently, and auto-clicks "Skip Ad" buttons in milliseconds.
* **🎯 Freeform Drag-and-Drop Subtitles:** Position subtitles anywhere on screen or in the black bars outside the video frame.
* **💡 OLED / HDR Subtitle Dimmer (0%–100%):** Dims bright white subtitles in dark scenes to eliminate eye fatigue.
* **📁 External Subtitle (.SRT / .VTT) Injector:** Drag and drop custom subtitle files directly into any streaming video with microsecond audio sync.
* **🖥️ 21:9 Ultrawide & Aspect Ratio Suite:** Eliminate letterbox and pillarbox black bars with 21:9 Ultrawide, 16:9 Fill, Stretch, and Custom Pan & Zoom (100%–175%).
* **✨ GPU Super-Resolution Sharpening Shader:** Boosts contrast and sharpness so 1080p content looks crisp on 2K/4K monitors.
* **🔊 600% Audio Dialogue Booster:** Amplifies whisper-quiet movie dialogue via Web Audio gain processing.
* **💎 Free & Lifetime Premium Tiers:** Monetized via a one-time fee linked to the user's Gmail account, with built-in Developer Mock toggling for QA.

---

## 🚀 How to Install in Google Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the project directory:
   `F:\AI projects\VeloxCine`
5. The **VeloxCine™** icon will appear in your Chrome toolbar!

---

## 🧪 How to Test in the Interactive Playground

1. Click the VeloxCine icon in your Chrome toolbar and select **"Launch Interactive Test Playground"** (or open `test-playground/index.html` directly in your browser).
2. **Test 16x Ad-Warp:** Click **"⚡ Trigger Simulated Ad Break"** — watch VeloxCine automatically warp the video speed to 16.0x, mute the audio, and auto-click the Skip button.
3. **Test Black Bar Removal:** Press **`Z`** or click **21:9 Ultrawide** / **16:9 Fill** to see black bars disappear instantly.
4. **Test Draggable Subtitles:** Click and drag the subtitle anchor box anywhere across the video.
5. **Test Subtitle Dimmer:** Open the HUD (**`H`**), switch to the Subtitles tab, and slide the Dimmer from 100% down to 30%.
6. **Test External Subtitle Loading:** Click **"Download Sample .SRT"**, then drag-and-drop the downloaded file into the HUD dropzone.
7. **Test Free vs. Premium Gating:** Open the popup or HUD and toggle the **Developer Mock Tier** switch to verify feature gates.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`H`** (or `Ctrl+Shift+H`) | Toggle In-Page Glassmorphism HUD Overlay |
| **`Z`** (or `Ctrl+Shift+Z`) | Cycle Aspect Ratio / Eliminate Black Bars |
| **`Ctrl+Shift+D`** | Quick Toggle Subtitle Dimmer |

---

## 📁 Repository Structure

```
veloxcine/
├── manifest.json                  # Manifest V3 configuration
├── CHROMEWEBSTORE.md              # Chrome Web Store listing & review justifications
├── README.md                      # Setup and usage guide
├── icons/                         # 16x16, 48x48, 128x128 icons
├── core/
│   └── licensing.js               # Gmail identity, entitlement & dev mock engine
├── content/
│   ├── content.js                 # Universal video detector, ad-warp & subtitle engine
│   └── overlay.css                # Glassmorphism HUD & subtitle styling
├── popup/
│   ├── popup.html                 # Extension popup dashboard
│   ├── popup.css                  # Popup dark-mode styles
│   └── popup.js                   # Popup controller & platform profile sync
├── test-playground/
│   ├── index.html                 # Interactive simulation sandbox
│   ├── playground.js              # Real-time diagnostics & ad simulator
│   └── sample-cues.vtt            # WebVTT test subtitle track
└── docs/
    └── android-firetv-architecture.md  # Phase 2 Android TV / Fire TV APK blueprint
```
