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

// Lightbox helper functions
window.openLightbox = function(src) {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  if (modal && img) {
    img.src = src;
    modal.classList.add('active');
  }
};

window.closeLightbox = function() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.remove('active');
  }
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeLightbox();
  }
});

// --- Dynamic Regional Pricing & Anti-VPN Verification Logic ---
(function initRegionalPricing() {
  const regionFlag = document.getElementById('region-flag');
  const regionStatus = document.getElementById('region-status');
  const btnInr = document.getElementById('btn-inr');
  const btnUsd = document.getElementById('btn-usd');
  const priceDisplay = document.getElementById('pro-price-display');
  const paymentDesc = document.getElementById('pro-payment-desc');
  const btnCheckoutText = document.getElementById('btn-pro-checkout-text');
  const btnCheckout = document.getElementById('btn-pro-checkout');
  const popularBadge = document.getElementById('popular-badge');
  const vpnDetailsText = document.getElementById('vpn-details-text');

  let detectedCountry = 'IN';
  let isVpnSuspect = false;

  window.setCurrency = function(curr, isManual = false) {
    if (curr === 'INR') {
      if (btnInr) btnInr.classList.add('active');
      if (btnUsd) btnUsd.classList.remove('active');

      if (priceDisplay) {
        priceDisplay.innerHTML = '<span class="price-val">₹399</span><span class="price-period">One-Time Lifetime</span>';
      }
      if (paymentDesc) {
        paymentDesc.textContent = 'Instant activation via UPI (Google Pay, PhonePe, Paytm, CRED) & RuPay.';
      }
      if (btnCheckoutText) {
        btnCheckoutText.textContent = '⚡ Pay ₹399 with UPI';
      }
      if (popularBadge) {
        popularBadge.textContent = 'INDIA EXCLUSIVE • UPI ENABLED';
      }

      if (isManual && isVpnSuspect) {
        if (regionStatus) {
          regionStatus.innerHTML = 'Showing <strong>₹399 INR</strong> (Requires active Indian UPI app or Indian bank account to checkout)';
        }
      }
    } else {
      if (btnInr) btnInr.classList.remove('active');
      if (btnUsd) btnUsd.classList.add('active');

      if (priceDisplay) {
        priceDisplay.innerHTML = '<span class="price-val">$12.99</span><span class="price-period">One-Time Lifetime</span>';
      }
      if (paymentDesc) {
        paymentDesc.textContent = 'Instant activation via Apple Pay, Google Pay & International Credit/Debit Cards.';
      }
      if (btnCheckoutText) {
        btnCheckoutText.textContent = 'Get Lifetime Pro - $12.99';
      }
      if (popularBadge) {
        popularBadge.textContent = 'GLOBAL LIFETIME PASS';
      }

      if (isManual && regionStatus) {
        regionStatus.innerHTML = 'Showing <strong>$12.99 USD</strong> (Global checkout via Apple Pay / Cards)';
      }
    }
  };

  async function detectLocation() {
    const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const isIndianTz = systemTz.includes('Kolkata') || systemTz.includes('Calcutta') || systemTz.includes('India');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        detectedCountry = data.country_code || 'IN';

        // Anti-VPN Verification:
        // If IP is reported as India (IN), but client system timezone is Western/US/EU, flag VPN proxy
        const isWesternTz = systemTz.startsWith('America/') || systemTz.startsWith('Europe/') || systemTz.startsWith('Australia/');
        if (detectedCountry === 'IN' && isWesternTz) {
          isVpnSuspect = true;
        }
      }
    } catch (err) {
      // Fallback to timezone if IP lookup times out
      detectedCountry = isIndianTz ? 'IN' : 'US';
    }

    // Apply detected price & security flags
    if (isVpnSuspect) {
      // VPN detected: enforce USD or warn
      window.setCurrency('USD');
      if (regionFlag) regionFlag.textContent = '🛡️';
      if (regionStatus) {
        regionStatus.innerHTML = 'VPN / Proxy detected. Standard pricing set to <strong>$12.99 USD</strong>. (Domestic ₹399 requires Indian UPI validation).';
      }
    } else if (detectedCountry === 'IN') {
      window.setCurrency('INR');
      if (regionFlag) regionFlag.textContent = '🇮🇳';
      if (regionStatus) {
        regionStatus.innerHTML = 'Detected region: <strong>India</strong> (Domestic UPI & RuPay Enabled)';
      }
    } else {
      window.setCurrency('USD');
      if (regionFlag) regionFlag.textContent = '🌐';
      if (regionStatus) {
        regionStatus.innerHTML = 'Detected region: <strong>International</strong> (Global Card & Apple Pay Checkout)';
      }
    }
  }

  detectLocation();
})();
