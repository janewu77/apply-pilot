/**
 * Apply Pilot - Background Service Worker
 * 处理快捷键和扩展消息
 */

importScripts('ollama.js');

const CONTENT_SCRIPTS = ['i18n.js', 'profile.js', 'matcher.js', 'ollama.js', 'llm.js', 'content.js'];
const CONTENT_CSS = ['styles/overlay.css'];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!['ollamaChat', 'ollamaListModels'].includes(message?.action) || sender.id !== chrome.runtime.id) return;
  (async () => {
    // Only settings-page actions may use unsaved configuration. Page scripts
    // must use the saved, enabled provider; this is not a general fetch proxy.
    const fromOptions = sender.url === chrome.runtime.getURL('options.html');
    if (message.action === 'ollamaListModels') {
      if (!fromOptions) throw new Error('Model discovery is only available in settings');
      const models = await fetchOllamaModels(message.settings || {});
      sendResponse({ ok: true, models });
      return;
    }
    const settings = fromOptions ? message.settings : await new Promise(resolve =>
      chrome.storage.local.get('applyPilotLLM', result => resolve(result.applyPilotLLM || {}))
    );
    if (!fromOptions && (!settings.enabled || settings.provider !== 'ollama')) {
      throw new Error('Ollama is not enabled');
    }
    // Model loading/generation can exceed Chrome's 30-second idle window.
    // Renew the worker only while this bounded (120s) inference is in flight.
    const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(() => {}), 20000);
    try {
      const text = await fetchOllamaChat(settings, message.prompt, {
        json: message.json === true, maxTokens: message.maxTokens,
      });
      sendResponse({ ok: true, text });
    } finally {
      clearInterval(keepAlive);
    }
  })().catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

async function injectIfNeeded(tabId) {
  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: CONTENT_CSS });
    await chrome.scripting.executeScript({ target: { tabId }, files: CONTENT_SCRIPTS });
  } catch (e) {
    console.warn('[Apply Pilot] injection failed:', e);
  }
}

// 监听快捷键
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill-form') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await injectIfNeeded(tab.id);
      const llmSettings = await new Promise(resolve =>
        chrome.storage.local.get('applyPilotLLM', r => resolve(r.applyPilotLLM || {}))
      );
      chrome.tabs.sendMessage(tab.id, {
        action: 'scanAndFill',
        options: { useLLM: llmSettings.enabled === true, autoFill: false },
      });
    }
  }
});

// 安装时打开设置页面
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});
