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
      if (!player) return;

      const isAd = player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting');
      if (isAd) {
        // 1. YouTube Player internal API method
        if (typeof player.skipAd === 'function') {
          player.skipAd();
        }

        // 2. Click any visible skip button in page world
        const skipBtns = document.querySelectorAll(
          '.ytp-skip-ad-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button, button[id^="skip-button"], .ytp-ad-skip-button-slot button, button.ytp-ad-skip-button-modern, .ytp-ad-skip-button-container button'
        );
        for (let i = 0; i < skipBtns.length; i++) {
          const b = skipBtns[i];
          if (b && (b.offsetParent !== null || b.offsetWidth > 0 || b.offsetHeight > 0)) {
            b.click();
          }
        }
      }
    } catch (e) {}
  }

  // Listen for custom skip event dispatched from content script
  window.addEventListener('veloxcine-skip-ad', skipAdNow);

  // Active loop in MAIN world running every 150ms
  setInterval(skipAdNow, 150);
})();
