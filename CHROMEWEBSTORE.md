# Chrome Web Store Listing & Compliance Document

**Product Name:** VeloxCine: Universal Streaming, Subtitle & Aspect Suite  
**Developer / Studio:** StratumForge Labs  
**Support Email:** forgestratum@gmail.com  
**Manifest Version:** 3  
**Current Release Version:** 1.0.0  
**Target Category:** Productivity / Photos, Video & Audio  
**Primary Language:** English  

---

## 1. Store Listing Copy

### Single-Sentence Summary (Max 132 characters)
> Universal streaming controller: 16x ad-warp, drag-and-drop subtitle repositioning, 21:9 ultrawide aspect zoom, and custom SRT/VTT loader.

### Detailed Description (Markdown format for Developer Dashboard)

**VeloxCine by StratumForge Labs elevates your streaming experience across Netflix, Amazon Prime Video, Disney+ Hotstar, Apple TV+, and open HTML5 video players.**

Tired of blinding white subtitles on OLED/HDR screens? Frustrated by black bars on your ultrawide monitor? Tired of slow commercial ads on ad-supported tiers? VeloxCine gives you complete control over your viewing experience.

### Key Features

#### 16x Hyper-Warp Ad-Skipper
* Automatically accelerates commercial ad segments to 16.0x playback speed.
* Silently auto-mutes ad breaks and auto-clicks "Skip Ad" buttons in under 50 milliseconds.
* Instantly restores normal playback speed (1.0x) and your preferred audio level when your content resumes.

#### Freeform Drag-and-Drop Subtitle Positioning
* Grab and position subtitles anywhere on screen with interactive visual guides.
* One-click presets: Bottom-Center, Top-Center, Bottom Black Bar, Top Black Bar.
* **HDR / OLED Subtitle Dimmer (0% to 100%):** Dim bright subtitles during dark nighttime viewing to eliminate eye strain.
* Full custom styling: adjust font size, color palette, text shadows/outlines, and background opacity.

#### External SRT & VTT Subtitle Injector
* Easily load your own `.srt` or `.vtt` subtitle files directly into any streaming player.
* Fine-tune subtitle timing with +/-100ms synchronization offsets.

#### 21:9 Ultrawide Cinema Mode & Black Bar Eliminator
* Fill your 21:9 or 32:9 ultrawide monitor without distortion.
* Crop 2.39:1 widescreen films to 16:9 full-screen without black letterbox bars.
* Custom pan and zoom controls using the quick hotkey (`Z`).

#### 600% Dialogue Audio Booster & Vocal Clarity
* Boost quiet movie dialogues up to 600% using native Web Audio API gain nodes without blowing out loud background explosions.

#### Transparent Monetization
* **Free Tier:** Core ad-skip trigger, 16:9 crop, and default bottom-center subtitle formatting.
* **Lifetime Pro ($14.99 one-time):** Unlocks 16x hyper-warp ad bypass, freeform subtitle dragging, OLED dimmer, external SRT loader, and upcoming Android TV / Fire TV companion app.

---

## 2. Visual & Promotional Assets Checklist

The following high-resolution assets have been prepared in your repository:

| Asset Type | Location in Repo | Dimensions | Purpose in Chrome Web Store |
| :--- | :--- | :--- | :--- |
| **Store Icon** | `assets/logo512.png` & `assets/logo.jpg` | 512x512 / 1024x1024 | Main store listing icon & branding badge |
| **Extension Icons** | `icons/icon-16.png`, `48.png`, `128.png` | 16/48/128 px | Toolbar icon & Chrome management |
| **Screenshot 1** | `screenshots/1-floating-hud.jpg` | 1280x720 (16:9) | Primary screenshot: In-Stream Floating Glass HUD |
| **Screenshot 2** | `screenshots/2-ultrawide-zero-black-bars.jpg` | 1280x720 (16:9) | Feature screenshot: 21:9 Ultrawide Zero Black Bars |
| **Screenshot 3** | `screenshots/3-smart-subtitles-oled-dimmer.jpg` | 1280x720 (16:9) | Feature screenshot: Drag & Drop Subtitles + OLED Dimmer |
| **Marquee Banner** | `screenshots/4-store-promo-marquee.jpg` | 1280x720 (16:9) | Promotional Marquee / Web Store Feature Banner |

---

## 3. Web Store Compliance & Privacy Audit

* **Privacy Policy URL:** `https://stratumforge.github.io/veloxcine/privacy.html`
* **Single Purpose Justification:** VeloxCine provides a unified media playback enhancement suite (aspect ratio adjustment, subtitle repositioning/dimming, speed control, and dialogue amplification) for web video streams.
* **Permissions Justification:**
  * `storage`: Required to save user preferences locally (subtitle colors, OLED dimmer percentage, aspect ratio presets).
  * `tabs` & `scripting`: Required to inject HUD overlay and apply video transformations when the user requests it.
  * `identity`: Required for verifying optional Lifetime Pro license status via Google Account authentication.
  * `<all_urls>`: Required because users stream video across diverse websites and custom media players.
* **Data Usage:** Zero personal tracking, zero telemetry collection, zero third-party analytics.
