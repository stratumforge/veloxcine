/**
 * VeloxCine™ Official Landing Page Interactive Simulator
 * Author: StratumForge Labs™
 */

document.addEventListener('DOMContentLoaded', () => {
  const simScreen = document.getElementById('sim-screen');
  const simVideo = document.getElementById('sim-video');
  const simSubBox = document.getElementById('sim-sub-box');
  const simSubText = document.getElementById('sim-sub-text');
  const simDimmerSlider = document.getElementById('sim-dimmer-slider');
  const simDimmerVal = document.getElementById('sim-dimmer-val');
  const simSizeSlider = document.getElementById('sim-size-slider');
  const simSizeVal = document.getElementById('sim-size-val');
  const simAdOverlay = document.getElementById('sim-ad-overlay');
  const btnDemoAdWarp = document.getElementById('demo-ad-warp');
  const btnSimSkip = document.getElementById('btn-sim-skip');

  // 1. Aspect Ratio Simulator
  document.querySelectorAll('.sim-btn[data-aspect]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sim-btn[data-aspect]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const aspect = btn.getAttribute('data-aspect');
      if (aspect === '16-9') {
        simScreen.className = 'sim-screen-wrap aspect-16-9';
        simVideo.className = 'sim-video-art';
      } else if (aspect === '21-9') {
        simScreen.className = 'sim-screen-wrap aspect-21-9';
        simVideo.className = 'sim-video-art';
      } else if (aspect === 'crop') {
        simScreen.className = 'sim-screen-wrap aspect-16-9';
        simVideo.className = 'sim-video-art crop-aspect';
      }
    });
  });

  // 2. Draggable Subtitle Box in Simulator
  let isDragging = false;
  let startX, startY;

  simSubBox.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - simSubBox.offsetLeft;
    startY = e.clientY - simSubBox.offsetTop;
    simSubBox.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const parentRect = simScreen.getBoundingClientRect();
    let newX = e.clientX - parentRect.left;
    let newY = e.clientY - parentRect.top;

    // Constrain inside parent
    newX = Math.max(80, Math.min(parentRect.width - 80, newX));
    newY = Math.max(30, Math.min(parentRect.height - 40, newY));

    simSubBox.style.left = `${newX}px`;
    simSubBox.style.top = `${newY}px`;
    simSubBox.style.bottom = 'auto';
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      simSubBox.style.cursor = 'grab';
    }
  });

  // 3. Subtitle Dimmer Slider
  simDimmerSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    simDimmerVal.textContent = `${val}%`;
    simSubBox.style.filter = `brightness(${val}%)`;
  });

  // 4. Font Size Slider
  simSizeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    simSizeVal.textContent = `${val}px`;
    simSubText.style.fontSize = `${val}px`;
  });

  // 5. Color Swatches
  document.querySelectorAll('.sim-color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.sim-color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      simSubText.style.color = dot.getAttribute('data-color');
    });
  });

  // 6. Simulate 16x Ad-Warp
  btnDemoAdWarp.addEventListener('click', () => {
    simAdOverlay.classList.add('show');
    clearTimeout(simAdOverlay._timer);
    simAdOverlay._timer = setTimeout(() => {
      simAdOverlay.classList.remove('show');
    }, 1800);
  });

  btnSimSkip.addEventListener('click', () => {
    simAdOverlay.classList.remove('show');
  });
});
