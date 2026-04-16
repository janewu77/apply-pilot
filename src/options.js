/**
 * Apply Pilot - Options 页面逻辑
 * 管理个人档案编辑、LLM 配置、数据导入导出
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ========== 标签页切换 ==========
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // ========== 加载档案数据 ==========
  const profile = await loadProfileFromStorage();
  populateForm(profile);
  renderLearnedQaItems(profile);

  // ========== 加载 LLM 设置 ==========
  const llmSettings = await loadLLMFromStorage();
  populateLLMSettings(llmSettings);

  // ========== 自动保存（档案字段） ==========
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

  // ========== Provider 切换 ==========
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

  // ========== LLM 启用开关 ==========
  document.getElementById('llmEnabled').addEventListener('change', () => {
    const config = document.getElementById('llmConfig');
    config.style.opacity = document.getElementById('llmEnabled').checked ? '1' : '0.5';
    saveLLMData();
  });

  // ========== API Key 显隐切换 ==========
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

  // ========== LLM 设置自动保存 ==========
  document.querySelectorAll('[data-llm]').forEach(input => {
    input.addEventListener('change', saveLLMData);
    input.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveLLMData, 500);
    });
  });

  // ========== 测试连接 ==========
  document.getElementById('testConnection').addEventListener('click', testLLMConnection);

  // ========== 添加自定义问答 ==========
  document.getElementById('addQaBtn').addEventListener('click', addCustomQA);

  // ========== 导出 ==========
  document.getElementById('exportBtn').addEventListener('click', exportProfile);

  document.getElementById('exportQaBtn').addEventListener('click', exportQaOnly);
  document.getElementById('importQaBtn').addEventListener('click', () => {
    document.getElementById('importQaFile').click();
  });
  document.getElementById('importQaFile').addEventListener('change', importQaOnly);

  // ========== 导入 ==========
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importProfile);

  // ========== 重置 ==========
  document.getElementById('resetBtn').addEventListener('click', resetAllData);

  // ========== 智能导入 ==========
  const smartImportZone = document.getElementById('smartImportZone');
  const smartImportFile = document.getElementById('smartImportFile');

  smartImportZone.addEventListener('click', () => smartImportFile.click());
  smartImportFile.addEventListener('change', (e) => {
    if (e.target.files[0]) handleSmartImport(e.target.files[0]);
    e.target.value = '';
  });

  // 拖拽
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
  // 函数实现
  // =============================================

  function loadProfileFromStorage() {
    return new Promise(resolve => {
      chrome.storage.local.get('applyPilotProfile', result => {
        resolve(result.applyPilotProfile || {});
      });
    });
  }

  /**
   * 表单数据覆盖同路径，保留 storage 中表单未包含的键（如 learnedAnswerMeta、未渲染字段）
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
   * 根据 learnedAnswerMeta 渲染「自动学习」问答块（避免与静态/自定义 DOM 重复）
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
      badge.textContent = '自动学习';
      labelEl.appendChild(badge);
      labelEl.appendChild(document.createTextNode(` ${entry.label || key}`));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'qa-delete-btn';
      delBtn.textContent = '删除';
      delBtn.addEventListener('click', () => {
        void removeLearnedAnswer(key, qaItem);
      });
      labelEl.appendChild(delBtn);

      const textarea = document.createElement('textarea');
      textarea.dataset.key = `commonAnswers.${key}`;
      textarea.placeholder = '你的回答...';
      textarea.value = (profile.commonAnswers && profile.commonAnswers[key]) || '';

      qaItem.appendChild(labelEl);
      qaItem.appendChild(textarea);
      container.appendChild(qaItem);
      bindDataKeyInput(textarea);
    }
  }

  async function removeLearnedAnswer(key, qaItemEl) {
    if (!confirm('确定删除这条自动学习记录？')) return;
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

    // Provider selection
    const provider = settings.provider || 'anthropic';
    document.querySelectorAll('.provider-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.provider === provider);
    });
    document.querySelectorAll('.provider-config').forEach(c => c.style.display = 'none');
    document.getElementById(`config-${provider}`).style.display = 'block';

    // Keys and models
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

    // 同时以旧格式保存（content script 需要）
    const forContentScript = {
      enabled: llmData.enabled,
      provider: llmData.provider,
      apiKey: llmData.provider === 'anthropic' ? llmData.apiKey : llmData.apiKeyOpenAI,
      model: llmData.provider === 'anthropic' ? llmData.model : llmData.modelOpenAI,
    };

    chrome.storage.local.set({
      applyPilotLLM: llmData,
    }, showSaveIndicator);
  }

  function showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    indicator.textContent = '✓ 已保存';
    indicator.classList.add('saved');
    setTimeout(() => {
      indicator.textContent = '所有更改自动保存';
      indicator.classList.remove('saved');
    }, 2000);
  }

  async function testLLMConnection() {
    const statusEl = document.getElementById('testStatus');
    statusEl.className = 'test-status loading';
    statusEl.textContent = '⏳ 正在测试连接...';

    const llm = collectLLMData();
    const provider = llm.provider;
    const apiKey = provider === 'anthropic' ? llm.apiKey : llm.apiKeyOpenAI;
    const model = provider === 'anthropic' ? llm.model : llm.modelOpenAI;

    if (!apiKey) {
      statusEl.className = 'test-status error';
      statusEl.textContent = '❌ 请先输入 API Key';
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
        statusEl.textContent = `✅ 连接成功！(${provider === 'anthropic' ? 'Claude' : 'OpenAI'} - ${model})`;
      } else {
        const err = await response.json().catch(() => ({}));
        statusEl.className = 'test-status error';
        statusEl.textContent = `❌ API 错误 ${response.status}: ${err.error?.message || '未知错误'}`;
      }
    } catch (e) {
      statusEl.className = 'test-status error';
      statusEl.textContent = `❌ 网络错误: ${e.message}`;
    }
  }

  function addCustomQA() {
    const keyInput = document.getElementById('newQaKey');
    const key = keyInput.value.trim();
    if (!key) return;

    // 验证 key 格式
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key)) {
      alert('标签只能包含英文字母和数字，且以字母开头');
      return;
    }

    const container = document.getElementById('qaContainer');
    const qaItem = document.createElement('div');
    qaItem.className = 'qa-item';
    qaItem.innerHTML = `
      <label>${key} <button style="float: right; background: none; border: none; color: #f87171; cursor: pointer; font-size: 12px;" onclick="this.closest('.qa-item').remove(); document.dispatchEvent(new Event('qa-changed'));">删除</button></label>
      <textarea data-key="commonAnswers.${key}" placeholder="你的回答..."></textarea>
    `;
    container.appendChild(qaItem);
    keyInput.value = '';

    bindDataKeyInput(qaItem.querySelector('textarea'));
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
          alert('无效的常见问答文件（缺少 commonAnswers）');
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
            alert('常见问答已导入并合并。');
          });
        });
      } catch (err) {
        alert('文件解析失败: ' + err.message);
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
            alert('档案导入成功！');
          });
        } else {
          alert('无效的档案文件格式');
        }
      } catch (err) {
        alert('文件解析失败: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // 允许重复导入同一文件
  }

  function resetAllData() {
    if (!confirm('确定要清除所有数据吗？此操作不可撤销！')) return;
    if (!confirm('再次确认：所有个人档案和设置都将被删除。')) return;

    chrome.storage.local.remove(['applyPilotProfile', 'applyPilotLLM'], () => {
      location.reload();
    });
  }


  // =============================================
  // 智能导入：上传文件 → 提取文本 → LLM 解析 → 填充档案
  // =============================================

  let pendingImportProfile = null; // 暂存 AI 提取的结果，等用户确认

  async function handleSmartImport(file) {
    // 检查 LLM 是否配置
    const llm = collectLLMData();
    const apiKey = llm.provider === 'anthropic' ? llm.apiKey : llm.apiKeyOpenAI;
    if (!apiKey) {
      alert('请先在「AI 设置」标签页中配置 API Key，智能导入需要 AI 来提取信息。');
      return;
    }

    const progressEl = document.getElementById('importProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const previewEl = document.getElementById('importPreview');

    // 重置状态
    previewEl.classList.remove('active');
    progressEl.classList.add('active');
    progressFill.style.width = '10%';
    progressText.textContent = `正在读取 ${file.name}...`;

    try {
      // Step 1: 读取文件
      const ext = file.name.split('.').pop().toLowerCase();
      let fileData = null; // { type: 'text', content } 或 { type: 'pdf', base64 }

      if (ext === 'pdf') {
        progressText.textContent = '正在读取 PDF...';
        progressFill.style.width = '20%';
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        fileData = { type: 'pdf', base64 };
      } else {
        // md, txt, markdown
        const text = await file.text();
        if (!text || text.trim().length < 20) {
          throw new Error('文件内容太少，无法提取有效信息');
        }
        fileData = { type: 'text', content: text };
      }

      // Step 2: 调 LLM 提取
      progressText.textContent = '正在用 AI 提取个人信息...';
      progressFill.style.width = '50%';

      const extracted = await callLLMForExtraction(fileData, llm);

      progressFill.style.width = '90%';
      progressText.textContent = '提取完成，正在生成预览...';

      // Step 3: 显示预览
      pendingImportProfile = extracted;
      showImportPreview(extracted);

      progressFill.style.width = '100%';
      setTimeout(() => progressEl.classList.remove('active'), 500);

    } catch (err) {
      progressEl.classList.remove('active');
      alert('智能导入失败: ' + err.message);
      console.error('[Apply Pilot] Smart import error:', err);
    }
  }

  /**
   * 调用 LLM 从文件中提取结构化档案数据
   * @param {Object} fileData - { type: 'text'|'pdf', content?, base64? }
   */
  async function callLLMForExtraction(fileData, llmSettings) {
    const provider = llmSettings.provider;
    const apiKey = provider === 'anthropic' ? llmSettings.apiKey : llmSettings.apiKeyOpenAI;
    const model = provider === 'anthropic' ? llmSettings.model : llmSettings.modelOpenAI;

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
      // Claude API 原生支持 PDF 文档，直接发 base64
      const contentBlocks = [];

      if (fileData.type === 'pdf') {
        contentBlocks.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: fileData.base64,
          },
        });
      } else {
        // 文本文件：截断后作为文本发送
        const truncated = fileData.content.length > 15000
          ? fileData.content.slice(0, 15000) + '\n...[truncated]'
          : fileData.content;
        contentBlocks.push({
          type: 'text',
          text: 'DOCUMENT:\n' + truncated,
        });
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
          model: model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: contentBlocks }],
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(`Anthropic API 错误 ${resp.status}: ${err.error?.message || '未知'}`);
      }
      const data = await resp.json();
      responseText = data.content[0].text;

    } else {
      // OpenAI：只支持文本，PDF 需提示用户换 Anthropic
      if (fileData.type === 'pdf') {
        throw new Error('OpenAI 不支持直接读取 PDF。请在「AI 设置」中切换到 Anthropic (Claude) 后重试，或上传 Markdown/TXT 格式。');
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
          model: model,
          messages: [{
            role: 'user',
            content: extractionPrompt + '\n\nDOCUMENT:\n' + truncated,
          }],
          max_tokens: 2048,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(`OpenAI API 错误 ${resp.status}: ${err.error?.message || '未知'}`);
      }
      const data = await resp.json();
      responseText = data.choices[0].message.content;
    }

    // 解析 JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 返回的格式无法解析，请重试');
    }
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * 显示提取结果预览
   */
  function showImportPreview(profile) {
    const grid = document.getElementById('previewGrid');
    grid.innerHTML = '';

    const labels = {
      'personal.firstName': '名', 'personal.lastName': '姓', 'personal.fullName': '全名',
      'personal.email': '邮箱', 'personal.phone': '电话', 'personal.dateOfBirth': '出生日期',
      'personal.gender': '性别', 'personal.nationality': '国籍', 'personal.currentLocation': '所在地',
      'address.street': '街道', 'address.city': '城市', 'address.state': '州/省',
      'address.postalCode': '邮编', 'address.country': '国家',
      'links.linkedin': 'LinkedIn', 'links.github': 'GitHub', 'links.portfolio': '作品集',
      'links.website': '网站', 'links.twitter': 'Twitter',
      'work.currentTitle': '当前职位', 'work.currentCompany': '当前公司',
      'work.yearsOfExperience': '工作年限', 'work.noticePeriod': '通知期',
      'work.salaryExpectation': '期望薪资', 'work.willingToRelocate': '愿意搬迁',
      'work.workAuthorization': '工作许可', 'work.visaSponsorship': '签证担保',
      'work.startDate': '最早入职',
      'education.highestDegree': '学历', 'education.university': '学校',
      'education.major': '专业', 'education.graduationYear': '毕业年份',
      'skills.languages': '语言能力', 'skills.technical': '技术技能',
      'skills.certifications': '证书',
      'commonAnswers.selfIntroduction': '自我介绍',
    };

    // 展平 profile
    const flat = flattenObj(profile);

    for (const [key, label] of Object.entries(labels)) {
      const value = flat[key] || '';
      const item = document.createElement('div');
      item.className = `preview-item${value ? '' : ' empty'}`;
      item.innerHTML = `
        <div class="preview-label">${label}</div>
        <div class="preview-value">${value || '（未提取到）'}</div>
      `;
      grid.appendChild(item);
    }

    document.getElementById('importPreview').classList.add('active');
  }

  /**
   * 展平嵌套对象
   */
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

  /**
   * 用户确认 → 写入档案
   */
  function applySmartImport() {
    if (!pendingImportProfile) return;

    loadProfileFromStorage().then((stored) => {
      const fromForm = collectFormData();
      const base = deepMergeProfile(stored, fromForm);
      const merged = deepMerge(base, pendingImportProfile);

      chrome.storage.local.set({ applyPilotProfile: merged }, () => {
        removeLearnedQaDom();
        populateForm(merged);
        renderLearnedQaItems(merged);
        showSaveIndicator();
        document.getElementById('importPreview').classList.remove('active');
        pendingImportProfile = null;
        alert('档案已更新！你可以在下方各字段中检查和微调。');
      });
    });
  }

  /**
   * 深度合并：只覆盖空字段，不冲掉用户已有数据
   */
  function deepMerge(existing, incoming) {
    const result = JSON.parse(JSON.stringify(existing));
    for (const [key, value] of Object.entries(incoming)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = deepMerge(result[key] || {}, value);
      } else if (value && String(value).trim()) {
        // 只在现有值为空时覆盖
        if (!result[key] || !String(result[key]).trim()) {
          result[key] = value;
        }
      }
    }
    return result;
  }

  /**
   * 取消导入
   */
  function cancelSmartImport() {
    pendingImportProfile = null;
    document.getElementById('importPreview').classList.remove('active');
    document.getElementById('importProgress').classList.remove('active');
  }
});
