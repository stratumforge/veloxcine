/**
 * VeloxCine™ Interactive Testing Playground Controller
 * Author: StratumForge Labs™
 */

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('test-video');
  const viewportCard = document.getElementById('viewport-card');
  const adOverlay = document.getElementById('simulated-ad-overlay');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnTriggerAd = document.getElementById('btn-trigger-ad');
  const btnClickSkip = document.getElementById('btn-click-skip-ad');
  const btnSampleSrt = document.getElementById('btn-sample-srt');
  const btnToggleHud = document.getElementById('btn-toggle-hud-top');

  // Diagnostics elements
  const diagSpeed = document.getElementById('diag-speed');
  const diagMuted = document.getElementById('diag-muted');
  const diagRes = document.getElementById('diag-res');
  const diagAspect = document.getElementById('diag-aspect');
  const diagTier = document.getElementById('diag-tier');
  const diagSubPos = document.getElementById('diag-sub-pos');

  // Play / Pause
  btnPlayPause.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      btnPlayPause.textContent = 'Pause';
    } else {
      video.pause();
      btnPlayPause.textContent = 'Play';
    }
  });

  // Top toggle HUD
  btnToggleHud.addEventListener('click', () => {
    const trigger = document.getElementById('velox-trigger-pill');
    if (trigger) trigger.click();
  });

  // Trigger Simulated Ad
  btnTriggerAd.addEventListener('click', () => {
    adOverlay.classList.add('active');
    adOverlay.setAttribute('data-ad-active', 'true');
    console.log('[Playground] Simulated Ad Break Triggered');

    // Auto dismiss simulated ad after 4 seconds if not skipped
    clearTimeout(adOverlay._timer);
    adOverlay._timer = setTimeout(() => {
      endSimulatedAd();
    }, 4500);
  });

  function endSimulatedAd() {
    adOverlay.classList.remove('active');
    adOverlay.removeAttribute('data-ad-active');
    console.log('[Playground] Simulated Ad Break Finished');
  }

  btnClickSkip.addEventListener('click', () => {
    endSimulatedAd();
  });

  // Download Sample .SRT for testing external subtitle loader
  btnSampleSrt.addEventListener('click', () => {
    const srtContent = `1
00:00:01,000 --> 00:00:04,500
[VeloxCine External SRT Test]
Custom foreign subtitles loaded successfully!

2
00:00:05,000 --> 00:00:09,000
Drag and drop works with microsecond precision sync.

3
00:00:09,500 --> 00:00:15,000
Use the HUD sync slider to adjust audio delay +/- 5 seconds.

4
00:00:15,500 --> 00:00:25,000
StratumForge Labs™ - Cinema Quality in Your Browser.
`;
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'veloxcine-sample.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Display aspect simulation buttons
  document.getElementById('btn-aspect-169').addEventListener('click', () => {
    viewportCard.className = 'viewport-card aspect-16-9';
    diagAspect.textContent = 'Container 16:9';
  });
  document.getElementById('btn-aspect-219').addEventListener('click', () => {
    viewportCard.className = 'viewport-card aspect-21-9';
    diagAspect.textContent = 'Container 21:9 Ultrawide';
  });
  document.getElementById('btn-aspect-43').addEventListener('click', () => {
    viewportCard.className = 'viewport-card aspect-4-3';
    diagAspect.textContent = 'Container 4:3 Pillarbox';
  });
  document.getElementById('btn-cycle-aspect-sb').addEventListener('click', () => {
    const cycleBtn = document.getElementById('velox-cycle-aspect-btn');
    if (cycleBtn) cycleBtn.click();
  });

  // Real-time diagnostics loop
  setInterval(() => {
    if (video) {
      diagSpeed.textContent = `${video.playbackRate.toFixed(1)}x`;
      diagMuted.textContent = video.muted ? 'Muted' : 'Unmuted';
      if (video.videoWidth) {
        diagRes.textContent = `${video.videoWidth} × ${video.videoHeight}`;
      }
    }

    if (window.VeloxLicense) {
      const isPrem = window.VeloxLicense.isPremium();
      diagTier.textContent = isPrem ? 'Lifetime Premium' : 'Free Tier';
      diagTier.style.color = isPrem ? '#fbbf24' : '#00e5ff';
    }

    const anchor = document.getElementById('veloxcine-subtitle-anchor');
    if (anchor) {
      diagSubPos.textContent = `${anchor.style.left || '50%'}, ${anchor.style.top || '88%'}`;
    }
  }, 250);
});
