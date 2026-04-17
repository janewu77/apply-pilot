/**
 * Apply Pilot - Options page logic
 * Manages profile editing, LLM config, import/export, and language switching.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ========== Language init ==========
  await I18n.init();
  applyLangUI(I18n.currentLang);
  I18n.apply();

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

  // ========== Tab switching ==========
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // ========== Load profile data ==========
  const profile = await loadProfileFromStorage();
  populateForm(profile);
  renderLearnedQaItems(profile);

  // ========== Load LLM settings ==========
  const llmSettings = await loadLLMFromStorage();
  populateLLMSettings(llmSettings);

  // ========== Auto-save (profile fields) ==========
  let saveTimer = null;
  function bindDataKeyInput(input) {
    const events = input.tagName === 'SELECT' ? ['change'] : ['input', 'change'];
    events.forEach(evt => {
      input.addEventListener(evt, () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveAllData, 500);
      });
    });
  }
  document.querySelectorAll('[data-key]').forEach(bindDataKeyInput);

  // ========== Provider switching ==========
  document.querySelectorAll('.provider-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.provider-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');

      const provider = option.dataset.provider;
      document.querySelectorAll('.provider-config').forEach(c => c.style.display = 'none');
      document.getElementById(`config-${provider}`).style.display = 'block';

      saveLLMData();
    });
  });

  // ========== LLM enable toggle ==========
  document.getElementById('llmEnabled').addEventListener('change', () => {
    const config = document.getElementById('llmConfig');
    config.style.opacity = document.getElementById('llmEnabled').checked ? '1' : '0.5';
    saveLLMData();
  });

  // ========== API Key visibility ==========
  document.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });

  // ========== LLM auto-save ==========
  document.querySelectorAll('[data-llm]').forEach(input => {
    input.addEventListener('change', saveLLMData);
    input.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveLLMData, 500);
    });
  });

  // ========== Test connection ==========
  document.getElementById('testConnection').addEventListener('click', testLLMConnection);

  // ========== Add custom Q&A ==========
  document.getElementById('addQaBtn').addEventListener('click', addCustomQA);

  // ========== Export ==========
  document.getElementById('exportBtn').addEventListener('click', exportProfile);

  document.getElementById('exportQaBtn').addEventListener('click', exportQaOnly);
  document.getElementById('importQaBtn').addEventListener('click', () => {
    document.getElementById('importQaFile').click();
  });
  document.getElementById('importQaFile').addEventListener('change', importQaOnly);

  // ========== Import ==========
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importProfile);

  // ========== Reset ==========
  document.getElementById('resetBtn').addEventListener('click', resetAllData);

  // ========== Smart import ==========
  const smartImportZone = document.getElementById('smartImportZone');
  const smartImportFile = document.getElementById('smartImportFile');

  smartImportZone.addEventListener('click', () => smartImportFile.click());
  smartImportFile.addEventListener('change', (e) => {
    if (e.target.files[0]) handleSmartImport(e.target.files[0]);
    e.target.value = '';
  });

  smartImportZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    smartImportZone.classList.add('dragover');
  });
  smartImportZone.addEventListener('dragleave', () => {
    smartImportZone.classList.remove('dragover');
  });
  smartImportZone.addEventListener('drop', (e) => {
    e.preventDefault();
    smartImportZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleSmartImport(e.dataTransfer.files[0]);
  });

  document.getElementById('applyImportBtn').addEventListener('click', applySmartImport);
  document.getElementById('cancelImportBtn').addEventListener('click', cancelSmartImport);


  // =============================================
  // Function implementations
  // =============================================

  function loadProfileFromStorage() {
    return new Promise(resolve => {
      chrome.storage.local.get('applyPilotProfile', result => {
        resolve(result.applyPilotProfile || {});
      });
    });
  }

  /**
   * Deep-merge form data over existing stored data,
   * preserving keys not present in the form (e.g. learnedAnswerMeta).
   */
  function deepMergeProfile(existing, fromForm) {
    const ex = (existing && typeof existing === 'object')
      ? JSON.parse(JSON.stringify(existing))
      : {};
    if (!fromForm || typeof fromForm !== 'object') return ex;

    function merge(target, source) {
      for (const [k, v] of Object.entries(source)) {
        if (v === undefined) continue;
        if (
          v !== null &&
          typeof v === 'object' &&
          !Array.isArray(v) &&
          target[k] !== null &&
          typeof target[k] === 'object' &&
          !Array.isArray(target[k])
        ) {
          merge(target[k], v);
        } else {
          target[k] = v;
        }
      }
    }
    merge(ex, fromForm);
    return ex;
  }

  function removeLearnedQaDom() {
    document.querySelectorAll('#qaContainer .qa-item[data-learned-key]').forEach((el) => el.remove());
  }

  /**
   * Render auto-learned Q&A entries from learnedAnswerMeta.
   */
  function renderLearnedQaItems(profile) {
    const meta = profile.learnedAnswerMeta;
    if (!meta || typeof meta !== 'object') return;

    const container = document.getElementById('qaContainer');
    for (const [key, entry] of Object.entries(meta)) {
      if (!entry || typeof entry !== 'object') continue;
      const sel = `textarea[data-key="commonAnswers.${key}"]`;
      if (container.querySelector(sel)) continue;

      const qaItem = document.createElement('div');
      qaItem.className = 'qa-item';
      qaItem.dataset.learnedKey = key;

      const labelEl = document.createElement('label');
      const badge = document.createElement('span');
      badge.className = 'learned-badge';
      badge.dataset.i18n = 'options.qa.learnedBadge';
      badge.textContent = I18n.t('options.qa.learnedBadge');
      labelEl.appendChild(badge);
      labelEl.appendChild(document.createTextNode(` ${entry.label || key}`));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'qa-delete-btn';
      delBtn.dataset.i18n = 'options.qa.deleteBtn';
      delBtn.textContent = I18n.t('options.qa.deleteBtn');
      delBtn.addEventListener('click', () => {
        void removeLearnedAnswer(key, qaItem);
      });
      labelEl.appendChild(delBtn);

      const textarea = document.createElement('textarea');
      textarea.dataset.key = `commonAnswers.${key}`;
      textarea.dataset.i18nPh = 'options.qa.answerPh';
      textarea.placeholder = I18n.t('options.qa.answerPh');
      textarea.value = (profile.commonAnswers && profile.commonAnswers[key]) || '';

      qaItem.appendChild(labelEl);
      qaItem.appendChild(textarea);
      container.appendChild(qaItem);
      bindDataKeyInput(textarea);
    }
  }

  async function removeLearnedAnswer(key, qaItemEl) {
    if (!confirm(I18n.t('options.alert.deleteQaConfirm'))) return;
    const stored = await loadProfileFromStorage();
    const fromForm = collectFormData();
    const merged = deepMergeProfile(stored, fromForm);
    if (merged.commonAnswers) delete merged.commonAnswers[key];
    if (merged.learnedAnswerMeta) delete merged.learnedAnswerMeta[key];
    chrome.storage.local.set({ applyPilotProfile: merged }, () => {
      qaItemEl.remove();
      showSaveIndicator();
    });
  }

  function loadLLMFromStorage() {
    return new Promise(resolve => {
      chrome.storage.local.get('applyPilotLLM', result => {
        resolve(result.applyPilotLLM || {
          provider: 'anthropic',
          apiKey: '',
          apiKeyOpenAI: '',
          model: 'claude-sonnet-4-5-20250514',
          modelOpenAI: 'gpt-4o-mini',
          enabled: false,
        });
      });
    });
  }

  function populateForm(profile) {
    document.querySelectorAll('[data-key]').forEach(input => {
      const keys = input.dataset.key.split('.');
      let value = profile;
      for (const key of keys) {
        value = value?.[key];
      }
      if (value !== undefined && value !== null) {
        if (input.type === 'checkbox') {
          input.checked = !!value;
        } else {
          input.value = value;
        }
      }
    });
  }

  function populateLLMSettings(settings) {
    document.getElementById('llmEnabled').checked = settings.enabled;
    document.getElementById('llmConfig').style.opacity = settings.enabled ? '1' : '0.5';

    const provider = settings.provider || 'anthropic';
    document.querySelectorAll('.provider-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.provider === provider);
    });
    document.querySelectorAll('.provider-config').forEach(c => c.style.display = 'none');
    document.getElementById(`config-${provider}`).style.display = 'block';

    document.getElementById('anthropicKey').value = settings.apiKey || '';
    document.getElementById('anthropicModel').value = settings.model || 'claude-sonnet-4-5-20250514';
    document.getElementById('openaiKey').value = settings.apiKeyOpenAI || '';
    document.getElementById('openaiModel').value = settings.modelOpenAI || 'gpt-4o-mini';
  }

  function collectFormData() {
    const profile = {};
    document.querySelectorAll('[data-key]').forEach(input => {
      const keys = input.dataset.key.split('.');
      let obj = profile;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = input.type === 'checkbox' ? input.checked : input.value;
    });
    return profile;
  }

  function collectLLMData() {
    const selectedProvider = document.querySelector('.provider-option.selected')?.dataset.provider || 'anthropic';
    return {
      enabled: document.getElementById('llmEnabled').checked,
      provider: selectedProvider,
      apiKey: document.getElementById('anthropicKey').value,
      model: document.getElementById('anthropicModel').value,
      apiKeyOpenAI: document.getElementById('openaiKey').value,
      modelOpenAI: document.getElementById('openaiModel').value,
    };
  }

  function saveAllData() {
    loadProfileFromStorage().then((stored) => {
      const fromForm = collectFormData();
      const merged = deepMergeProfile(stored, fromForm);
      chrome.storage.local.set({ applyPilotProfile: merged }, () => {
        showSaveIndicator();
      });
    });
  }

  function saveLLMData() {
    const llmData = collectLLMData();
    chrome.storage.local.set({ applyPilotLLM: llmData }, showSaveIndicator);
  }

  function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.textContent = I18n.t('options.saved');
    indicator.classList.add('saved');
    setTimeout(() => {
      indicator.textContent = I18n.t('options.saveAuto');
      indicator.classList.remove('saved');
    }, 2000);
  }

  async function testLLMConnection() {
    const statusEl = document.getElementById('testStatus');
    statusEl.className = 'test-status loading';
    statusEl.textContent = I18n.t('options.llm.testing');

    const llm = collectLLMData();
    const provider = llm.provider;
    const apiKey = provider === 'anthropic' ? llm.apiKey : llm.apiKeyOpenAI;
    const model = provider === 'anthropic' ? llm.model : llm.modelOpenAI;

    if (!apiKey) {
      statusEl.className = 'test-status error';
      statusEl.textContent = I18n.t('options.llm.noApiKey');
      return;
    }

    try {
      let response;
      if (provider === 'anthropic') {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Say "OK"' }],
          }),
        });
      } else {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Say "OK"' }],
            max_tokens: 10,
          }),
        });
      }

      if (response.ok) {
        statusEl.className = 'test-status success';
        statusEl.textContent = I18n.t('options.llm.testSuccess', {
          provider: provider === 'anthropic' ? 'Claude' : 'OpenAI',
          model,
        });
      } else {
        const err = await response.json().catch(() => ({}));
        statusEl.className = 'test-status error';
        statusEl.textContent = I18n.t('options.llm.testError', {
          status: response.status,
          msg: err.error?.message || '?',
        });
      }
    } catch (e) {
      statusEl.className = 'test-status error';
      statusEl.textContent = I18n.t('options.llm.networkError', { msg: e.message });
    }
  }

  function addCustomQA() {
    const keyInput = document.getElementById('newQaKey');
    const key = keyInput.value.trim();
    if (!key) return;

    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) {
      alert(I18n.t('options.alert.invalidQaKey'));
      return;
    }

    const container = document.getElementById('qaContainer');
    const qaItem = document.createElement('div');
    qaItem.className = 'qa-item';

    const labelEl = document.createElement('label');
    labelEl.textContent = key + ' ';

    const delBtn = document.createElement('button');
    delBtn.style.cssText = 'float: right; background: none; border: none; color: #f87171; cursor: pointer; font-size: 12px;';
    delBtn.dataset.i18n = 'options.qa.deleteBtn';
    delBtn.textContent = I18n.t('options.qa.deleteBtn');
    delBtn.addEventListener('click', () => {
      qaItem.remove();
      document.dispatchEvent(new Event('qa-changed'));
    });
    labelEl.appendChild(delBtn);

    const textarea = document.createElement('textarea');
    textarea.dataset.key = `commonAnswers.${key}`;
    textarea.dataset.i18nPh = 'options.qa.answerPh';
    textarea.placeholder = I18n.t('options.qa.answerPh');

    qaItem.appendChild(labelEl);
    qaItem.appendChild(textarea);
    container.appendChild(qaItem);
    keyInput.value = '';

    bindDataKeyInput(textarea);
  }

  function exportProfile() {
    loadProfileFromStorage().then((stored) => {
      const fromForm = collectFormData();
      const profile = deepMergeProfile(stored, fromForm);
      const llm = collectLLMData();
      const exportData = {
        profile,
        llmSettings: {
          provider: llm.provider,
          model: llm.model,
          modelOpenAI: llm.modelOpenAI,
          enabled: llm.enabled,
        },
        exportDate: new Date().toISOString(),
        version: '1.1.0',
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apply-pilot-profile-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function exportQaOnly() {
    loadProfileFromStorage().then((stored) => {
      const fromForm = collectFormData();
      const profile = deepMergeProfile(stored, fromForm);
      const payload = {
        kind: 'apply-pilot-qa',
        commonAnswers: profile.commonAnswers || {},
        learnedAnswerMeta: profile.learnedAnswerMeta || {},
        exportDate: new Date().toISOString(),
        version: '1.1.0',
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apply-pilot-qa-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function importQaOnly(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!data.commonAnswers || typeof data.commonAnswers !== 'object') {
          alert(I18n.t('options.alert.invalidQaFile'));
          return;
        }
        loadProfileFromStorage().then((stored) => {
          const fromForm = collectFormData();
          const merged = deepMergeProfile(stored, fromForm);
          merged.commonAnswers = { ...merged.commonAnswers, ...data.commonAnswers };
          merged.learnedAnswerMeta = {
            ...(merged.learnedAnswerMeta || {}),
            ...(data.learnedAnswerMeta && typeof data.learnedAnswerMeta === 'object' ? data.learnedAnswerMeta : {}),
          };
          chrome.storage.local.set({ applyPilotProfile: merged }, () => {
            removeLearnedQaDom();
            populateForm(merged);
            renderLearnedQaItems(merged);
            showSaveIndicator();
            alert(I18n.t('options.alert.qaImported'));
          });
        });
      } catch (err) {
        alert(I18n.t('options.alert.parseFailed', { msg: err.message }));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function importProfile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.profile) {
          chrome.storage.local.set({ applyPilotProfile: data.profile }, () => {
            removeLearnedQaDom();
            populateForm(data.profile);
            renderLearnedQaItems(data.profile);
            showSaveIndicator();
            alert(I18n.t('options.alert.profileImported'));
          });
        } else {
          alert(I18n.t('options.alert.invalidProfileFile'));
        }
      } catch (err) {
        alert(I18n.t('options.alert.parseFailed', { msg: err.message }));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function resetAllData() {
    if (!confirm(I18n.t('options.alert.resetConfirm1'))) return;
    if (!confirm(I18n.t('options.alert.resetConfirm2'))) return;

    chrome.storage.local.remove(['applyPilotProfile', 'applyPilotLLM'], () => {
      location.reload();
    });
  }


  // =============================================
  // Smart import: upload → extract text → LLM → fill profile
  // =============================================

  let pendingImportProfile = null;

  async function handleSmartImport(file) {
    const llm = collectLLMData();
    const apiKey = llm.provider === 'anthropic' ? llm.apiKey : llm.apiKeyOpenAI;
    if (!apiKey) {
      alert(I18n.t('options.alert.noApiKey'));
      return;
    }

    const progressEl  = document.getElementById('importProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const previewEl   = document.getElementById('importPreview');

    previewEl.classList.remove('active');
    progressEl.classList.add('active');
    progressFill.style.width = '10%';
    progressText.textContent = I18n.t('options.smartImport.readingFile', { filename: file.name });

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let fileData = null;

      if (ext === 'pdf') {
        progressText.textContent = I18n.t('options.smartImport.readingPdf');
        progressFill.style.width = '20%';
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        fileData = { type: 'pdf', base64 };
      } else {
        const text = await file.text();
        if (!text || text.trim().length < 20) {
          throw new Error(I18n.t('options.alert.fileContentTooShort'));
        }
        fileData = { type: 'text', content: text };
      }

      progressText.textContent = I18n.t('options.smartImport.extracting');
      progressFill.style.width = '50%';

      const extracted = await callLLMForExtraction(fileData, llm);

      progressFill.style.width = '90%';
      progressText.textContent = I18n.t('options.smartImport.generating');

      pendingImportProfile = extracted;
      showImportPreview(extracted);

      progressFill.style.width = '100%';
      setTimeout(() => progressEl.classList.remove('active'), 500);

    } catch (err) {
      progressEl.classList.remove('active');
      alert(I18n.t('options.alert.smartImportFailed', { msg: err.message }));
      console.error('[Apply Pilot] Smart import error:', err);
    }
  }

  async function callLLMForExtraction(fileData, llmSettings) {
    const provider = llmSettings.provider;
    const apiKey = provider === 'anthropic' ? llmSettings.apiKey : llmSettings.apiKeyOpenAI;
    const model  = provider === 'anthropic' ? llmSettings.model  : llmSettings.modelOpenAI;

    const extractionPrompt = `You are a structured data extractor. Read the attached document (a resume / CV / personal profile) and extract as much information as possible into a JSON object.

The JSON must follow this EXACT structure. Only include fields you can confidently extract. Leave empty string "" for fields you cannot find. For select fields, use ONLY the allowed values shown in comments.

{
  "personal": {
    "firstName": "",
    "lastName": "",
    "fullName": "",
    "email": "",
    "phone": "",
    "dateOfBirth": "",
    "gender": "",
    "nationality": "",
    "currentLocation": ""
  },
  "address": {
    "street": "",
    "city": "",
    "state": "",
    "postalCode": "",
    "country": ""
  },
  "links": {
    "linkedin": "",
    "github": "",
    "portfolio": "",
    "website": "",
    "twitter": ""
  },
  "work": {
    "currentTitle": "",
    "currentCompany": "",
    "yearsOfExperience": "",
    "noticePeriod": "",
    "salaryExpectation": "",
    "willingToRelocate": "",
    "workAuthorization": "",
    "visaSponsorship": "",
    "startDate": ""
  },
  "education": {
    "highestDegree": "",
    "university": "",
    "major": "",
    "graduationYear": ""
  },
  "skills": {
    "languages": "",
    "technical": "",
    "certifications": ""
  },
  "commonAnswers": {
    "selfIntroduction": ""
  }
}

Rules:
- "fullName" = full name as it appears, e.g. "Jane Wu"
- "dateOfBirth" format: YYYY-MM-DD
- "gender": one of "male", "female", "other", "prefer_not_to_say", or ""
- "willingToRelocate": one of "yes", "no", "open", or ""
- "visaSponsorship": one of "yes", "no", "not_needed", or ""
- "yearsOfExperience": just the number as string, e.g. "5"
- "languages": natural language, e.g. "Chinese (Native), English (Fluent), German (B2)"
- "technical": comma-separated list of skills
- "selfIntroduction": write a brief 2-3 sentence professional intro based on the person's background
- If there are multiple education entries, use the highest/most recent one
- If there are multiple work entries, use the most recent/current one
- Extract LinkedIn, GitHub, portfolio URLs if present

Respond with ONLY the JSON object, no other text.`;

    let responseText;

    if (provider === 'anthropic') {
      const contentBlocks = [];

      if (fileData.type === 'pdf') {
        contentBlocks.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: fileData.base64 },
        });
      } else {
        const truncated = fileData.content.length > 15000
          ? fileData.content.slice(0, 15000) + '\n...[truncated]'
          : fileData.content;
        contentBlocks.push({ type: 'text', text: 'DOCUMENT:\n' + truncated });
      }

      contentBlocks.push({ type: 'text', text: extractionPrompt });

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: contentBlocks }],
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(I18n.t('options.alert.anthropicApiError', {
          status: resp.status,
          msg: err.error?.message || '?',
        }));
      }
      const data = await resp.json();
      responseText = data.content[0].text;

    } else {
      if (fileData.type === 'pdf') {
        throw new Error(I18n.t('options.alert.openaiNoPdf'));
      }

      const truncated = fileData.content.length > 15000
        ? fileData.content.slice(0, 15000) + '\n...[truncated]'
        : fileData.content;

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: extractionPrompt + '\n\nDOCUMENT:\n' + truncated }],
          max_tokens: 2048,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(I18n.t('options.alert.openaiApiError', {
          status: resp.status,
          msg: err.error?.message || '?',
        }));
      }
      const data = await resp.json();
      responseText = data.choices[0].message.content;
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI returned unparseable format, please retry');
    }
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Show extracted profile preview.
   * Label keys are i18n-aware.
   */
  function showImportPreview(profile) {
    const grid = document.getElementById('previewGrid');
    grid.innerHTML = '';

    // Maps data key path → i18n key for the label
    const labelKeys = {
      'personal.firstName':   'options.preview.firstName',
      'personal.lastName':    'options.preview.lastName',
      'personal.fullName':    'options.preview.fullName',
      'personal.email':       'options.preview.email',
      'personal.phone':       'options.preview.phone',
      'personal.dateOfBirth': 'options.preview.dob',
      'personal.gender':      'options.preview.gender',
      'personal.nationality': 'options.preview.nationality',
      'personal.currentLocation': 'options.preview.location',
      'address.street':       'options.preview.street',
      'address.city':         'options.preview.city',
      'address.state':        'options.preview.state',
      'address.postalCode':   'options.preview.postal',
      'address.country':      'options.preview.country',
      'links.linkedin':       'options.preview.linkedin',
      'links.github':         'options.preview.github',
      'links.portfolio':      'options.preview.portfolio',
      'links.website':        'options.preview.website',
      'links.twitter':        'options.preview.twitter',
      'work.currentTitle':        'options.preview.currentTitle',
      'work.currentCompany':      'options.preview.currentCompany',
      'work.yearsOfExperience':   'options.preview.yearsExp',
      'work.noticePeriod':        'options.preview.noticePeriod',
      'work.salaryExpectation':   'options.preview.salary',
      'work.willingToRelocate':   'options.preview.relocate',
      'work.workAuthorization':   'options.preview.workAuth',
      'work.visaSponsorship':     'options.preview.visaSponsorship',
      'work.startDate':           'options.preview.startDate',
      'education.highestDegree':  'options.preview.degree',
      'education.university':     'options.preview.university',
      'education.major':          'options.preview.major',
      'education.graduationYear': 'options.preview.gradYear',
      'skills.languages':         'options.preview.langSkills',
      'skills.technical':         'options.preview.techSkills',
      'skills.certifications':    'options.preview.certifications',
      'commonAnswers.selfIntroduction': 'options.preview.selfIntro',
    };

    const flat = flattenObj(profile);

    for (const [key, labelKey] of Object.entries(labelKeys)) {
      const value = flat[key] || '';
      const item = document.createElement('div');
      item.className = `preview-item${value ? '' : ' empty'}`;
      item.innerHTML = `
        <div class="preview-label">${I18n.t(labelKey)}</div>
        <div class="preview-value">${value || I18n.t('options.preview.notExtracted')}</div>
      `;
      grid.appendChild(item);
    }

    document.getElementById('importPreview').classList.add('active');
  }

  function flattenObj(obj, prefix = '') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, flattenObj(value, fullKey));
      } else {
        result[fullKey] = value;
      }
    }
    return result;
  }

  function applySmartImport() {
    if (!pendingImportProfile) return;

    loadProfileFromStorage().then((stored) => {
      const fromForm = collectFormData();
      const base   = deepMergeProfile(stored, fromForm);
      const merged = deepMerge(base, pendingImportProfile);

      chrome.storage.local.set({ applyPilotProfile: merged }, () => {
        removeLearnedQaDom();
        populateForm(merged);
        renderLearnedQaItems(merged);
        showSaveIndicator();
        document.getElementById('importPreview').classList.remove('active');
        pendingImportProfile = null;
        alert(I18n.t('options.alert.importApplied'));
      });
    });
  }

  /**
   * Deep merge: only overwrite empty fields, preserving existing user data.
   */
  function deepMerge(existing, incoming) {
    const result = JSON.parse(JSON.stringify(existing));
    for (const [key, value] of Object.entries(incoming)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = deepMerge(result[key] || {}, value);
      } else if (value && String(value).trim()) {
        if (!result[key] || !String(result[key]).trim()) {
          result[key] = value;
        }
      }
    }
    return result;
  }

  function cancelSmartImport() {
    pendingImportProfile = null;
    document.getElementById('importPreview').classList.remove('active');
    document.getElementById('importProgress').classList.remove('active');
  }
});
