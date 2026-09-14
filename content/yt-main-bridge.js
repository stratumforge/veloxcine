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
      const video = player ? player.querySelector('video') : document.querySelector('video');

      // 1. If video is paused during ad, unpause it immediately so it doesn't freeze
      if (player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'))) {
        if (video && video.paused) {
          try { video.play(); } catch(e) {}
        }
        if (typeof player.skipAd === 'function') {
          player.skipAd();
        }
      }

      // 2. Unconditionally click any skip button in page context
      const skipSelectors = [
        'button.ytp-ad-skip-button-modern',
        '.ytp-ad-skip-button-modern',
        'button.ytp-ad-skip-button',
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-slot button',
        '.ytp-ad-skip-button-container button',
        'button[id^="skip-button"]',
        'div[id^="skip-button"]',
        'button.ytp-skip-ad-button',
        '.ytp-skip-ad-button button',
        '.videoAdUiSkipButton',
        '[aria-label*="Skip"]',
        '[aria-label*="skip"]',
        '.ytp-ad-skip-button-slot',
        '.ytp-ad-skip-button-container',
        '.ytp-skip-ad-button'
      ];

      for (let i = 0; i < skipSelectors.length; i++) {
        const btns = document.querySelectorAll(skipSelectors[i]);
        for (let j = 0; j < btns.length; j++) {
          const b = btns[j];
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
      }

      // 3. Text search for any button containing "Skip"
      const allBtns = document.querySelectorAll('.html5-video-player button, .video-ads button');
      for (let i = 0; i < allBtns.length; i++) {
        const b = allBtns[i];
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
