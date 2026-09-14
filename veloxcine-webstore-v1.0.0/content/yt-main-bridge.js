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
      const rect = el.getBoundingClientRect();
      const x = rect.left + (rect.width > 0 ? rect.width / 2 : 10);
      const y = rect.top + (rect.height > 0 ? rect.height / 2 : 10);

      const opts = {
        bubbles: true,
        cancelable: true,
        view: window,
        composed: true,
        detail: 1,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: 1
      };

      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));
      if (typeof el.click === 'function') {
        try { el.click(); } catch(e) {}
      }

      const child = el.querySelector('button, [class*=\"skip\"], .ytp-ad-text');
      if (child && child !== el) {
        if (typeof child.click === 'function') {
          try { child.click(); } catch(e) {}
        }
      }
    } catch (e) {}
  }

  function skipAdNow() {
    try {
      const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      const video = player ? player.querySelector('video') : document.querySelector('video');

      // Canonical and strictly accurate YouTube ad detection
      const isAd = Boolean(
        player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'))
      );

      if (isAd) {
        wasAdActive = true;

        // Try YouTube internal skipAd method
        if (player && typeof player.skipAd === 'function') {
          try { player.skipAd(); } catch(e) {}
        }

        // Target visible Skip Ad buttons
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
          'button[id^=\"skip-button\"]',
          '.videoAdUiSkipButton',
          'button.videoAdUiSkipButton'
        ];

        for (let i = 0; i < skipSelectors.length; i++) {
          const btns = document.querySelectorAll(skipSelectors[i]);
          for (let j = 0; j < btns.length; j++) {
            const b = btns[j];
            if (b && (b.offsetParent !== null || b.offsetWidth > 0)) {
              triggerFullClick(b);
            }
          }
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
          }
        }
      }
    } catch (e) {}
  }

  // Listen for custom skip event dispatched from content script
  window.addEventListener('veloxcine-skip-ad', skipAdNow);

  // Safe periodic check (300ms)
  setInterval(skipAdNow, 300);
})();
