#!/usr/bin/env node
/** Opt-in smoke check using a running Ollama server and synthetic applicant data. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const model = process.argv[2];
if (!model) {
  console.error('Usage: node scripts/test-ollama-live.js (MODEL_NAME | --list-only) [http://127.0.0.1:11434]');
  process.exit(1);
}
const settings = {
  provider: 'ollama', enabled: true, modelOllama: model,
  ollamaBaseUrl: process.argv[3] || 'http://127.0.0.1:11434',
};
const context = vm.createContext({ fetch, URL, AbortController, setTimeout, clearTimeout, setInterval, clearInterval, console });
const source = name => fs.readFileSync(path.join(__dirname, '../src', name), 'utf8');
const runtime = { getPlatformInfo: cb => cb({}), id: 'smoke-test', getURL: p => `chrome-extension://smoke-test/${p}`,
  onInstalled: { addListener() {} }, onMessage: { addListener: fn => {
    runtime.sendMessage = (message, cb) => fn(message, { id: runtime.id, url: runtime.getURL('options.html') }, cb);
  } },
};
context.chrome = { runtime,
  commands: { onCommand: { addListener() {} } },
  storage: { local: { get: (_key, cb) => cb({ applyPilotLLM: settings }) } },
};
context.importScripts = name => vm.runInContext(source(name), context);
vm.runInContext(source('background.js'), context);
vm.runInContext(source('llm.js'), context);

(async () => {
  const start = Date.now();
  const models = await context.listOllamaModels(settings);
  console.log(`PASS: model discovery (${models.length} models)`);
  if (model === '--list-only') {
    console.log(models.join('\n'));
    return;
  }
  assert.ok(models.includes(model), 'Selected model must be listed by Ollama');
  const profile = { 'personal.email': 'test@example.com', 'work.currentTitle': 'Backend Engineer',
    'work.yearsOfExperience': '5', 'skills.technical': 'Java, SQL' };
  const mapping = await context.llmMatchFields([{ tagName: 'INPUT', type: 'email', clues: ['Email address'] }], profile);
  assert.equal(mapping[0], 'personal.email');
  console.log('PASS: field matching without API keys');
  const answer = await context.llmGenerateAnswer('What are your technical strengths?', profile);
  assert.ok(typeof answer === 'string' && answer.trim());
  console.log('PASS: single answer generation');
  const answers = await context.llmGenerateAnswers(['What are your technical strengths?'], profile);
  assert.ok(typeof answers[0] === 'string' && answers[0].trim());
  console.log('PASS: batch JSON answer generation');
  let ready;
  context.document = { addEventListener: (_event, cb) => { ready = cb; } };
  vm.runInContext(source('options.js').replace('  // ========== Language init ==========',
    '  globalThis.extractProfile = callLLMForExtraction; return;\n  // ========== Language init =========='), context);
  await ready();
  const extracted = await context.extractProfile({ type: 'text', content: 'Alex Example\nEmail: test@example.com\nBackend Engineer with 5 years of experience in Java and SQL.' }, settings);
  assert.equal(extracted.personal?.email, 'test@example.com');
  console.log('PASS: smart text import');
  console.log(`Model: ${model}; elapsed: ${((Date.now() - start) / 1000).toFixed(1)}s`);
})().catch(error => { console.error(error); process.exitCode = 1; });
