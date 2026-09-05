/** Ollama integration and existing cloud-provider regression checks. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = name => fs.readFileSync(path.join(__dirname, '../src', name), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function harness(settings = { provider: 'ollama', modelOllama: 'local:test', enabled: true }) {
  const calls = [];
  let listener;
  let reply = { message: { content: '{"0":"personal.email"}' } };
  let status = 200;
  const sender = { id: 'test-extension', url: 'https://jobs.example/apply' };
  const chrome = {
    runtime: {
      id: sender.id,
      getPlatformInfo: cb => cb({}),
      getURL: p => `chrome-extension://test-extension/${p}`,
      onMessage: { addListener: fn => { listener = fn; } },
      onInstalled: { addListener() {} },
      sendMessage: (message, callback) => listener(message, sender, callback),
    },
    commands: { onCommand: { addListener() {} } },
    storage: { local: {
      get: (key, cb) => cb({ applyPilotLLM: settings }),
      set: (data, cb) => { Object.assign(settings, data.applyPilotLLM); cb?.(); },
    } },
  };
  const context = vm.createContext({
    URL, AbortController, setTimeout, clearTimeout, setInterval, clearInterval, chrome,
    console: { warn() {} },
    fetch: async (url, init) => {
      calls.push({ url, init, body: init.body ? JSON.parse(init.body) : undefined });
      return { ok: status === 200, status, json: async () => reply };
    },
  });
  context.importScripts = name => vm.runInContext(source(name), context);
  vm.runInContext(source('background.js'), context);
  vm.runInContext(source('llm.js'), context);
  return { context, calls, settings, sender, chrome,
    respond: (data, code = 200) => { reply = data; status = code; },
    message: (message, from = sender) => new Promise(resolve => {
      const keepOpen = listener(message, from, resolve);
      if (!keepOpen) resolve(undefined);
    }),
  };
}

function optionsHarness(h) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', checked: false, style: {}, classList: { toggle() {}, add() {}, remove() {} },
      focus() { this.focused = true; }, select() { this.selected = true; }, scrollIntoView() { this.scrolled = true; },
      options: [], replaceChildren() { this.options = []; this.value = ''; },
      appendChild(option) { this.options.push(option); } });
    return elements.get(id);
  };
  let init;
  h.context.document = {
    addEventListener: (_event, callback) => { init = callback; },
    getElementById: element,
    createElement: () => ({}),
    querySelectorAll: () => [],
    querySelector: () => ({ dataset: { provider: h.settings.provider } }),
  };
  h.context.I18n = { t: (key, values) => key + ' ' + JSON.stringify(values || {}) };
  // Expose existing closure functions without running unrelated profile UI setup.
  const code = source('options.js').replace('  // ========== Language init ==========',
    '  globalThis.optionFunctions = { normalizeLLMModels, populateLLMSettings, collectLLMData, testLLMConnection, callLLMForExtraction, refreshOllamaModels, saveLLMData, ollamaSetupCommand, updateOllamaSetup, copyOllamaSetup }; return;\n  // ========== Language init ==========');
  vm.runInContext(code, h.context);
  init();
  h.context.optionFunctions.populateLLMSettings(h.settings);
  h.sender.url = h.chrome.runtime.getURL('options.html');
  return { ...h.context.optionFunctions, element };
}

test('Ollama field matching, single and batch answers work with no API keys through background', async () => {
  const h = harness();
  const profile = { 'personal.email': 'test@example.com' };
  assert.deepEqual(plain(await h.context.llmMatchFields([{ tagName: 'INPUT', type: 'email', clues: ['email'] }], profile)), { 0: 'personal.email' });
  h.respond({ message: { content: 'I build backend services.' } });
  assert.equal(await h.context.llmGenerateAnswer('Your strengths?', profile), 'I build backend services.');
  h.respond({ message: { content: '{"0":"I build backend services."}' } });
  assert.deepEqual(plain(await h.context.llmGenerateAnswers(['Your strengths?'], profile)), { 0: 'I build backend services.' });
  assert.equal(h.calls.length, 3);
  for (const call of h.calls) {
    assert.equal(call.url, 'http://127.0.0.1:11434/api/chat');
    assert.equal(call.body.model, 'local:test');
    assert.equal(call.body.stream, false);
    assert.equal(call.init.headers.Authorization, undefined);
    assert.equal(call.init.redirect, 'error');
  }
  assert.equal(h.calls[0].body.format, 'json');
  assert.equal(h.calls[1].body.format, undefined);
  assert.equal(h.calls[2].body.format, 'json');
});

test('disabled or unconfigured providers and empty question lists do not request inference', async () => {
  for (const settings of [
    { provider: 'ollama', enabled: false, modelOllama: 'local:test' },
    { provider: 'ollama', enabled: true, modelOllama: ' ' },
    { provider: 'openai', enabled: true },
    { provider: 'anthropic', enabled: true },
  ]) {
    const h = harness(settings);
    assert.deepEqual(plain(await h.context.llmMatchFields([], {})), {});
    assert.equal(await h.context.llmGenerateAnswer('Why?', {}), null);
    assert.deepEqual(plain(await h.context.llmGenerateAnswers(['Why?'], {})), {});
    assert.equal(h.calls.length, 0);
  }
  const h = harness();
  assert.deepEqual(plain(await h.context.llmGenerateAnswers([], {})), {});
  assert.equal(h.calls.length, 0);
});

test('old settings acquire local defaults without changing selected cloud provider or keys', async () => {
  const h = harness({ provider: 'openai', apiKeyOpenAI: 'saved-key', modelOpenAI: 'gpt-4o' });
  const loaded = await h.context.loadLLMSettings();
  assert.equal(loaded.provider, 'openai');
  assert.equal(loaded.apiKeyOpenAI, 'saved-key');
  assert.equal(loaded.modelOpenAI, 'gpt-5.6-terra');
  assert.equal(loaded.ollamaBaseUrl, 'http://127.0.0.1:11434');
  assert.equal(loaded.modelOllama, '');
});

test('cloud providers retain request headers, model and token settings', async () => {
  for (const provider of ['anthropic', 'openai']) {
    const h = harness({ provider, enabled: true, apiKey: 'claude-key', apiKeyOpenAI: 'openai-key' });
    h.respond(provider === 'anthropic' ? { content: [{ text: 'answer' }] } : { choices: [{ message: { content: 'answer' } }] });
    assert.equal(await h.context.llmGenerateAnswer('Why?', {}), 'answer');
    const call = h.calls[0];
    if (provider === 'anthropic') {
      assert.equal(call.url, 'https://api.anthropic.com/v1/messages');
      assert.equal(call.init.headers['x-api-key'], 'claude-key');
      assert.equal(call.body.max_tokens, 1024);
    } else {
      assert.equal(call.url, 'https://api.openai.com/v1/chat/completions');
      assert.equal(call.init.headers.Authorization, 'Bearer openai-key');
      assert.equal(call.body.max_completion_tokens, 1024);
      assert.equal(call.body.reasoning_effort, 'none');
    }
  }
});

test('only local root URLs are accepted, including custom ports and trailing slash', () => {
  const { context } = harness();
  for (const url of ['http://localhost:11435/', 'http://127.0.0.1:11434', 'http://[::1]:11434', 'https://localhost']) {
    assert.equal(context.ollamaBaseURL(url), new URL(url).origin);
  }
  for (const url of ['https://remote.example', 'file:///tmp/test', 'http://localhost.evil.com', 'http://user:secret@localhost', 'http://localhost/api', 'http://localhost/?target=remote', 'http://localhost/#x']) {
    assert.throws(() => context.ollamaBaseURL(url));
  }
});

test('background ignores page-supplied settings and rejects disabled or foreign requests', async () => {
  const h = harness();
  const request = { action: 'ollamaChat', prompt: 'Hi', settings: { ollamaBaseUrl: 'https://remote.example', modelOllama: 'wrong' } };
  assert.equal((await h.message(request)).ok, true);
  assert.equal(h.calls[0].body.model, 'local:test');
  h.settings.enabled = false;
  assert.equal((await h.message(request)).ok, false);
  assert.equal(await h.message(request, { id: 'other-extension' }), undefined);
  assert.equal(h.calls.length, 1);
});

test('options page can test unsaved local settings while automatic matching is disabled', async () => {
  const h = harness({ provider: 'ollama', enabled: false, modelOllama: 'local:test' });
  const ui = optionsHarness(h);
  ui.element('ollamaModel').value = 'unsaved:model';
  ui.element('ollamaBaseUrl').value = 'http://localhost:12345/';
  await ui.testLLMConnection();
  assert.equal(ui.element('testStatus').className, 'test-status success');
  assert.equal(h.calls[0].body.model, 'unsaved:model');
  assert.equal(h.calls[0].url, 'http://localhost:12345/api/chat');
  assert.equal(h.settings.modelOllama, 'local:test');
  assert.equal(ui.collectLLMData().modelOllama, 'unsaved:model');
});

test('Ollama smart import extracts text and rejects PDF before any request', async () => {
  const h = harness();
  const ui = optionsHarness(h);
  h.respond({ message: { content: '{"personal":{"fullName":"Test Applicant"}}' } });
  const result = await ui.callLLMForExtraction({ type: 'text', content: 'Test Applicant, backend engineer' }, h.settings);
  assert.equal(result.personal.fullName, 'Test Applicant');
  assert.equal(h.calls[0].body.format, 'json');
  assert.equal(h.calls[0].body.options.num_predict, 2048);
  await assert.rejects(ui.callLLMForExtraction({ type: 'pdf', base64: 'unused' }, h.settings), /ollamaNoPdf/);
  assert.equal(h.calls.length, 1);
});

test('API errors and malformed answers are visible in settings and safe in page matching', async () => {
  const h = harness();
  h.respond({ error: 'model not found' }, 404);
  await assert.rejects(h.context.callOllama(h.settings, 'Hi'), /404: model not found/);
  assert.deepEqual(plain(await h.context.llmMatchFields([], {})), {});
  const ui = optionsHarness(h);
  await ui.testLLMConnection();
  assert.equal(ui.element('testStatus').className, 'test-status error');
  assert.match(ui.element('testStatus').textContent, /model not found/);
  h.respond({ message: { content: '' } });
  await assert.rejects(h.context.callOllama(h.settings, 'Hi'), /empty answer/);
  h.respond({ message: { content: 'invalid JSON' } });
  assert.deepEqual(plain(await h.context.llmGenerateAnswers(['Why?'], {})), {});
});

test('network errors and timeouts propagate and timers are cleared', async () => {
  const h = harness();
  let cleared = 0;
  h.context.clearTimeout = timer => { cleared++; clearTimeout(timer); };
  h.context.fetch = async () => { throw new Error('Failed to fetch'); };
  await assert.rejects(h.context.fetchOllamaChat(h.settings, 'Hi'), /Failed to fetch/);
  h.context.setTimeout = fn => { fn(); return 1; };
  h.context.fetch = async (_url, { signal }) => {
    assert.equal(signal.aborted, true);
    throw Object.assign(new Error(), { name: 'AbortError' });
  };
  await assert.rejects(h.context.fetchOllamaChat(h.settings, 'Hi'), /120 seconds/);
  assert.equal(cleared, 2);
});

test('content modules tolerate repeated injection and options has the transport loaded first', () => {
  const h = harness();
  vm.runInContext(source('ollama.js'), h.context);
  vm.runInContext(source('llm.js'), h.context);
  const html = source('options.html');
  assert.ok(html.indexOf('src="ollama.js"') < html.indexOf('src="options.js"'));
  for (const file of ['background.js', 'popup.js']) {
    assert.match(source(file), /'ollama.js', 'llm.js'/);
  }
});


test('background keeps slow inference alive and releases its interval on success and failure', async () => {
  const h = harness();
  let ticks = 0;
  let cleared = 0;
  h.chrome.runtime.getPlatformInfo = cb => { ticks++; cb({}); };
  h.context.setInterval = (fn, milliseconds) => {
    assert.equal(milliseconds, 20000);
    fn();
    return 123;
  };
  h.context.clearInterval = id => { assert.equal(id, 123); cleared++; };
  await h.context.callOllama(h.settings, 'Hello');
  h.respond({ error: 'missing model' }, 404);
  await assert.rejects(h.context.callOllama(h.settings, 'Hello'), /missing model/);
  assert.equal(ticks, 2);
  assert.equal(cleared, 2);
});

test('model discovery lists the configured server with no key or inference request', async () => {
  const h = harness({ provider: 'ollama', enabled: false });
  h.sender.url = h.chrome.runtime.getURL('options.html');
  h.respond({ models: [{ name: 'zeta:8b' }, { name: 'alpha:3b' }, { name: 'zeta:8b' }] });
  assert.deepEqual(plain(await h.context.listOllamaModels({ ollamaBaseUrl: 'http://localhost:11435' })), ['alpha:3b', 'zeta:8b']);
  assert.equal(h.calls[0].url, 'http://localhost:11435/api/tags');
  assert.equal(h.calls[0].init.method, 'GET');
  assert.equal(h.calls[0].init.body, undefined);
  assert.equal(h.calls[0].init.redirect, 'error');
  const denied = await h.message({ action: 'ollamaListModels' }, { id: h.chrome.runtime.id, url: 'https://jobs.example' });
  assert.equal(denied.ok, false);
  assert.equal(h.calls.length, 1);
});

test('model discovery rejects malformed responses, errors and nonlocal addresses', async () => {
  const h = harness();
  h.respond({ models: [{ name: null }] });
  await assert.rejects(h.context.fetchOllamaModels({}), /invalid model list/);
  h.respond({ error: 'forbidden' }, 403);
  await assert.rejects(h.context.fetchOllamaModels({}), /403: forbidden/);
  await assert.rejects(h.context.fetchOllamaModels({ ollamaBaseUrl: 'https://example.com' }), /local server address/);
});

test('dropdown defaults to the first available model, persists it, and restores it on reload', async () => {
  const h = harness({ provider: 'ollama', enabled: false });
  const ui = optionsHarness(h);
  h.respond({ models: [{ name: 'beta:8b' }, { name: 'alpha:3b' }] });
  await ui.refreshOllamaModels();
  assert.equal(ui.element('ollamaModel').value, 'alpha:3b');
  assert.equal(ui.element('ollamaModel').disabled, false);
  assert.equal(h.settings.modelOllama, 'alpha:3b');
  ui.element('ollamaModel').value = 'beta:8b';
  ui.saveLLMData();
  const reloaded = optionsHarness(h);
  await reloaded.refreshOllamaModels();
  assert.equal(reloaded.element('ollamaModel').value, 'beta:8b');
  assert.equal(h.settings.modelOllama, 'beta:8b');
});

test('dropdown preserves a saved missing model and handles empty/offline states without changing settings', async () => {
  const h = harness();
  const ui = optionsHarness(h);
  h.respond({ models: [] });
  await ui.refreshOllamaModels();
  assert.equal(ui.element('ollamaModel').value, 'local:test');
  assert.equal(ui.element('ollamaModel').disabled, true);
  assert.match(ui.element('ollamaModelsStatus').textContent, /ollamaEmpty/);
  h.respond({ models: [{ name: 'other:model' }] });
  await ui.refreshOllamaModels();
  const savedOption = ui.element('ollamaModel').options.find(o => o.value === 'local:test');
  assert.equal(savedOption.disabled, true);
  assert.equal(ui.element('ollamaModel').value, 'local:test');
  h.context.fetch = async () => { throw new Error('Connection refused'); };
  await ui.refreshOllamaModels();
  assert.match(ui.element('ollamaModelsStatus').textContent, /Connection refused/);
  assert.equal(ui.element('refreshOllamaModels').disabled, false);
  assert.equal(h.settings.modelOllama, 'local:test');
});

test('late model responses cannot overwrite a newer server list or default', async () => {
  const h = harness({ provider: 'ollama', enabled: false });
  const ui = optionsHarness(h);
  const pending = [];
  h.context.listOllamaModels = () => new Promise(resolve => pending.push(resolve));
  const first = ui.refreshOllamaModels();
  ui.element('ollamaBaseUrl').value = 'http://localhost:11435';
  const second = ui.refreshOllamaModels();
  pending[1](['current:model']);
  await second;
  pending[0](['old:model']);
  await first;
  assert.equal(ui.element('ollamaModel').value, 'current:model');
  assert.equal(h.settings.modelOllama, 'current:model');
  assert.equal(h.settings.ollamaBaseUrl, 'http://localhost:11435');
});

test('setup commands use the current extension origin and preserve existing origins', () => {
  const h = harness();
  const ui = optionsHarness(h);
  h.chrome.runtime.id = 'abcdefghijklmnopabcdefghijklmnop';
  const origin = `chrome-extension://${h.chrome.runtime.id}`;
  for (const platform of ['mac', 'win', 'linux']) {
    const command = ui.ollamaSetupCommand(platform);
    assert.ok(command.includes(origin));
    assert.ok(!command.includes('chrome-extension://*'));
  }
  assert.match(ui.ollamaSetupCommand('mac'), /\$\(launchctl getenv OLLAMA_ORIGINS\)/);
  assert.ok(ui.ollamaSetupCommand('mac').includes('${applyPilotOrigins:+$applyPilotOrigins,}'));
  assert.match(ui.ollamaSetupCommand('win'), /GetEnvironmentVariable\('OLLAMA_ORIGINS', 'User'\)/);
  assert.match(ui.ollamaSetupCommand('win'), /SetEnvironmentVariable/);
  assert.ok(ui.ollamaSetupCommand('linux').includes('${OLLAMA_ORIGINS:+$OLLAMA_ORIGINS,}'));
});

test('setup updates platform-specific text and copies only the displayed command', async () => {
  const h = harness();
  const ui = optionsHarness(h);
  ui.element('ollamaSetupPlatform').value = 'mac';
  ui.updateOllamaSetup();
  let copied;
  h.context.navigator = { clipboard: { writeText: async text => { copied = text; } } };
  await ui.copyOllamaSetup();
  assert.equal(copied, ui.ollamaSetupCommand('mac'));
  assert.match(ui.element('ollamaSetupCopyStatus').textContent, /setupCopied/);
  ui.element('ollamaSetupPlatform').value = 'win';
  ui.updateOllamaSetup();
  assert.equal(ui.element('ollamaSetupCommand').value, ui.ollamaSetupCommand('win'));
  assert.match(ui.element('ollamaSetupNote').textContent, /setupNote.win/);
  assert.equal(ui.element('ollamaSetupCopyStatus').textContent, '');
  assert.equal(h.calls.length, 0);
});

test('blocked clipboard access selects the command for manual copying', async () => {
  const h = harness();
  const ui = optionsHarness(h);
  h.context.navigator = { clipboard: { writeText: async () => { throw new Error('denied'); } } };
  await ui.copyOllamaSetup();
  assert.equal(ui.element('ollamaSetupCommand').selected, true);
  assert.match(ui.element('ollamaSetupCopyStatus').textContent, /setupCopyFailed/);
});

test('403 from connection test or model discovery expands the setup guidance', async () => {
  const h = harness();
  const ui = optionsHarness(h);
  h.respond({ error: 'Forbidden' }, 403);
  await ui.testLLMConnection();
  assert.equal(ui.element('ollamaSetupDetails').open, true);
  assert.match(ui.element('testStatus').textContent, /setupForbidden/);
  assert.doesNotMatch(ui.element('testStatus').textContent, /networkError/);
  ui.element('ollamaSetupDetails').open = false;
  await ui.refreshOllamaModels();
  assert.equal(ui.element('ollamaSetupDetails').open, true);
  ui.element('ollamaSetupDetails').open = false;
  h.respond({ error: 'model not found' }, 404);
  await ui.testLLMConnection();
  assert.equal(ui.element('ollamaSetupDetails').open, false);
});

// Use native Response parsing: a mocked json() returning an object cannot
// reproduce the empty/plain-text error responses emitted by Ollama's CORS layer.
for (const status of [403, 404]) {
  for (const [bodyName, body] of [['empty', null], ['plain-text', 'Forbidden'], ['JSON', '{"error":"Forbidden"}']]) {
    test(`${bodyName} HTTP ${status} preserves status and only 403 opens setup in both UI paths`, async () => {
      for (const action of ['refreshOllamaModels', 'testLLMConnection']) {
        const h = harness();
        const ui = optionsHarness(h);
        h.context.fetch = async () => new Response(body, {
          status, statusText: status === 403 ? 'Forbidden' : 'Not Found',
        });
        await ui[action]();
        assert.equal(ui.element('ollamaSetupDetails').open === true, status === 403, action);
        const message = ui.element(action === 'refreshOllamaModels' ? 'ollamaModelsStatus' : 'testStatus').textContent;
        if (action === 'testLLMConnection' && status === 403) {
          assert.match(message, /setupForbidden/);
        } else {
          assert.ok(message.includes(`Ollama ${status}:`), message);
        }
        assert.doesNotMatch(message, /Unexpected|SyntaxError/);
      }
    });
  }
}

test('timeout during response body reading remains a timeout for discovery and chat', async () => {
  for (const status of [200, 403]) {
    for (const method of ['fetchOllamaModels', 'fetchOllamaChat']) {
      const h = harness();
      let expire;
      let cleared = false;
      h.context.setTimeout = fn => { expire = fn; return 123; };
      h.context.clearTimeout = id => { assert.equal(id, 123); cleared = true; };
      h.context.fetch = async (_url, { signal }) => new Response(new ReadableStream({
        start(controller) {
          signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
        },
      }), { status });
      const request = h.context[method](h.settings, 'Hello');
      // Let fetch resolve before cancelling the still-pending body read.
      await Promise.resolve();
      expire();
      const seconds = method === 'fetchOllamaModels' ? 10 : 120;
      await assert.rejects(request, new RegExp(`timed out after ${seconds} seconds`));
      assert.equal(cleared, true);
    }
  }
});

test('a broken response stream is not converted into an HTTP or JSON error', async () => {
  for (const method of ['fetchOllamaModels', 'fetchOllamaChat']) {
    const h = harness();
    h.context.fetch = async () => new Response(new ReadableStream({
      start(controller) { controller.error(new TypeError('connection reset during body read')); },
    }), { status: 403 });
    await assert.rejects(h.context[method](h.settings, 'Hello'), {
      name: 'TypeError', message: 'connection reset during body read',
    });
  }
});

test('malformed successful JSON remains an error rather than an empty list or answer', async () => {
  for (const method of ['fetchOllamaModels', 'fetchOllamaChat']) {
    const h = harness();
    h.context.fetch = async () => new Response('not JSON', { status: 200 });
    await assert.rejects(h.context[method](h.settings, 'Hello'), { name: 'SyntaxError' });
  }
});
