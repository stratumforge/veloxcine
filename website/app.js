// VeloxCine™ Live Simulator & Invisible Geo-Pricing

// 1. Simulator Aspect Switching
document.querySelectorAll('.sim-btn[data-aspect]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.sim-btn[data-aspect]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const aspect = btn.getAttribute('data-aspect');
    const screen = document.getElementById('sim-screen');
    if (screen) {
      screen.className = 'sim-screen-wrap aspect-' + aspect;
    }
  });
});

// 2. Simulator 16x Ad Warp
const btnWarp = document.getElementById('demo-ad-warp');
const adOverlay = document.getElementById('sim-ad-overlay');
const btnSkip = document.getElementById('btn-sim-skip');

if (btnWarp && adOverlay) {
  btnWarp.addEventListener('click', () => {
    adOverlay.classList.add('active');
    setTimeout(() => {
      if (btnSkip) btnSkip.textContent = 'Auto-Skipping in 0.01s...';
    }, 300);
    setTimeout(() => {
      adOverlay.classList.remove('active');
      if (btnSkip) btnSkip.textContent = 'Auto-Skipping in 0.05s...';
    }, 1200);
  });
}

if (btnSkip) {
  btnSkip.addEventListener('click', () => {
    if (adOverlay) adOverlay.classList.remove('active');
  });
}

// 3. Subtitle Dragger in Simulator
const subBox = document.getElementById('sim-sub-box');
if (subBox) {
  let isDragging = false;
  let startY = 0;
  let startBottom = 24;

  subBox.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startBottom = parseInt(window.getComputedStyle(subBox).bottom, 10) || 24;
    subBox.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dy = startY - e.clientY;
    const newBottom = Math.max(10, Math.min(220, startBottom + dy));
    subBox.style.bottom = newBottom + 'px';
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      subBox.style.cursor = 'grab';
    }
  });
}

// 4. Simulator Sliders (Dimmer, Font Size, Color)
const dimmerSlider = document.getElementById('sim-dimmer-slider');
const dimmerVal = document.getElementById('sim-dimmer-val');
const subText = document.getElementById('sim-sub-text');

if (dimmerSlider && dimmerVal && subText) {
  dimmerSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    dimmerVal.textContent = val + '%';
    subText.style.opacity = val / 100;
  });
}

const sizeSlider = document.getElementById('sim-size-slider');
const sizeVal = document.getElementById('sim-size-val');

if (sizeSlider && sizeVal && subText) {
  sizeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    sizeVal.textContent = val + 'px';
    subText.style.fontSize = val + 'px';
  });
}

document.querySelectorAll('.sim-color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.sim-color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    const color = dot.getAttribute('data-color');
    if (subText) subText.style.color = color;
  });
});

// 5. Lightbox Modal
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
  if (modal) modal.classList.remove('active');
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.closeLightbox();
});

// 6. Seamless Invisible Geo-Pricing (No toggles, single price only)
(async function initInvisiblePricing() {
  const priceVal = document.getElementById('price-val');
  const paymentDesc = document.getElementById('pro-payment-desc');
  const btnCheckoutText = document.getElementById('btn-pro-checkout-text');
  const popularBadge = document.getElementById('popular-badge');

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const isIndianTz = tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India');

  let isIndia = isIndianTz;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const country = data.country_code || '';
      // Anti-VPN: If IP says IN but system timezone is Western, classify as international
      const isWesternTz = tz.startsWith('America/') || tz.startsWith('Europe/') || tz.startsWith('Australia/');
      if (country === 'IN' && !isWesternTz) {
        isIndia = true;
      } else if (country !== 'IN') {
        isIndia = false;
      }
    }
  } catch (e) {
    // Keep timezone fallback
  }

  if (isIndia) {
    if (priceVal) priceVal.textContent = '₹399';
    if (paymentDesc) paymentDesc.textContent = 'Instant activation with UPI (Google Pay, PhonePe, Paytm, CRED) & RuPay.';
    if (btnCheckoutText) btnCheckoutText.textContent = 'Get Lifetime Pro • ₹399';
    if (popularBadge) popularBadge.textContent = 'SPECIAL LAUNCH OFFER • ONE-TIME';
  } else {
    if (priceVal) priceVal.textContent = '$12.99';
    if (paymentDesc) paymentDesc.textContent = 'Instant activation via Apple Pay, Google Pay & Credit/Debit Cards.';
    if (btnCheckoutText) btnCheckoutText.textContent = 'Get Lifetime Pro • $12.99';
    if (popularBadge) popularBadge.textContent = 'GLOBAL PASS • ONE-TIME';

  // Dodo Payments Checkout Endpoints
  const DODO_INR_CHECKOUT = "https://test.checkout.dodopayments.com/buy/pdt_0Nna6rkOllUVOkzJZyjJH?quantity=1";
  const DODO_USD_CHECKOUT = "https://test.checkout.dodopayments.com/buy/pdt_0Nna7ANhDbXXOE7kjmtdA?quantity=1";

  const btnCheckout = document.getElementById('btn-pro-checkout');
  if (btnCheckout) {
    btnCheckout.href = isIndia ? DODO_INR_CHECKOUT : DODO_USD_CHECKOUT;
    btnCheckout.target = "_blank";
    btnCheckout.rel = "noopener noreferrer";
  }

  }
})();
