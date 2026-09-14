/**
 * VeloxCine™ Universal Streaming, Subtitle & Aspect Suite
 * Content Script Engine
 * Author: StratumForge Labs™
 */
(function () {
  'use strict';

  // Prevent duplicate injection in the same frame
  if (window.__veloxcine_injected) return;
  window.__veloxcine_injected = true;

  console.log('%c[VeloxCine™]%c Universal Streaming Engine Initialized (StratumForge Labs™)', 'background:#00e5ff;color:#000;font-weight:bold;padding:2px 6px;border-radius:4px;', 'color:#00e5ff;font-weight:bold;');

  // State
  const state = {
    activeVideo: null,
    platform: 'generic', // 'netflix' | 'prime' | 'hotstar' | 'appletv' | 'generic'
    isPremium: false,
    hudVisible: false,
    perVideoOverride: false,

    // Settings
    aspect: {
      mode: 'original', // 'original' | 'ultrawide' | 'crop169' | 'stretch' | 'custom'
      customZoom: 100, // 100% - 175%
      panY: 0 // -50% to +50%
    },
    subtitles: {
      fontSize: 24,
      fontColor: '#ffffff',
      brightness: 100, // 0 - 100%
      bgOpacity: 0, // 0 - 100%
      outline: true,
      posX: 50, // % left
      posY: 88, // % top
      fontFamily: 'Inter',
      preset: 'bottom-center',
      syncOffset: 0 // seconds
    },
    video: {
      sharpen: false,
      contrast: 100,
      brightness: 100,
      audioBoost: 100 // 100% - 600%
    },
    adWarp: {
      enabled: true,
      autoMute: true,
      instantSkip: true,
      isAdActive: false,
      savedVolume: 1,
      savedSpeed: 1
    },

    // External subtitles
    externalCues: [],
    activeCueIndex: -1
  };

  // Detect Platform
  const host = window.location.hostname;
  if (host.includes('netflix.com')) state.platform = 'netflix';
  else if (host.includes('primevideo.com') || host.includes('amazon.')) state.platform = 'prime';
  else if (host.includes('hotstar.com')) state.platform = 'hotstar';
  else if (host.includes('apple.com')) state.platform = 'appletv';

  // Audio Boost Web Audio context
  let audioCtx = null;
  let audioSourceNode = null;
  let audioGainNode = null;

  /* ==========================================================================
     1. VIDEO DETECTION & MUTATION OBSERVER
     ========================================================================== */
  function findPrimaryVideo() {
    const videos = Array.from(document.querySelectorAll('video'));
    if (!videos.length) return null;

    // Pick video with highest resolution / currently playing
    let best = videos[0];
    let maxArea = 0;
    for (const v of videos) {
      const rect = v.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > maxArea && rect.width > 100) {
        maxArea = area;
        best = v;
      }
    }
    return best;
  }

  function bindVideo(video) {
    if (!video || state.activeVideo === video) return;
    state.activeVideo = video;
    console.log('[VeloxCine] Bound to primary video element:', video);

    // Apply active aspects and filters
    applyAspectTransform();
    applyVideoEnhancements();
    setupAudioContext(video);

    // Listen to video time updates for external subtitles
    video.addEventListener('timeupdate', onVideoTimeUpdate);
    video.addEventListener('ratechange', () => {
      // Prevent streaming player from forcing 1x during ad-warp if ad is active
      if (state.adWarp.isAdActive && state.adWarp.enabled && video.playbackRate < 15) {
        video.playbackRate = 16.0;
      }
    });
  }

  const observer = new MutationObserver(() => {
    const v = findPrimaryVideo();
    if (v && v !== state.activeVideo) {
      bindVideo(v);
    }
    // Check for ads and skip buttons
    if (state.adWarp.enabled) {
      detectAdState();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'src', 'style']
  });

  /* ==========================================================================
     2. HYPER-WARP AD SKIPPING ENGINE (16x Acceleration + Auto-Mute)
     ========================================================================== */
  function detectAdState() {
    const video = state.activeVideo;
    if (!video) return;

    let isAd = false;

    // Platform-specific ad detection
    if (state.platform === 'netflix') {
      isAd = Boolean(document.querySelector('.ad-container, [data-uia="ad-breakpoint"], .watch-video--ad-banner'));
    } else if (state.platform === 'prime') {
      isAd = Boolean(document.querySelector('.ad-showing, .adMarker, .fuzzyCenter .ad-overlay'));
    } else if (state.platform === 'hotstar') {
      isAd = Boolean(document.querySelector('.ad-timer, .ad-overlay, .advertising-container'));
    } else {
      // Generic (e.g., YouTube or custom sandbox)
      isAd = Boolean(document.querySelector('.ad-showing, .video-ads, [data-ad-active="true"]'));
    }

    // Auto-click Skip buttons
    const skipSelectors = [
      '.skip-element',
      'button.skip-ad',
      '.fuzzyCenter .skip-element',
      '.watch-video--skip-content-button',
      '.shaka-ad-skip',
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '[data-uia="player-skip-intro"]',
      'button[aria-label="Skip"]',
      '.velox-simulated-skip-btn'
    ];

    for (const sel of skipSelectors) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) {
        try {
          btn.click();
          showToast('⚡ VeloxCine: Instant Skip Clicked');
        } catch (e) {}
      }
    }

    // Handle 16x Hyper-Warp
    if (isAd && !state.adWarp.isAdActive) {
      // Free vs Premium check
      if (!VeloxLicense.isPremium()) {
        showToast('ℹ️ Free Tier: Standard Skip (Upgrade for 16x Hyper-Warp)');
        return;
      }

      state.adWarp.isAdActive = true;
      state.adWarp.savedSpeed = video.playbackRate || 1;
      state.adWarp.savedVolume = video.volume;

      if (state.adWarp.autoMute) {
        video.muted = true;
      }
      try {
        video.playbackRate = 16.0;
      } catch (e) {
        video.playbackRate = 8.0;
      }
      showToast('⚡ VeloxCine: 16x Ad-Warp & Mute Active');
    } else if (!isAd && state.adWarp.isAdActive) {
      // Ad finished - restore sound and speed
      state.adWarp.isAdActive = false;
      video.playbackRate = state.adWarp.savedSpeed || 1;
      if (state.adWarp.autoMute) {
        video.muted = false;
        video.volume = state.adWarp.savedVolume;
      }
      showToast('✨ Playback Restored (1.0x)');
    }
  }

  /* ==========================================================================
     3. ASPECT RATIO & BLACK BAR ELIMINATOR
     ========================================================================== */
  function applyAspectTransform() {
    const video = state.activeVideo;
    if (!video) return;

    video.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), object-fit 0.25s ease';

    const mode = state.aspect.mode;
    if (mode === 'original') {
      video.style.transform = 'none';
      video.style.objectFit = 'contain';
    } else if (mode === 'ultrawide') {
      // 21:9 Ultrawide Fill (crops letterbox black bars on 2.39:1 movies or fits 21:9 monitors)
      video.style.objectFit = 'cover';
      video.style.transform = 'scale(1.334)';
    } else if (mode === 'crop169') {
      // 16:9 Crop to Fill
      video.style.objectFit = 'cover';
      video.style.transform = 'scale(1.18)';
    } else if (mode === 'stretch') {
      // Stretch to Window
      video.style.objectFit = 'fill';
      video.style.transform = 'none';
    } else if (mode === 'custom') {
      const scale = state.aspect.customZoom / 100;
      const panY = state.aspect.panY || 0;
      video.style.objectFit = 'cover';
      video.style.transform = `scale(${scale}) translateY(${panY}%)`;
    }
  }

  function cycleAspectRatio() {
    const modes = ['original', 'ultrawide', 'crop169', 'stretch'];
    const currentIdx = modes.indexOf(state.aspect.mode);
    const nextMode = modes[(currentIdx + 1) % modes.length];

    if ((nextMode === 'ultrawide' || nextMode === 'stretch') && !VeloxLicense.isPremium()) {
      showToast('🔒 21:9 Ultrawide is a Lifetime Premium feature');
      state.aspect.mode = 'original';
    } else {
      state.aspect.mode = nextMode;
    }

    applyAspectTransform();
    updateHUDControls();
    showToast(`Aspect: ${state.aspect.mode.toUpperCase()}`);
  }

  /* ==========================================================================
     4. VIDEO SUPER-RESOLUTION & AUDIO BOOST
     ========================================================================== */
  function applyVideoEnhancements() {
    const video = state.activeVideo;
    if (!video) return;

    let filterStr = '';
    if (state.video.sharpen) {
      if (VeloxLicense.isPremium()) {
        filterStr += 'contrast(106%) saturate(108%) ';
      } else {
        showToast('🔒 Super-Resolution Sharpening requires Lifetime Premium');
        state.video.sharpen = false;
      }
    }
    if (state.video.brightness !== 100) {
      filterStr += `brightness(${state.video.brightness}%) `;
    }
    if (state.video.contrast !== 100) {
      filterStr += `contrast(${state.video.contrast}%) `;
    }

    video.style.filter = filterStr.trim() || 'none';
  }

  function setupAudioContext(video) {
    if (audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioCtx = new AudioContext();
      audioSourceNode = audioCtx.createMediaElementSource(video);
      audioGainNode = audioCtx.createGain();
      audioSourceNode.connect(audioGainNode);
      audioGainNode.connect(audioCtx.destination);
      setAudioGain(state.video.audioBoost);
    } catch (e) {
      // CORS or MediaElement already connected fallback
    }
  }

  function setAudioGain(percent) {
    if (!audioGainNode) return;
    if (percent > 100 && !VeloxLicense.isPremium()) {
      showToast('🔒 600% Audio Booster requires Lifetime Premium');
      return;
    }
    audioGainNode.gain.value = percent / 100;
  }

  /* ==========================================================================
     5. ADVANCED SUBTITLE ENGINE & DRAG-AND-DROP ANCHOR
     ========================================================================== */
  let subtitleStyleTag = null;

  function injectSubtitleStyles() {
    if (!subtitleStyleTag) {
      subtitleStyleTag = document.createElement('style');
      subtitleStyleTag.id = 'veloxcine-dynamic-subtitles';
      document.head.appendChild(subtitleStyleTag);
    }

    const { fontSize, fontColor, brightness, bgOpacity, outline, fontFamily, posX, posY } = state.subtitles;
    const bg = bgOpacity > 0 ? `rgba(0, 0, 0, ${bgOpacity / 100})` : 'transparent';
    const textShadow = outline
      ? '0 2px 4px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.9), 1px 1px 2px #000, -1px -1px 2px #000'
      : 'none';
    const filter = `brightness(${brightness}%)`;

    // Native platform target selectors
    const selectors = [
      '.player-timedtext',
      '.player-timedtext-text-container',
      '.atvwebplayersdk-subtitle-text',
      '.shaka-text-container span',
      '.subtitle-display span',
      '.ytp-caption-segment',
      '.velox-custom-sub-text'
    ].join(', ');

    subtitleStyleTag.textContent = `
      ${selectors} {
        font-size: ${fontSize}px !important;
        color: ${fontColor} !important;
        background-color: ${bg} !important;
        filter: ${filter} !important;
        text-shadow: ${textShadow} !important;
        font-family: ${fontFamily}, system-ui, sans-serif !important;
        transition: filter 0.15s ease, font-size 0.15s ease !important;
      }
      /* Position anchor for native Netflix & Prime subtitles */
      .player-timedtext, .atvwebplayersdk-subtitles-container {
        position: absolute !important;
        left: ${posX}% !important;
        top: ${posY}% !important;
        transform: translate(-50%, -50%) !important;
      }
    `;

    // Also update custom anchor box
    const anchor = document.getElementById('veloxcine-subtitle-anchor');
    if (anchor) {
      anchor.style.left = `${posX}%`;
      anchor.style.top = `${posY}%`;
      anchor.style.transform = 'translate(-50%, -50%)';
    }
  }

  function setSubtitlePreset(preset) {
    if (preset === 'top-center') {
      state.subtitles.posX = 50;
      state.subtitles.posY = 12;
    } else if (preset === 'bottom-center') {
      state.subtitles.posX = 50;
      state.subtitles.posY = 88;
    } else if (preset === 'bottom-black-bar') {
      state.subtitles.posX = 50;
      state.subtitles.posY = 96;
    } else if (preset === 'top-black-bar') {
      state.subtitles.posX = 50;
      state.subtitles.posY = 4;
    }
    state.subtitles.preset = preset;
    injectSubtitleStyles();
    showToast(`Subtitles: ${preset.replace('-', ' ').toUpperCase()}`);
  }

  /* ==========================================================================
     6. EXTERNAL SUBTITLE (.SRT / .VTT) PARSER & RENDERER
     ========================================================================== */
  function parseSrtOrVtt(text) {
    const cues = [];
    // Normalize newlines
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    let i = 0;

    function timeToSeconds(tStr) {
      if (!tStr) return 0;
      const parts = tStr.trim().replace(',', '.').split(':');
      if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      } else if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      return 0;
    }

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line || line.startsWith('WEBVTT') || line.startsWith('NOTE')) {
        i++;
        continue;
      }

      // Check if line contains timestamp arrow -->
      let timeLine = line;
      if (!timeLine.includes('-->') && i + 1 < lines.length && lines[i + 1].includes('-->')) {
        i++;
        timeLine = lines[i];
      }

      if (timeLine.includes('-->')) {
        const [startStr, endStr] = timeLine.split('-->');
        const start = timeToSeconds(startStr);
        const end = timeToSeconds(endStr.trim().split(' ')[0]);
        i++;

        // Collect text
        const textLines = [];
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i]);
          i++;
        }
        cues.push({ start, end, text: textLines.join('\n') });
      }
      i++;
    }
    return cues;
  }

  function loadExternalSubtitles(file) {
    if (!VeloxLicense.isPremium()) {
      showToast('🔒 External Subtitle Loader is a Lifetime Premium feature');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const cues = parseSrtOrVtt(e.target.result);
      if (cues.length) {
        state.externalCues = cues;
        showToast(`Loaded ${cues.length} Subtitle Cues from ${file.name}`);
        const textElem = document.querySelector('.velox-custom-sub-text');
        if (textElem) textElem.textContent = 'Subtitles Loaded & Synced';
      } else {
        showToast('⚠️ Could not parse subtitle format.');
      }
    };
    reader.readAsText(file);
  }

  function onVideoTimeUpdate() {
    if (!state.externalCues.length || !state.activeVideo) return;
    const current = state.activeVideo.currentTime + (state.subtitles.syncOffset || 0);

    const match = state.externalCues.find(c => current >= c.start && current <= c.end);
    const subElem = document.querySelector('.velox-custom-sub-text');
    if (!subElem) return;

    if (match) {
      subElem.textContent = match.text;
      subElem.style.display = 'inline-block';
    } else {
      subElem.textContent = '';
      subElem.style.display = 'none';
    }
  }

  /* ==========================================================================
     7. IN-PAGE FLOATING HUD DOM CREATION
     ========================================================================== */
  function createHUD() {
    if (document.getElementById('veloxcine-hud-root')) return;

    const root = document.createElement('div');
    root.id = 'veloxcine-hud-root';

    root.innerHTML = `
      <!-- Draggable Subtitle Anchor HUD -->
      <div id="veloxcine-subtitle-anchor" style="left: ${state.subtitles.posX}%; top: ${state.subtitles.posY}%;">
        <div class="velox-anchor-handle">DRAG TO MOVE SUBTITLES</div>
        <span class="velox-custom-sub-text" style="display:none;"></span>
      </div>

      <!-- Floating Trigger Pill -->
      <div class="velox-floating-trigger" id="velox-trigger-pill">
        <div class="velox-trigger-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 12L20 4L13 20L11 13L4 12Z" fill="#00e5ff"/>
          </svg>
        </div>
        <span class="velox-trigger-title">VeloxCine™</span>
        <span class="velox-trigger-badge ${VeloxLicense.isPremium() ? 'velox-badge-premium' : 'velox-badge-free'}" id="velox-hud-badge">
          ${VeloxLicense.isPremium() ? 'PREMIUM' : 'FREE'}
        </span>
      </div>

      <!-- Main Controls Panel -->
      <div class="velox-panel velox-hidden" id="velox-main-panel">
        <div class="velox-header">
          <div class="velox-brand-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 3L19 12L5 21V3Z" fill="url(#brandGrad)"/>
              <defs>
                <linearGradient id="brandGrad" x1="5" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#00e5ff"/>
                  <stop offset="1" stop-color="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="velox-brand-name">Velox<span>Cine</span>™</div>
          </div>
          <div class="velox-header-actions">
            <button class="velox-icon-btn" id="velox-close-btn" title="Close Panel (H)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="velox-tabs">
          <div class="velox-tab active" data-tab="tab-aspect">Aspect</div>
          <div class="velox-tab" data-tab="tab-subtitles">Subtitles</div>
          <div class="velox-tab" data-tab="tab-video">Video & FX</div>
          <div class="velox-tab" data-tab="tab-adwarp">Ad-Warp</div>
        </div>

        <!-- Tab Panes -->
        <div class="velox-tab-content">
          <!-- ASPECT TAB -->
          <div class="velox-tab-pane active" id="tab-aspect">
            <div class="velox-group">
              <div class="velox-group-title">Black Bar Eliminator</div>
              <div class="velox-btn-grid cols-3">
                <button class="velox-btn active" data-aspect="original">Original</button>
                <button class="velox-btn" data-aspect="ultrawide">21:9 Ultrawide</button>
                <button class="velox-btn" data-aspect="crop169">16:9 Fill</button>
                <button class="velox-btn" data-aspect="stretch">Stretch</button>
                <button class="velox-btn" data-aspect="custom">Custom Zoom</button>
                <button class="velox-btn" id="velox-cycle-aspect-btn">Cycle (Z)</button>
              </div>
            </div>

            <div class="velox-group" id="velox-custom-aspect-group">
              <div class="velox-group-title">Custom Pan & Zoom <span class="velox-badge-mini">PRO</span></div>
              <div class="velox-slider-row">
                <div class="velox-slider-header">
                  <span>Zoom Level</span>
                  <span class="velox-slider-value" id="velox-zoom-val">100%</span>
                </div>
                <input type="range" class="velox-slider" id="velox-zoom-slider" min="100" max="175" value="100">
              </div>
              <div class="velox-slider-row">
                <div class="velox-slider-header">
                  <span>Vertical Pan Offset</span>
                  <span class="velox-slider-value" id="velox-pan-val">0%</span>
                </div>
                <input type="range" class="velox-slider" id="velox-pan-slider" min="-30" max="30" value="0">
              </div>
            </div>
          </div>

          <!-- SUBTITLES TAB -->
          <div class="velox-tab-pane" id="tab-subtitles">
            <div class="velox-group">
              <div class="velox-group-title">Position Presets</div>
              <div class="velox-btn-grid cols-2">
                <button class="velox-btn active" data-preset="bottom-center">Bottom Center</button>
                <button class="velox-btn" data-preset="top-center">Top Center</button>
                <button class="velox-btn" data-preset="bottom-black-bar">Bottom Black Bar</button>
                <button class="velox-btn" data-preset="top-black-bar">Top Black Bar</button>
              </div>
            </div>

            <div class="velox-group">
              <div class="velox-group-title">Styling & Dimmer</div>
              <div class="velox-slider-row">
                <div class="velox-slider-header">
                  <span>Subtitle Dimmer (OLED/HDR) <span class="velox-badge-mini">PRO</span></span>
                  <span class="velox-slider-value" id="velox-sub-bright-val">100%</span>
                </div>
                <input type="range" class="velox-slider" id="velox-sub-bright-slider" min="20" max="100" value="100">
              </div>
              <div class="velox-slider-row">
                <div class="velox-slider-header">
                  <span>Font Size</span>
                  <span class="velox-slider-value" id="velox-sub-size-val">24px</span>
                </div>
                <input type="range" class="velox-slider" id="velox-sub-size-slider" min="14" max="52" value="24">
              </div>
              <div class="velox-slider-row">
                <div class="velox-slider-header">
                  <span>Color Palette</span>
                </div>
                <div class="velox-color-palette">
                  <div class="velox-color-swatch active" style="background:#ffffff;" data-color="#ffffff"></div>
                  <div class="velox-color-swatch" style="background:#fde047;" data-color="#fde047"></div>
                  <div class="velox-color-swatch" style="background:#00e5ff;" data-color="#00e5ff"></div>
                  <div class="velox-color-swatch" style="background:#a7f3d0;" data-color="#a7f3d0"></div>
                  <div class="velox-color-swatch" style="background:#f472b6;" data-color="#f472b6"></div>
                </div>
              </div>
            </div>

            <div class="velox-group">
              <div class="velox-group-title">External Subtitles (.SRT / .VTT) <span class="velox-badge-mini">PRO</span></div>
              <div class="velox-file-drop" id="velox-sub-dropzone">
                Drag & Drop .srt or .vtt file here, or <u>Click to Browse</u>
                <input type="file" id="velox-sub-file-input" accept=".srt,.vtt" style="display:none;">
              </div>
              <div class="velox-slider-row" style="margin-top:6px;">
                <div class="velox-slider-header">
                  <span>Audio Sync Delay</span>
                  <span class="velox-slider-value" id="velox-sync-val">0.0s</span>
                </div>
                <input type="range" class="velox-slider" id="velox-sync-slider" min="-50" max="50" value="0">
              </div>
            </div>
          </div>

          <!-- VIDEO & FX TAB -->
          <div class="velox-tab-pane" id="tab-video">
            <div class="velox-group">
              <div class="velox-group-title">Clarity & Super-Resolution</div>
              <div class="velox-btn-grid cols-2">
                <button class="velox-btn" id="velox-sharpen-btn">
                  <span>✨ Sharpen Filter</span>
                  <span class="velox-badge-mini">PRO</span>
                </button>
                <button class="velox-btn" id="velox-reset-fx-btn">Reset Filters</button>
              </div>
            </div>

            <div class="velox-group">
              <div class="velox-group-title">Audio Dialogue Booster <span class="velox-badge-mini">PRO</span></div>
              <div class="velox-slider-row">
                <div class="velox-slider-header">
                  <span>Volume / Dialogue Gain</span>
                  <span class="velox-slider-value" id="velox-audio-val">100%</span>
                </div>
                <input type="range" class="velox-slider" id="velox-audio-slider" min="100" max="600" value="100" step="25">
              </div>
            </div>
          </div>

          <!-- AD-WARP TAB -->
          <div class="velox-tab-pane" id="tab-adwarp">
            <div class="velox-group">
              <div class="velox-group-title">Hyper-Warp Ad Engine</div>
              <p style="font-size:12px;color:var(--velox-text-muted);margin:0;">
                Automatically accelerates commercial ads to 16x speed and mutes audio silently until your content resumes.
              </p>
              <div class="velox-btn-grid cols-2" style="margin-top:6px;">
                <button class="velox-btn active" id="velox-adwarp-toggle">⚡ 16x Warp: ON</button>
                <button class="velox-btn active" id="velox-automute-toggle">🔇 Auto-Mute: ON</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Toast Notifications -->
      <div class="velox-toast" id="velox-toast">
        <span id="velox-toast-msg">VeloxCine Active</span>
      </div>
    `;

    document.documentElement.appendChild(root);
    setupHUDInteractions();
    setupDraggableAnchor();
  }

  /* ==========================================================================
     8. HUD EVENT LISTENERS & USER INTERACTIONS
     ========================================================================== */
  function setupHUDInteractions() {
    const trigger = document.getElementById('velox-trigger-pill');
    const panel = document.getElementById('velox-main-panel');
    const closeBtn = document.getElementById('velox-close-btn');

    // Toggle HUD
    function toggleHUD() {
      state.hudVisible = !state.hudVisible;
      panel.classList.toggle('velox-hidden', !state.hudVisible);
    }

    trigger.addEventListener('click', toggleHUD);
    closeBtn.addEventListener('click', toggleHUD);

    // Tab switching
    const tabs = panel.querySelectorAll('.velox-tab');
    const panes = panel.querySelectorAll('.velox-tab-pane');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById(tab.getAttribute('data-tab'));
        if (target) target.classList.add('active');
      });
    });

    // Aspect buttons
    panel.querySelectorAll('[data-aspect]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-aspect');
        if ((mode === 'ultrawide' || mode === 'custom') && !VeloxLicense.isPremium()) {
          showToast('🔒 21:9 Ultrawide & Custom Zoom require Lifetime Premium');
          return;
        }
        panel.querySelectorAll('[data-aspect]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.aspect.mode = mode;
        applyAspectTransform();
        showToast(`Aspect: ${mode.toUpperCase()}`);
      });
    });

    document.getElementById('velox-cycle-aspect-btn').addEventListener('click', cycleAspectRatio);

    // Zoom & Pan sliders
    const zoomSlider = document.getElementById('velox-zoom-slider');
    const zoomVal = document.getElementById('velox-zoom-val');
    zoomSlider.addEventListener('input', (e) => {
      if (!VeloxLicense.isPremium()) {
        showToast('🔒 Custom Zoom is a Lifetime Premium feature');
        return;
      }
      state.aspect.customZoom = parseInt(e.target.value, 10);
      zoomVal.textContent = `${state.aspect.customZoom}%`;
      state.aspect.mode = 'custom';
      applyAspectTransform();
    });

    const panSlider = document.getElementById('velox-pan-slider');
    const panVal = document.getElementById('velox-pan-val');
    panSlider.addEventListener('input', (e) => {
      state.aspect.panY = parseInt(e.target.value, 10);
      panVal.textContent = `${state.aspect.panY}%`;
      state.aspect.mode = 'custom';
      applyAspectTransform();
    });

    // Subtitle Preset buttons
    panel.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setSubtitlePreset(btn.getAttribute('data-preset'));
      });
    });

    // Subtitle Dimmer
    const brightSlider = document.getElementById('velox-sub-bright-slider');
    const brightVal = document.getElementById('velox-sub-bright-val');
    brightSlider.addEventListener('input', (e) => {
      if (!VeloxLicense.isPremium()) {
        showToast('🔒 Subtitle Dimmer is a Lifetime Premium feature');
        return;
      }
      state.subtitles.brightness = parseInt(e.target.value, 10);
      brightVal.textContent = `${state.subtitles.brightness}%`;
      injectSubtitleStyles();
    });

    // Subtitle Font Size
    const sizeSlider = document.getElementById('velox-sub-size-slider');
    const sizeVal = document.getElementById('velox-sub-size-val');
    sizeSlider.addEventListener('input', (e) => {
      state.subtitles.fontSize = parseInt(e.target.value, 10);
      sizeVal.textContent = `${state.subtitles.fontSize}px`;
      injectSubtitleStyles();
    });

    // Color Swatches
    panel.querySelectorAll('.velox-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        panel.querySelectorAll('.velox-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        state.subtitles.fontColor = swatch.getAttribute('data-color');
        injectSubtitleStyles();
      });
    });

    // Subtitle File Dropzone
    const dropzone = document.getElementById('velox-sub-dropzone');
    const fileInput = document.getElementById('velox-sub-file-input');
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) loadExternalSubtitles(e.target.files[0]);
    });
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) loadExternalSubtitles(e.dataTransfer.files[0]);
    });

    // Sync Slider
    const syncSlider = document.getElementById('velox-sync-slider');
    const syncVal = document.getElementById('velox-sync-val');
    syncSlider.addEventListener('input', (e) => {
      const sec = (parseInt(e.target.value, 10) / 10).toFixed(1);
      state.subtitles.syncOffset = parseFloat(sec);
      syncVal.textContent = `${sec}s`;
    });

    // Video Sharpen & Audio Boost
    const sharpenBtn = document.getElementById('velox-sharpen-btn');
    sharpenBtn.addEventListener('click', () => {
      if (!VeloxLicense.isPremium()) {
        showToast('🔒 Super-Resolution Sharpening requires Lifetime Premium');
        return;
      }
      state.video.sharpen = !state.video.sharpen;
      sharpenBtn.classList.toggle('active', state.video.sharpen);
      applyVideoEnhancements();
      showToast(`Sharpening: ${state.video.sharpen ? 'ON' : 'OFF'}`);
    });

    const resetFxBtn = document.getElementById('velox-reset-fx-btn');
    resetFxBtn.addEventListener('click', () => {
      state.video.sharpen = false;
      state.video.brightness = 100;
      state.video.contrast = 100;
      sharpenBtn.classList.remove('active');
      applyVideoEnhancements();
      showToast('Video FX Reset');
    });

    const audioSlider = document.getElementById('velox-audio-slider');
    const audioVal = document.getElementById('velox-audio-val');
    audioSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val > 100 && !VeloxLicense.isPremium()) {
        showToast('🔒 600% Audio Dialogue Booster requires Lifetime Premium');
        audioSlider.value = 100;
        return;
      }
      state.video.audioBoost = val;
      audioVal.textContent = `${val}%`;
      setAudioGain(val);
    });

    // Ad-Warp toggles
    const adWarpBtn = document.getElementById('velox-adwarp-toggle');
    adWarpBtn.addEventListener('click', () => {
      state.adWarp.enabled = !state.adWarp.enabled;
      adWarpBtn.classList.toggle('active', state.adWarp.enabled);
      adWarpBtn.textContent = state.adWarp.enabled ? '⚡ 16x Warp: ON' : '⚡ 16x Warp: OFF';
      showToast(`Ad-Warp ${state.adWarp.enabled ? 'Enabled' : 'Disabled'}`);
    });

    // Listen for license updates
    VeloxLicense.onLicenseChanged((lic) => {
      const badge = document.getElementById('velox-hud-badge');
      if (badge) {
        badge.textContent = lic.isPremium ? 'PREMIUM' : 'FREE';
        badge.className = `velox-trigger-badge ${lic.isPremium ? 'velox-badge-premium' : 'velox-badge-free'}`;
      }
    });
  }

  /* ==========================================================================
     9. INTERACTIVE DRAGGABLE SUBTITLE ANCHOR
     ========================================================================== */
  function setupDraggableAnchor() {
    const anchor = document.getElementById('veloxcine-subtitle-anchor');
    if (!anchor) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;

    anchor.addEventListener('mousedown', (e) => {
      if (!VeloxLicense.isPremium()) {
        showToast('🔒 Drag-to-Position Subtitles is a Lifetime Premium feature');
        return;
      }
      isDragging = true;
      anchor.classList.add('dragging');
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      // Calculate percentage
      const pctX = Math.max(5, Math.min(95, (e.clientX / winW) * 100));
      const pctY = Math.max(5, Math.min(98, (e.clientY / winH) * 100));

      state.subtitles.posX = Math.round(pctX);
      state.subtitles.posY = Math.round(pctY);
      injectSubtitleStyles();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        anchor.classList.remove('dragging');
        showToast(`Subtitle Position Saved (${state.subtitles.posX}%, ${state.subtitles.posY}%)`);
      }
    });
  }

  function updateHUDControls() {
    const panel = document.getElementById('velox-main-panel');
    if (!panel) return;
    panel.querySelectorAll('[data-aspect]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-aspect') === state.aspect.mode);
    });
  }

  /* ==========================================================================
     10. KEYBOARD SHORTCUTS
     ========================================================================== */
  window.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    // 'H' key toggles HUD
    if (e.key === 'h' || e.key === 'H') {
      const panel = document.getElementById('velox-main-panel');
      if (panel) {
        state.hudVisible = !state.hudVisible;
        panel.classList.toggle('velox-hidden', !state.hudVisible);
      }
    }
    // 'Z' key cycles aspect ratio
    else if (e.key === 'z' || e.key === 'Z') {
      cycleAspectRatio();
    }
  });

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'PING') {
      sendResponse({ status: 'OK', platform: state.platform, videoBound: Boolean(state.activeVideo) });
    } else if (msg.action === 'CYCLE_ASPECT') {
      cycleAspectRatio();
      sendResponse({ mode: state.aspect.mode });
    } else if (msg.action === 'TOGGLE_HUD') {
      const panel = document.getElementById('velox-main-panel');
      if (panel) {
        state.hudVisible = !state.hudVisible;
        panel.classList.toggle('velox-hidden', !state.hudVisible);
      }
      sendResponse({ visible: state.hudVisible });
    }
    return true;
  });

  function showToast(text) {
    const toast = document.getElementById('velox-toast');
    const msg = document.getElementById('velox-toast-msg');
    if (!toast || !msg) return;
    msg.textContent = text;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Initial setup
  function init() {
    createHUD();
    injectSubtitleStyles();
    const v = findPrimaryVideo();
    if (v) bindVideo(v);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
