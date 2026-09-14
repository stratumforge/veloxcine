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

  const btnToggleDimmer = document.getElementById('btn-toggle-dimmer');
  const btnCycleAspect = document.getElementById('btn-cycle-aspect');
  const btnPlayground = document.getElementById('btn-playground');

  const upgradeModal = document.getElementById('upgrade-modal');
  const btnUpgrade = document.getElementById('btn-upgrade');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCheckout = document.getElementById('btn-checkout');

  const ptabs = document.querySelectorAll('.vc-ptab');
  const chkAspect = document.getElementById('chk-aspect');
  const rowAspectSelect = document.getElementById('row-aspect-select');
  const selAspect = document.getElementById('sel-aspect');
  const chkSubModifier = document.getElementById('chk-sub-modifier');
  const rowSubSelect = document.getElementById('row-sub-select');
  const selSubPos = document.getElementById('sel-sub-pos');
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
  if (btnToggleDimmer) {
    btnToggleDimmer.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_DIMMER' }).catch(() => {});
      }
    });
  }

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

    if (selAspect) selAspect.value = prof.defaultAspect || prof.customAspect || 'original';
    if (selSubPos) selSubPos.value = (prof.subPosition && !prof.subPosition.includes('%')) ? prof.subPosition : 'bottom-center';
    if (prof.brightness !== undefined && selDimmer) selDimmer.value = String(prof.brightness);

    if (prof.adWarpEnabled !== undefined && chkAdwarp) chkAdwarp.checked = prof.adWarpEnabled;
    if (prof.bingeEnabled !== undefined && chkBinge) chkBinge.checked = prof.bingeEnabled;
    if (prof.ytTheater !== undefined && chkYtTheater) chkYtTheater.checked = prof.ytTheater;
    if (prof.ytShorts !== undefined && chkYtShorts) chkYtShorts.checked = prof.ytShorts;
  }

  async function notifyActiveTab(update) {
    try {
      const tabs = await chrome.tabs.query({ active: true });
      for (const tab of tabs) {
        if (tab && tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'APPLY_SETTINGS_NOW',
            settings: update
          }).catch(() => {});
        }
      }
    } catch (e) {}
  }

  async function saveCurrentPlatformSettings() {
    const data = await chrome.storage.local.get('veloxcine_settings');
    const settings = data.veloxcine_settings || { global: {}, profiles: {} };

    const currentAspect = selAspect ? selAspect.value : 'original';
    const currentSubPos = selSubPos ? selSubPos.value : 'bottom-center';
    const currentBrightness = selDimmer ? parseInt(selDimmer.value, 10) : 100;

    const update = {
      aspectEnabled: currentAspect !== 'original',
      defaultAspect: currentAspect,
      customAspect: currentAspect,
      subEnabled: currentSubPos !== 'bottom-center',
      subPosition: currentSubPos,
      adWarpEnabled: chkAdwarp ? chkAdwarp.checked : true,
      bingeEnabled: chkBinge ? chkBinge.checked : true,
      ytTheater: chkYtTheater ? chkYtTheater.checked : false,
      ytShorts: chkYtShorts ? chkYtShorts.checked : false,
      brightness: currentBrightness
    };

    // Save to global AND active profile
    settings.global = { ...settings.global, ...update };
    if (currentPlatform !== 'global') {
      settings.profiles = settings.profiles || {};
      settings.profiles[currentPlatform] = { ...settings.profiles[currentPlatform], ...update };
    }

    await chrome.storage.local.set({ veloxcine_settings: settings });

    // Send immediate real-time update to the active video tab
    await notifyActiveTab(update);
  }

  if (selAspect) selAspect.addEventListener('change', saveCurrentPlatformSettings);
  if (selSubPos) selSubPos.addEventListener('change', saveCurrentPlatformSettings);
  if (selDimmer) selDimmer.addEventListener('change', saveCurrentPlatformSettings);
  if (chkAdwarp) chkAdwarp.addEventListener('change', saveCurrentPlatformSettings);
  if (chkBinge) chkBinge.addEventListener('change', saveCurrentPlatformSettings);
  if (chkYtTheater) chkYtTheater.addEventListener('change', saveCurrentPlatformSettings);
  if (chkYtShorts) chkYtShorts.addEventListener('change', saveCurrentPlatformSettings);

  // Auto-detect current tab platform
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.url) {
      if (activeTab.url.includes('youtube.com')) currentPlatform = 'youtube';
      else if (activeTab.url.includes('netflix.com')) currentPlatform = 'netflix';
      else if (activeTab.url.includes('primevideo.com') || activeTab.url.includes('amazon.')) currentPlatform = 'prime';
      else if (activeTab.url.includes('hotstar.com')) currentPlatform = 'hotstar';

      ptabs.forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-platform') === currentPlatform);
      });
    }
  } catch (e) {}

  await loadPlatformSettings(currentPlatform);

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

  // 8. Reset All Settings Handler (Placed inside DOMContentLoaded)
  const btnReset = document.getElementById('btn-reset-settings');
  if (btnReset) {
    btnReset.addEventListener('click', async (e) => {
      e.preventDefault();

      // 1. Reset all visual controls in popup UI
      if (selAspect) selAspect.value = 'original';
      if (selSubPos) selSubPos.value = 'bottom-center';
      if (selDimmer) selDimmer.value = '100';
      if (chkAdwarp) chkAdwarp.checked = true;
      if (chkBinge) chkBinge.checked = true;
      if (chkYtTheater) chkYtTheater.checked = false;
      if (chkYtShorts) chkYtShorts.checked = false;

      const defaultState = {
        aspectEnabled: false,
        defaultAspect: 'original',
        customAspect: 'original',
        subEnabled: false,
        subPosition: 'bottom-center',
        adWarpEnabled: true,
        bingeEnabled: true,
        ytTheater: false,
        ytShorts: false,
        brightness: 100
      };

      const defaultSettings = {
        global: { ...defaultState },
        profiles: {
          youtube: { ...defaultState },
          netflix: { ...defaultState },
          prime: { ...defaultState },
          hotstar: { ...defaultState }
        }
      };

      await chrome.storage.local.set({ veloxcine_settings: defaultSettings });

      // Notify active tab with RESET_SETTINGS action
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'RESET_SETTINGS',
            settings: defaultState
          }).catch(() => {});
        }
      } catch (err) {}

      const origText = btnReset.textContent;
      btnReset.textContent = '✓ Settings Reset to Defaults';
      btnReset.style.color = '#10b981';
      setTimeout(() => {
        btnReset.textContent = origText;
        btnReset.style.color = '';
      }, 2000);
    });
  }
});
