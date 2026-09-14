/**
 * VeloxCine™ Popup Logic (StratumForge Labs™)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const emailElem = document.getElementById('user-email');
  const tierBadge = document.getElementById('tier-badge');
  const devToggle = document.getElementById('dev-tier-toggle');
  const devState = document.getElementById('dev-tier-state');
  const licenseInput = document.getElementById('license-input');
  const btnActivate = document.getElementById('btn-activate');
  const licenseMsg = document.getElementById('license-msg');

  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  const btnToggleHud = document.getElementById('btn-toggle-hud');
  const btnCycleAspect = document.getElementById('btn-cycle-aspect');
  const btnPlayground = document.getElementById('btn-playground');

  const upgradeModal = document.getElementById('upgrade-modal');
  const btnUpgrade = document.getElementById('btn-upgrade');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCheckout = document.getElementById('btn-checkout');

  const ptabs = document.querySelectorAll('.vc-ptab');
  const selAspect = document.getElementById('sel-aspect');
  const chkAdwarp = document.getElementById('chk-adwarp');
  const chkBinge = document.getElementById('chk-binge');
  const chkYtTheater = document.getElementById('chk-yt-theater');
  const chkYtShorts = document.getElementById('chk-yt-shorts');
  const selDimmer = document.getElementById('sel-dimmer');

  let currentPlatform = 'global';

  // 1. Sync License State
  async function updateLicenseUI() {
    const licState = await VeloxLicense.getState();
    if (emailElem) emailElem.textContent = licState.userEmail || 'free_viewer@veloxcine.app';

    if (licState.isPremium) {
      tierBadge.textContent = 'LIFETIME PRO';
      tierBadge.classList.add('premium');
      devToggle.checked = true;
      devState.textContent = 'Premium';
      devState.style.color = '#fbbf24';
      if (btnUpgrade) btnUpgrade.style.display = 'none';
    } else {
      tierBadge.textContent = 'FREE TIER';
      tierBadge.classList.remove('premium');
      devToggle.checked = false;
      devState.textContent = 'Free';
      devState.style.color = '#94a3b8';
      if (btnUpgrade) btnUpgrade.style.display = 'inline-block';
    }
  }

  await updateLicenseUI();
  VeloxLicense.onLicenseChanged(updateLicenseUI);

  // 2. Dev Tier Toggle
  devToggle.addEventListener('change', async (e) => {
    await VeloxLicense.setDevTier(e.target.checked);
    await updateLicenseUI();
    licenseMsg.textContent = e.target.checked
      ? '⚡ Dev Mode: Lifetime Premium Activated'
      : '⚡ Dev Mode: Free Tier Activated';
    licenseMsg.className = 'vc-msg success';
  });

  // 3. License Key Activation
  btnActivate.addEventListener('click', async () => {
    const key = licenseInput.value.trim();
    licenseMsg.textContent = 'Verifying key...';
    licenseMsg.className = 'vc-msg';

    const res = await VeloxLicense.activateLicenseKey(emailElem ? emailElem.textContent : '', key);
    if (res.success) {
      licenseMsg.textContent = res.message;
      licenseMsg.className = 'vc-msg success';
      await updateLicenseUI();
    } else {
      licenseMsg.textContent = res.message;
      licenseMsg.className = 'vc-msg error';
    }
  });

  // 4. Check Active Tab Status
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (res) => {
        if (chrome.runtime.lastError || !res) {
          statusDot.classList.remove('active');
          statusText.textContent = 'No streaming video in active tab';
        } else {
          statusDot.classList.add('active');
          const pName = res.platform ? res.platform.toUpperCase() : 'HTML5';
          statusText.textContent = `Connected: ${pName} Player (${res.videoBound ? 'Video Active' : 'Waiting for video'})`;
        }
      });
    }
  } catch (e) {
    statusText.textContent = 'Ready for playback';
  }

  // 5. Trigger Buttons
  btnToggleHud.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_HUD' }).catch(() => {});
    }
  });

  btnCycleAspect.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'CYCLE_ASPECT' }).catch(() => {});
    }
  });

  if (btnPlayground) {
    btnPlayground.addEventListener('click', () => {
      const playgroundUrl = chrome.runtime.getURL('test-playground/index.html');
      chrome.tabs.create({ url: playgroundUrl });
    });
  }

  if (btnUpgrade) {
    btnUpgrade.addEventListener('click', () => {
      upgradeModal.style.display = 'flex';
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      upgradeModal.style.display = 'none';
    });
  }

  // Platform Profile Switching
  ptabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      ptabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPlatform = tab.getAttribute('data-platform');
      await loadPlatformSettings(currentPlatform);
    });
  });

  async function loadPlatformSettings(platform) {
    const data = await chrome.storage.local.get('veloxcine_settings');
    const settings = data.veloxcine_settings || {};
    const prof = platform === 'global' ? (settings.global || {}) : (settings.profiles?.[platform] || {});

    if (prof.defaultAspect || prof.customAspect) selAspect.value = prof.defaultAspect || prof.customAspect;
    if (prof.adWarpEnabled !== undefined) chkAdwarp.checked = prof.adWarpEnabled;
    if (prof.bingeEnabled !== undefined) chkBinge.checked = prof.bingeEnabled;
    if (prof.ytTheater !== undefined) chkYtTheater.checked = prof.ytTheater;
    if (prof.ytShorts !== undefined) chkYtShorts.checked = prof.ytShorts;
    if (prof.brightness !== undefined) selDimmer.value = String(prof.brightness);
  }

  async function saveCurrentPlatformSettings() {
    const data = await chrome.storage.local.get('veloxcine_settings');
    const settings = data.veloxcine_settings || { global: {}, profiles: {} };

    const update = {
      defaultAspect: selAspect.value,
      customAspect: selAspect.value,
      adWarpEnabled: chkAdwarp.checked,
      bingeEnabled: chkBinge.checked,
      ytTheater: chkYtTheater.checked,
      ytShorts: chkYtShorts.checked,
      brightness: parseInt(selDimmer.value, 10)
    };

    if (currentPlatform === 'global') {
      settings.global = { ...settings.global, ...update };
    } else {
      settings.profiles = settings.profiles || {};
      settings.profiles[currentPlatform] = { ...settings.profiles[currentPlatform], ...update };
    }

    await chrome.storage.local.set({ veloxcine_settings: settings });
  }

  selAspect.addEventListener('change', saveCurrentPlatformSettings);
  chkAdwarp.addEventListener('change', saveCurrentPlatformSettings);
  chkBinge.addEventListener('change', saveCurrentPlatformSettings);
  chkYtTheater.addEventListener('change', saveCurrentPlatformSettings);
  chkYtShorts.addEventListener('change', saveCurrentPlatformSettings);
  selDimmer.addEventListener('change', saveCurrentPlatformSettings);

  await loadPlatformSettings('global');

  // 6. Regional Pricing for Popup Modal
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const isIndian = tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India');
  const priceAmount = document.getElementById('popup-price-amount');
  const pricePeriod = document.getElementById('popup-price-period');

  const dodoInr = "https://test.checkout.dodopayments.com/buy/pdt_0Nna6rkOllUVOkzJZyjJH?quantity=1";
  const dodoUsd = "https://test.checkout.dodopayments.com/buy/pdt_0Nna7ANhDbXXOE7kjmtdA?quantity=1";

  if (priceAmount && pricePeriod) {
    if (isIndian) {
      priceAmount.textContent = '₹399';
      pricePeriod.textContent = 'One-Time Lifetime (UPI & RuPay)';
      if (btnCheckout) btnCheckout.textContent = '⚡ Unlock with UPI (₹399)';
    } else {
      priceAmount.textContent = '$12.99';
      pricePeriod.textContent = 'One-Time Lifetime (Apple Pay & Cards)';
      if (btnCheckout) btnCheckout.textContent = 'Unlock Lifetime ($12.99)';
    }
  }

  // 7. Dodo Checkout Trigger in Extension Popup
  if (btnCheckout) {
    btnCheckout.addEventListener('click', (e) => {
      e.preventDefault();
      const checkoutUrl = isIndian ? dodoInr : dodoUsd;
      chrome.tabs.create({ url: checkoutUrl });
      upgradeModal.style.display = 'none';
    });
  }
});
