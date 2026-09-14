/**
 * VeloxCine™ MAIN-World YouTube Fast-Skip Controller
 * Runs natively inside the page execution context (MAIN world)
 * Has direct access to YouTube's #movie_player internal APIs and DOM
 */
(function () {
  'use strict';

  let wasAdActive = false;

  function triggerFullClick(el) {
    if (!el) return;
    try {
      // 1. Native click call
      if (typeof el.click === 'function') {
        try { el.click(); } catch(e) {}
      }

      const rect = el.getBoundingClientRect();
      const x = rect.left + (rect.width > 0 ? rect.width / 2 : 10);
      const y = rect.top + (rect.height > 0 ? rect.height / 2 : 10);

      const opts = {
        bubbles: true,
        cancelable: true,
        view: window,
        composed: true,
        detail: 1,
        screenX: window.screenX + x,
        screenY: window.screenY + y,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: 1
      };

      // 2. Full event sequence required by Google Closure & YouTube Wiz framework
      el.dispatchEvent(new PointerEvent('pointerover', opts));
      el.dispatchEvent(new PointerEvent('pointerenter', opts));
      el.dispatchEvent(new MouseEvent('mouseover', opts));
      el.dispatchEvent(new MouseEvent('mouseenter', opts));
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));

      // 3. Also trigger on child button / text if nested
      const child = el.querySelector('button, [class*="skip"], .ytp-ad-text');
      if (child && child !== el) {
        if (typeof child.click === 'function') {
          try { child.click(); } catch(e) {}
        }
        child.dispatchEvent(new PointerEvent('pointerdown', opts));
        child.dispatchEvent(new MouseEvent('mousedown', opts));
        child.dispatchEvent(new MouseEvent('mouseup', opts));
        child.dispatchEvent(new MouseEvent('click', opts));
      }

      // 4. Also trigger on parent container in case click listener is on wrapper
      if (el.parentElement && el.parentElement !== document.body && el.parentElement !== document.documentElement) {
        el.parentElement.dispatchEvent(new PointerEvent('pointerdown', opts));
        el.parentElement.dispatchEvent(new MouseEvent('mousedown', opts));
        el.parentElement.dispatchEvent(new MouseEvent('click', opts));
        if (typeof el.parentElement.click === 'function') {
          try { el.parentElement.click(); } catch(e) {}
        }
      }
    } catch (e) {}
  }

  function checkAndClickAllSkipButtons() {
    const skipSelectors = [
      'button.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-modern',
      'button.ytp-skip-ad-button',
      '.ytp-skip-ad-button',
      '.ytp-skip-ad-button__text',
      'button.ytp-ad-skip-button',
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-slot button',
      '.ytp-ad-skip-button-container button',
      '.ytp-ad-skip-button-slot',
      '.ytp-ad-skip-button-container',
      'button[id^="skip-button"]',
      'div[id^="skip-button"]',
      '[id*="skip-button"]',
      'button.ytp-ad-skip-button-icon-modern',
      '.ytp-ad-skip-button-icon-modern',
      'button.ytp-ad-text',
      '.ytp-ad-text.ytp-ad-skip-button-text',
      '.videoAdUiSkipButton',
      'button.videoAdUiSkipButton',
      '[aria-label*="Skip" i]',
      '[aria-label*="skip" i]'
    ];

    let found = false;
    for (let i = 0; i < skipSelectors.length; i++) {
      const btns = document.querySelectorAll(skipSelectors[i]);
      for (let j = 0; j < btns.length; j++) {
        const b = btns[j];
        if (b && (b.offsetParent !== null || b.offsetWidth > 0 || b.offsetHeight > 0)) {
          triggerFullClick(b);
          found = true;
        }
      }
    }

    // Text search fallback across all buttons in player
    const allBtns = document.querySelectorAll('.html5-video-player button, .ytp-ad-module button, .video-ads button, ytd-player button');
    for (let i = 0; i < allBtns.length; i++) {
      const b = allBtns[i];
      if (b && (b.offsetParent !== null || b.offsetWidth > 0)) {
        const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
        if (txt.includes('skip')) {
          triggerFullClick(b);
          found = true;
        }
      }
    }

    return found;
  }

  function skipAdNow() {
    try {
      const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      const video = player ? player.querySelector('video') : document.querySelector('video');

      // 1. Unconditionally click any skip button present in the DOM (Zero dependency on isAd flag)
      const clicked = checkAndClickAllSkipButtons();

      const isAd = Boolean(
        clicked ||
        (player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'))) ||
        document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay:not([style*="display: none"]), .ytp-ad-preview-container')
      );

      if (isAd) {
        wasAdActive = true;
        if (video) {
          if (!video.muted) video.muted = true;

          // Keep video stream playing so YouTube countdown timer progresses
          if (video.paused || video.ended) {
            if (video.duration && video.currentTime >= video.duration - 0.2) {
              video.currentTime = 0.1;
            }
            try { video.play(); } catch(e) {}
          }
        }

        // Try YouTube internal skipAd method
        if (player && typeof player.skipAd === 'function') {
          try { player.skipAd(); } catch(e) {}
        }
      } else {
        // Main video is playing: ONLY run once upon transition from ad -> main video
        if (wasAdActive) {
          wasAdActive = false;
          if (video) {
            if (video.playbackRate && video.playbackRate > 2.0) {
              video.playbackRate = 1.0;
            }
            if (video.muted) {
              video.muted = false;
            }
            if (video.paused && !video.ended) {
              try { video.play(); } catch(e) {}
            }
          }
        }
      }
    } catch (e) {}
  }

  // 1. High-speed MutationObserver: clicks skip button the exact instant it enters DOM
  try {
    const observer = new MutationObserver(() => {
      checkAndClickAllSkipButtons();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-hidden']
    });
  } catch (e) {}

  // 2. Listen for custom skip event dispatched from content script
  window.addEventListener('veloxcine-skip-ad', skipAdNow);

  // 3. Active loop running every 50ms for ultra-fast reaction
  setInterval(skipAdNow, 50);
})();
