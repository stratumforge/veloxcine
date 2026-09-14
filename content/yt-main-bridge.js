/**
 * VeloxCine™ MAIN-World YouTube Fast-Skip Controller
 * Runs natively inside the page execution context (MAIN world)
 * Has direct access to YouTube's #movie_player internal APIs
 */
(function () {
  'use strict';

  function skipAdNow() {
    try {
      const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      if (player) {
        // Direct call to YouTube player API method if ad is active
        if (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting')) {
          if (typeof player.skipAd === 'function') {
            player.skipAd();
          }
        }
      }

      // Unconditionally click any visible skip button in page context
      const skipBtns = document.querySelectorAll(
        'button.ytp-ad-skip-button-modern, .ytp-ad-skip-button-modern, button.ytp-ad-skip-button, .ytp-ad-skip-button, .ytp-ad-skip-button-slot button, .ytp-ad-skip-button-container button, button[id^="skip-button"], button.ytp-skip-ad-button, .ytp-skip-ad-button button, .videoAdUiSkipButton, .ytp-ad-skip-button-slot, .ytp-ad-skip-button-container, .ytp-skip-ad-button'
      );
      for (let i = 0; i < skipBtns.length; i++) {
        const b = skipBtns[i];
        if (b) {
          if (typeof b.click === 'function') {
            try { b.click(); } catch(e) {}
          }
          const child = b.querySelector('button, [class*="skip"], .ytp-ad-text');
          if (child && typeof child.click === 'function') {
            try { child.click(); } catch(e) {}
          }
        }
      }

      // Text search
      const btns = document.querySelectorAll('.html5-video-player button, .video-ads button, .ytp-ad-module button');
      for (let i = 0; i < btns.length; i++) {
        const b = btns[i];
        const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
        if (txt.includes('skip') && typeof b.click === 'function') {
          try { b.click(); } catch(e) {}
        }
      }
    } catch (e) {}
  }

  // Listen for custom skip event dispatched from content script
  window.addEventListener('veloxcine-skip-ad', skipAdNow);

  // Active loop in MAIN world running every 100ms
  setInterval(skipAdNow, 100);
})();
