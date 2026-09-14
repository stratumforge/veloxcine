# Chrome Web Store Listing & Compliance Document

**Product Name:** VeloxCine™: Universal Streaming, Subtitle & Aspect Suite  
**Developer / Studio:** StratumForge Labs™  
**Manifest Version:** 3  
**Current Release Version:** 1.0.0  
**Target Category:** Productivity / Photos, Video & Audio  
**Primary Language:** English  

---

## 1. Store Listing Copy

### Single-Sentence Summary (Max 132 characters)
> Universal streaming controller: 16x ad-warp, drag-and-drop subtitle repositioning, 21:9 ultrawide aspect zoom, and custom SRT/VTT loader.

### Detailed Description (Markdown format for Developer Dashboard)

**VeloxCine™ by StratumForge Labs™ elevates your streaming experience across Netflix, Amazon Prime Video, Disney+ Hotstar, Apple TV+, and open HTML5 video players.**

Tired of blinding white subtitles on OLED/HDR screens? Frustrated by black bars on your ultrawide monitor? Tired of slow commercial ads on ad-supported tiers? VeloxCine gives you complete control over your viewing experience.

### 🌟 Key Features

#### ⚡ Hyper-Warp Ad-Skipper
* Automatically accelerates commercial ad segments to 16.0x playback speed.
* Silently auto-mutes ad breaks and auto-clicks "Skip Ad" buttons in under 50 milliseconds.
* Instantly restores normal playback speed (1.0x) and your preferred audio level when your content resumes.

#### 🎯 Freeform Drag-and-Drop Subtitle Positioning
* Grab and position subtitles anywhere on screen with interactive visual guides.
* One-click presets: *Bottom-Center, Top-Center, Bottom Black Bar, Top Black Bar*.
* **HDR / OLED Subtitle Dimmer (0%–100%):** Dim bright subtitles during dark nighttime viewing to eliminate eye strain.
* Full custom styling: adjust font size, color palette, text shadows/outlines, and background opacity.

#### 📁 External Subtitle (.SRT / .VTT) Injector
* Drag and drop any custom foreign subtitle file directly into the video player.
* Microsecond synchronization with a dedicated audio delay adjustment slider (-5.0s to +5.0s).

#### 🖥️ 21:9 Ultrawide & Black Bar Eliminator
* Eliminate letterbox black bars on 2.39:1 movies or pillarbox bars on 21:9 ultrawide monitors.
* Quick hotkey toggle (**Z**) cycles between *Original, 21:9 Ultrawide Fill, 16:9 Fill, Stretch, and Custom Pan & Zoom (100%–175%)*.

#### ✨ GPU Super-Resolution & 600% Dialogue Audio Booster
* Real-time contrast and sharpening matrix filters to make 1080p video look crisp on 2K and 4K displays.
* Speech dialogue boost up to 600% for whisper-quiet movie dialogue.

---

## 2. Permissions Justifications (Required for Manifest V3 Review)

| Permission | Technical Need | Plain-English Review Justification |
| :--- | :--- | :--- |
| `storage` | `chrome.storage.local` | Saves user preferences (aspect ratio presets, subtitle font choices, dimmer values, and platform profiles) locally and offline. |
| `tabs` | `chrome.tabs.query` | Detects the active streaming tab to display connection status in the popup controller and route keyboard shortcuts (`H`, `Z`). |
| `scripting` | `chrome.scripting` | Injects the floating HUD overlay and video styling transform rules into the active streaming video frame. |
| `identity` | `chrome.identity` | Reads the user's signed-in Google account email to securely verify their lifetime purchase license without requiring third-party logins. |

### Host Permissions Justification

* `*://*.netflix.com/*`: Injects the subtitle repositioning engine and controls into the Netflix web player.
* `*://*.primevideo.com/*` & `*://*.amazon.com/*`: Injects controls into Amazon Prime Video web player.
* `*://*.hotstar.com/*`: Injects controls into Disney+ Hotstar web player.
* `*://*.apple.com/*` & `*://*.tv.apple.com/*`: Injects controls into Apple TV+ web player.
* `*://*.youtube.com/*`: Injects controls and aspect ratio adjustments for YouTube.
* `<all_urls>`: Allows users to run VeloxCine on custom HTML5 video hosts and the included testing playground.

---

## 3. Privacy & Data Use Disclosure

* **Does VeloxCine collect personally identifiable information?**  
  No personal data, browsing history, keystrokes, or media watch history is ever collected, stored, or sold to third parties.
* **How is the user's Gmail used?**  
  The Google account email accessed via `chrome.identity` is used exclusively as a unique cryptographic identifier to verify active Lifetime Premium purchase entitlements.
* **External Servers:**  
  VeloxCine does not send video stream data or media segments to external servers. All transforms, subtitle rendering, and aspect adjustments occur strictly within the client's local browser instance.

---

## 4. Version History

* **v1.0.0 (Initial Release - StratumForge Labs™):**
  * Full Manifest V3 production architecture.
  * In-page glassmorphism HUD overlay with keyboard shortcut triggers (`H`, `Z`).
  * 16x Hyper-Warp ad detection with auto-mute and instant skip button clicker.
  * Draggable subtitle anchor HUD with HDR dimmer, custom fonts, and colors.
  * External .srt and .vtt file parser and synchronizer.
  * 21:9 Ultrawide and 16:9 black bar removal engine.
  * Free vs Lifetime Premium tier gating and Developer testing toggle.
  * Built-in interactive testing playground.
