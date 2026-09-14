/**
 * VeloxCine™™ Background Service Worker (Manifest V3)
 * Author: StratumForge Labs™
 */

// Initialize storage defaults upon install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[VeloxCine™] Extension installed/updated:', details.reason);

  const defaults = {
    veloxcine_settings: {
      global: {
        adWarpEnabled: true,
        autoMute: true,
        defaultAspect: 'original',
        subtitles: {
          fontSize: 24,
          fontColor: '#ffffff',
          brightness: 100,
          preset: 'bottom-center'
        }
      },
      profiles: {
        netflix: { customAspect: 'ultrawide', autoSkipIntro: true },
        prime: { customAspect: 'original', autoSkipAd: true },
        hotstar: { customAspect: 'crop169', autoSkipAd: true },
        appletv: { customAspect: 'original', autoSkipAd: true }
      }
    }
  };

  const existing = await chrome.storage.local.get('veloxcine_settings');
  if (!existing.veloxcine_settings) {
    await chrome.storage.local.set(defaults);
  }

  // Set default badge
  await chrome.action.setBadgeBackgroundColor({ color: '#00e5ff' });
  await chrome.action.setBadgeText({ text: 'VC' });
});

// Handle keyboard shortcuts defined in manifest
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  if (command === 'toggle-hud') {
    chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_HUD' }).catch(() => {});
  } else if (command === 'cycle-aspect') {
    chrome.tabs.sendMessage(tab.id, { action: 'CYCLE_ASPECT' }).catch(() => {});
  }
});

// Message listener from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_PLAYGROUND') {
    const playgroundUrl = chrome.runtime.getURL('test-playground/index.html');
    chrome.tabs.create({ url: playgroundUrl });
    sendResponse({ success: true });
  }
  return true;
});
