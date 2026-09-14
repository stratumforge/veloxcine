/**
 * VeloxCine™ Popup Logic
 * Author: StratumForge Labs™
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

  // Platform tabs & settings
  const ptabs = document.querySelectorAll('.vc-ptab');
  const selAspect = document.getElementById('sel-aspect');
  const chkAdwarp = document.getElementById('chk-adwarp');
  const chkAutomute = document.getElementById('chk-automute');
  const selDimmer = document.getElementById('sel-dimmer');

  let currentPlatform = 'global';

  // 1. Sync License State
  async function updateLicenseUI() {
    const licState = await VeloxLicense.getState();
    emailElem.textContent = licState.userEmail || 'guest@veloxcine.app';

    if (licState.isPremium) {
      tierBadge.textContent = 'LIFETIME PRO';
      tierBadge.classList.add('premium');
      devToggle.checked = true;
      devState.textContent = 'Premium';
      devState.style.color = '#fbbf24';
      btnUpgrade.style.display = 'none';
    } else {
      tierBadge.textContent = 'FREE TIER';
      tierBadge.classList.remove('premium');
      devToggle.checked = false;
      devState.textContent = 'Free';
      devState.style.color = '#94a3b8';
      btnUpgrade.style.display = 'block';
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

    const res = await VeloxLicense.activateLicenseKey(emailElem.textContent, key);
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

  // 5. HUD & Aspect Trigger Buttons
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

  // 6. Launch Playground
  btnPlayground.addEventListener('click', () => {
    const playgroundUrl = chrome.runtime.getURL('test-playground/index.html');
    chrome.tabs.create({ url: playgroundUrl });
  });

  // 7. Upgrade Modal
  btnUpgrade.addEventListener('click', () => upgradeModal.style.display = 'flex');
  btnCloseModal.addEventListener('click', () => upgradeModal.style.display = 'none');
  btnCheckout.addEventListener('click', async () => {
    // Mock checkout success
    await VeloxLicense.setDevTier(true);
    await updateLicenseUI();
    upgradeModal.style.display = 'none';
  });

  // 8. Platform Profile Tab switching
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
    if (prof.autoMute !== undefined) chkAutomute.checked = prof.autoMute;
    if (prof.brightness !== undefined) selDimmer.value = String(prof.brightness);
  }

  async function saveCurrentPlatformSettings() {
    const data = await chrome.storage.local.get('veloxcine_settings');
    const settings = data.veloxcine_settings || { global: {}, profiles: {} };

    const update = {
      defaultAspect: selAspect.value,
      customAspect: selAspect.value,
      adWarpEnabled: chkAdwarp.checked,
      autoMute: chkAutomute.checked,
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
  chkAutomute.addEventListener('change', saveCurrentPlatformSettings);
  selDimmer.addEventListener('change', saveCurrentPlatformSettings);

  // Load initial settings
  await loadPlatformSettings('global');
});
