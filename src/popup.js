/**
 * Apply Pilot - Popup 控制面板 / Control Panel
 */

document.addEventListener('DOMContentLoaded', async () => {
  // ── Init language ────────────────────────────────────────
  await I18n.init();
  applyLangUI(I18n.currentLang);
  I18n.apply();

  // ── Version ──────────────────────────────────────────────
  const versionEl = document.querySelector('.version');
  if (versionEl) {
    versionEl.textContent = 'v' + chrome.runtime.getManifest().version;
  }

  const btnScan    = document.getElementById('btnScan');
  const btnFillAll = document.getElementById('btnFillAll');
  const btnClear   = document.getElementById('btnClear');
  const openSettings = document.getElementById('openSettings');
  const messageEl  = document.getElementById('message');

  // ── Language toggle ──────────────────────────────────────
  document.getElementById('langEn').addEventListener('click', () => switchLang('en'));
  document.getElementById('langZh').addEventListener('click', () => switchLang('zh'));

  async function switchLang(lang) {
    await I18n.setLang(lang);
    applyLangUI(lang);
    I18n.apply();
  }

  function applyLangUI(lang) {
    document.getElementById('langEn').classList.toggle('active', lang === 'en');
    document.getElementById('langZh').classList.toggle('active', lang === 'zh');
  }

  // ── Injection ────────────────────────────────────────────
  const CONTENT_SCRIPTS = ['i18n.js', 'profile.js', 'matcher.js', 'llm.js', 'content.js'];
  const CONTENT_CSS = ['styles/overlay.css'];

  async function injectIfNeeded(tabId) {
    try {
      await chrome.scripting.insertCSS({ target: { tabId }, files: CONTENT_CSS });
      await chrome.scripting.executeScript({ target: { tabId }, files: CONTENT_SCRIPTS });
    } catch (e) {
      console.warn('[Apply Pilot] injection failed:', e);
    }
  }

  // ── Helpers ──────────────────────────────────────────────
  function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.style.color = isError ? '#f87171' : '#fbbf24';
    setTimeout(() => { messageEl.textContent = ''; }, 3000);
  }

  function updateStats(stats) {
    if (!stats) return;
    document.getElementById('totalFields').textContent   = stats.total   ?? '-';
    document.getElementById('matchedFields').textContent = stats.matched ?? '-';
    document.getElementById('filledFields').textContent  = stats.filled  ?? '-';
  }

  async function sendToTab(message, { inject = false } = {}) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showMessage(I18n.t('popup.msg.noTab'), true);
      return null;
    }
    if (inject) {
      await injectIfNeeded(tab.id);
    }
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          if (inject) showMessage(I18n.t('popup.msg.refresh'), true);
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  }

  // ── Scan ────────────────────────────────────────────────
  btnScan.addEventListener('click', async () => {
    btnScan.disabled = true;
    // Show "scanning" text inside the button (keep icon span)
    btnScan.querySelector('[data-i18n]').textContent = I18n.t('popup.msg.scanning');
    const llmSettings = await new Promise(resolve =>
      chrome.storage.local.get('applyPilotLLM', r => resolve(r.applyPilotLLM || {}))
    );
    const res = await sendToTab({
      action: 'scanAndFill',
      options: { useLLM: llmSettings.enabled === true, autoFill: false },
    }, { inject: true });
    if (res?.stats) {
      updateStats(res.stats);
      showMessage(I18n.t('popup.msg.scanDone'));
    }
    btnScan.disabled = false;
    btnScan.querySelector('[data-i18n]').textContent = I18n.t('popup.btn.scan');
  });

  // ── Fill all ────────────────────────────────────────────
  btnFillAll.addEventListener('click', async () => {
    const res = await sendToTab({ action: 'fillAll' });
    if (res?.stats) {
      updateStats(res.stats);
      showMessage(I18n.t('popup.msg.fillDone'));
    }
  });

  // ── Clear ───────────────────────────────────────────────
  btnClear.addEventListener('click', async () => {
    await sendToTab({ action: 'clearOverlay' });
    showMessage(I18n.t('popup.msg.cleared'));
    updateStats({ total: '-', matched: '-', filled: '-' });
  });

  // ── Open settings ───────────────────────────────────────
  openSettings.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // ── Init stats ──────────────────────────────────────────
  sendToTab({ action: 'getStats' }).then(res => {
    if (res?.stats) updateStats(res.stats);
  });
});
