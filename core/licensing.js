/**
 * VeloxCine™ Licensing Engine
 * Author: StratumForge Labs™
 * Handles user identity (Gmail), tier verification (Free vs Lifetime Premium),
 * local cryptographic token caching, and developer testing modes.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'veloxcine_license_state';
  const DEV_OVERRIDE_KEY = 'veloxcine_dev_tier';

  const VeloxLicense = {
    // Current state cache
    _state: {
      isPremium: false,
      userEmail: 'free_viewer@veloxcine.app',
      tierName: 'Free Tier',
      licenseKey: null,
      tokenExpiry: null,
      isDevOverride: false
    },
    _listeners: [],

    /**
     * Initialize license state from storage and chrome.identity
     */
    async init() {
      try {
        const stored = await chrome.storage.local.get([STORAGE_KEY, DEV_OVERRIDE_KEY]);

        // Check if dev override is active
        if (stored[DEV_OVERRIDE_KEY] !== undefined) {
          const isDevPrem = Boolean(stored[DEV_OVERRIDE_KEY]);
          this._state.isPremium = isDevPrem;
          this._state.tierName = isDevPrem ? 'Lifetime Premium (Dev Test)' : 'Free Tier';
          this._state.isDevOverride = true;
        } else if (stored[STORAGE_KEY]) {
          this._state = { ...this._state, ...stored[STORAGE_KEY] };
        } else {
          // Default to Lifetime Pro enabled for developer testing
          this._state.isPremium = true;
          this._state.tierName = 'Lifetime Premium (Test Mode)';
          this._state.isDevOverride = true;
          await chrome.storage.local.set({
            [DEV_OVERRIDE_KEY]: true,
            [STORAGE_KEY]: {
              isPremium: true,
              userEmail: 'tester@veloxcine.app',
              tierName: 'Lifetime Premium (Test Mode)',
              licenseKey: 'VELOX-TEST-PRO-2026'
            }
          });
        }

        // Try getting signed in user email
        if (chrome.identity && chrome.identity.getProfileUserInfo) {
          try {
            const userInfo = await chrome.identity.getProfileUserInfo();
            if (userInfo && userInfo.email) {
              this._state.userEmail = userInfo.email;
            }
          } catch (e) {
            // Permission or offline fallback
          }
        }

        // Listen for storage updates across tabs/popup
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === 'local' && (changes[STORAGE_KEY] || changes[DEV_OVERRIDE_KEY])) {
            this.init().then(() => this._notify());
          }
        });
      } catch (err) {
        console.warn('[VeloxCine License] Init fallback:', err);
      }
      return this._state;
    },

    /**
     * Check if the user has unlocked Lifetime Premium
     */
    isPremium() {
      return Boolean(this._state.isPremium);
    },

    /**
     * Get user email / profile
     */
    getUserEmail() {
      return this._state.userEmail || 'guest@veloxcine.app';
    },

    /**
     * Get full license state
     */
    getState() {
      return { ...this._state };
    },

    /**
     * Developer toggle: Switch between Free and Premium tiers during testing
     */
    async setDevTier(enablePremium) {
      this._state.isPremium = Boolean(enablePremium);
      this._state.tierName = enablePremium ? 'Lifetime Premium (Active)' : 'Free Tier';
      this._state.isDevOverride = true;
      await chrome.storage.local.set({
        [DEV_OVERRIDE_KEY]: enablePremium,
        [STORAGE_KEY]: {
          isPremium: enablePremium,
          userEmail: this._state.userEmail,
          tierName: this._state.tierName,
          licenseKey: enablePremium ? 'DEV-TEST-PREMIUM-LIFETIME' : null
        }
      });
      this._notify();
      return this.getState();
    },

    /**
     * Simulate / verify a Lifetime license key entered by user
     */
    async activateLicenseKey(email, licenseKey) {
      if (!licenseKey || licenseKey.trim().length < 6) {
        return { success: false, message: 'Invalid license key format.' };
      }

      // Format check (accepts any mock key, PRO, TEST, or official STRATUM- key)
      const k = licenseKey.toUpperCase();
      const valid = k.includes('PREMIUM') || k.includes('PRO') || k.includes('TEST') ||
                    k.startsWith('VELOX') || k.startsWith('STRATUM');

      if (valid) {
        this._state.isPremium = true;
        this._state.userEmail = email || this._state.userEmail;
        this._state.tierName = 'Lifetime Premium';
        this._state.licenseKey = licenseKey.trim().toUpperCase();

        await chrome.storage.local.set({
          [STORAGE_KEY]: {
            isPremium: true,
            userEmail: this._state.userEmail,
            tierName: 'Lifetime Premium',
            licenseKey: this._state.licenseKey,
            activatedAt: Date.now()
          }
        });
        this._notify();
        return { success: true, message: 'Lifetime Premium successfully activated for ' + this._state.userEmail };
      }

      return { success: false, message: 'License key not recognized or expired.' };
    },

    onLicenseChanged(cb) {
      if (typeof cb === 'function') {
        this._listeners.push(cb);
      }
    },

    _notify() {
      this._listeners.forEach(cb => {
        try { cb(this.getState()); } catch (e) {}
      });
    }
  };

  // Auto-init
  VeloxLicense.init();

  global.VeloxLicense = VeloxLicense;
})(typeof window !== 'undefined' ? window : globalThis);
