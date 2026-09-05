/** Apply Pilot - local Ollama transport shared by extension contexts. */
var DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

function ollamaBaseURL(value) {
  const url = new URL((value || DEFAULT_OLLAMA_BASE_URL).trim());
  if (!['http:', 'https:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Ollama: use a local server address, e.g. http://127.0.0.1:11434');
  }
  return url.origin;
}

// Both the options page and injected scripts use the same background transport.
function callOllama(settings, prompt, { json = false, maxTokens = 1024 } = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: 'ollamaChat',
      settings: { ollamaBaseUrl: settings.ollamaBaseUrl, modelOllama: settings.modelOllama },
      prompt, json, maxTokens,
    }, (response) => {
      const error = chrome.runtime.lastError;
      if (error || !response?.ok) {
        reject(new Error(error?.message || response?.error || 'Ollama: no response'));
      } else {
        resolve(response.text);
      }
    });
  });
}

function listOllamaModels(settings) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: 'ollamaListModels',
      settings: { ollamaBaseUrl: settings.ollamaBaseUrl },
    }, response => {
      const error = chrome.runtime.lastError;
      if (error || !response?.ok) {
        reject(new Error(error?.message || response?.error || 'Ollama: no response'));
      } else {
        resolve(response.models);
      }
    });
  });
}

// HTTP errors may have an empty/plain-text body. Preserve their status for the
// UI, but never hide an interrupted body read or malformed successful response.
async function readOllamaJSON(response) {
  try {
    return await response.json();
  } catch (error) {
    if (response.ok || error.name !== 'SyntaxError') throw error;
    return {};
  }
}

// Model discovery never loads or downloads a model and never sends profile data.
async function fetchOllamaModels(settings) {
  const baseUrl = ollamaBaseURL(settings.ollamaBaseUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET', signal: controller.signal, redirect: 'error', credentials: 'omit',
    });
    const data = await readOllamaJSON(response);
    if (!response.ok || data.error) {
      throw new Error(`Ollama ${response.status}: ${data.error || response.statusText || 'request failed'}`);
    }
    if (!Array.isArray(data.models) || data.models.some(model => typeof model?.name !== 'string' || !model.name.trim())) {
      throw new Error('Ollama: invalid model list');
    }
    return [...new Set(data.models.map(model => model.name))].sort();
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Ollama: model list timed out after 10 seconds');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Only called in the background worker. Never accepts arbitrary request paths.
async function fetchOllamaChat(settings, prompt, { json = false, maxTokens = 1024 } = {}) {
  const baseUrl = ollamaBaseURL(settings.ollamaBaseUrl);
  const model = (settings.modelOllama || '').trim();
  if (!model) throw new Error('Ollama: enter an installed model name (see ollama list)');
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('Ollama: empty prompt');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const body = {
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: { num_predict: Math.min(4096, Math.max(1, Number(maxTokens) || 1024)) },
    };
    if (json) body.format = 'json';
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: 'error',
      credentials: 'omit',
    });
    const data = await readOllamaJSON(response);
    if (!response.ok || data.error) {
      throw new Error(`Ollama ${response.status}: ${data.error || response.statusText || 'request failed'}`);
    }
    if (typeof data.message?.content !== 'string' || !data.message.content.trim()) {
      throw new Error('Ollama: model returned an empty answer; try a different model');
    }
    return data.message.content;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Ollama: request timed out after 120 seconds');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
