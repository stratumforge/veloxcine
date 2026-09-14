# VeloxCine™: Phase 2 Android TV & Fire TV Architectural Blueprint
**By StratumForge Labs™**

This document outlines the technical architecture for expanding **VeloxCine™** into a standalone application for **Android TV** (Google TV, Sony, Shield TV, Xiaomi) and **Amazon Fire TV** (Fire OS / Fire TV Stick / Cube).

---

## 1. Technical Framework Selection

```
┌────────────────────────────────────────────────────────┐
│                   VELOXCINE™ TV APK                    │
├──────────────────────────┬─────────────────────────────┤
│      UI PRESENTATION     │       MEDIA ENGINE          │
│   Jetpack Compose for TV │      AndroidX Media3        │
│    (Leanback UX Model)   │        (ExoPlayer)          │
├──────────────────────────┴─────────────────────────────┤
│                   NATIVE CORE (NDK/C++)                │
│    Cryptographic Gmail Entitlement & Anti-Tamper       │
└────────────────────────────────────────────────────────┘
```

### Recommendation: Kotlin with AndroidX Media3 (ExoPlayer) & Jetpack Compose for TV
* **Why Not Flutter / React Native:** Android TV and Fire TV hardware (especially low-cost Fire TV Sticks) have limited RAM (1GB–1.5GB) and slower CPU cores. A native Kotlin app with AndroidX Media3 ensures smooth 60fps 4K video playback with zero dropped frames.
* **UI Toolkit:** `androidx.tv:tv-foundation` & `androidx.tv:tv-material` with D-Pad focus management.

---

## 2. Core TV Features & Implementation Mechanisms

### A. Aspect Ratio & Black Bar Removal (SurfaceView Matrix)
* In Android, standard video rendering uses `SurfaceView` or `TextureView`.
* To eliminate black bars on TV displays:
  ```kotlin
  // Custom Aspect Ratio Frame Layout
  class VeloxAspectRatioLayout(context: Context) : FrameLayout(context) {
      var resizeMode: Int = RESIZE_MODE_FIT
      var zoomFactor: Float = 1.0f
      var panYOffset: Float = 0.0f

      fun applyAspect(mode: AspectMode) {
          when (mode) {
              AspectMode.ORIGINAL -> { resizeMode = RESIZE_MODE_FIT; zoomFactor = 1.0f }
              AspectMode.ULTRAWIDE_21_9 -> { resizeMode = RESIZE_MODE_ZOOM; zoomFactor = 1.33f }
              AspectMode.FILL_16_9 -> { resizeMode = RESIZE_MODE_FILL; zoomFactor = 1.0f }
              AspectMode.STRETCH -> { resizeMode = RESIZE_MODE_FILL; zoomFactor = 1.0f }
          }
          requestLayout()
      }
  }
  ```

### B. Subtitle Engine & D-Pad Repositioning
* Uses AndroidX Media3 `SubtitleView` with custom `CaptionStyleCompat`:
  * **OLED Subtitle Dimmer:** Adjusts text color alpha `Color.argb(alpha, 255, 255, 255)` to dim subtitles in dark scenes.
  * **D-Pad Repositioning:** In TV mode, pressing `Up/Down` on the remote while holding a modifier button translates the `SubtitleView` margins dynamically across the screen.
  * **External SRT / VTT Loading:** Reads subtitle files directly from local storage, USB drive, or SMB/local network share using `SingleSampleMediaSource`.

### C. Resolution Forcing (ExoPlayer TrackSelectionOverrides)
* Unlike browsers where DRM limits resolution negotiation, ExoPlayer allows hard-coding track selections:
  ```kotlin
  val trackSelector = DefaultTrackSelector(context)
  val parameters = trackSelector.buildUponParameters()
      .setMaxVideoSize(3840, 2160) // Force 4K
      .setForceHighestSupportedBitrate(true)
      .build()
  trackSelector.setParameters(parameters)
  ```

---

## 3. Remote Control (D-Pad) Navigation Mapping

| Remote Button | Player Mode Function | HUD Active Function |
| :--- | :--- | :--- |
| **D-Pad Center / OK** | Show VeloxCine TV HUD / Pause | Select / Confirm Setting |
| **D-Pad Left / Right** | 10s Seek Backward / Forward | Adjust Slider (Dimmer, Zoom, Delay) |
| **D-Pad Up / Down** | Subtitle Vertical Position Offset | Move focus between menu rows |
| **Menu Button / Long-Press OK** | Toggle Aspect Ratio Cycle | Quick Ratio Switcher |
| **Back Button** | Dismiss HUD / Exit | Dismiss Current Panel |

---

## 4. Cross-Platform Gmail License Entitlement

* **User Journey on TV:**
  1. Customer opens VeloxCine on Fire TV or Android TV.
  2. The TV screen displays a short **6-character PIN code** and a QR code (e.g., `veloxcine.app/activate`).
  3. The customer scans the QR code on their smartphone or visits the URL on their computer, signs in with their **Gmail account**, and types the 6-character PIN.
  4. The TV app immediately unlocks **Lifetime Premium** via WebSocket/server push notification with zero typing required on the TV remote!

---

## 5. Security & Anti-Piracy Architecture for Android

1. **R8 / ProGuard Code Hardening:** Shrinks, obfuscates, and strips symbols from release APK builds.
2. **Native C++ JNI Core:** Critical cryptographic license verification is compiled into native `.so` shared libraries, preventing standard decompilers (JADX, APKTool) from modifying bytecodes.
3. **Google Play Integrity API:** Validates genuine app binaries and blocks running on untrusted, rooted, or tampered TV boxes.
