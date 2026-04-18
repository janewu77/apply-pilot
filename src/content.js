/**
 * Apply Pilot - Content Script (主控制器)
 * 注入到页面中，协调扫描、匹配、填充的完整流程
 */

(() => {
  // 避免重复注入
  if (window.__applyPilotInjected) return;
  window.__applyPilotInjected = true;

  // 初始化 i18n（异步加载用户语言偏好；默认 en，用户触发操作前已完成）
  I18n.init();

  /** 受控组件风险提示 — 通过 i18n 获取，延迟求值避免初始化时序问题 */
  const FRAMEWORK_VERIFY_HINT_SHORT = () => I18n.t('content.hint.frameworkShort');
  const FRAMEWORK_VERIFY_HINT_TOAST = () => I18n.t('content.hint.frameworkToast');

  // ========== 状态 ==========
  let overlayVisible = false;
  let matchResults = [];  // 每个元素的匹配结果

  // ========== 主流程 ==========

  /**
   * 扫描并填充表单
   * @param {Object} options - { useLLM: boolean, autoFill: boolean }
   */
  async function scanAndFill(options = { useLLM: true, autoFill: false }) {
    const profileData = await getFilledFields();
    if (Object.keys(profileData).length === 0) {
      showNotification(I18n.t('content.notif.noProfile'), 'warning');
      return;
    }

    const rawProfile = await loadProfile();
    const learnedSigToKey = buildLearnedSignatureToProfileKeyMap(rawProfile);

    const fields = scanFormFields();
    if (fields.length === 0) {
      showNotification(I18n.t('content.notif.noFields'), 'info');
      return;
    }

    showNotification(I18n.t('content.notif.fieldsDetected', { count: fields.length }), 'info');

    matchResults = [];
    let unmatchedForLLM = [];

    // 第一轮：关键词匹配
    console.log('[Apply Pilot] 第一轮：关键词匹配');
    fields.forEach((element, index) => {
      const match = matchFieldByKeywords(element);
      if (match && match.confidence !== 'low' && profileData[match.profileKey]) {
        matchResults.push({
          element,
          profileKey: match.profileKey,
          value: profileData[match.profileKey],
          confidence: match.confidence,
          source: 'keyword',
          filled: false,
        });
      } else {
        // 收集未匹配的字段信息，准备发给 LLM
        const clues = extractFieldClues(element);
        matchResults.push({
          element,
          profileKey: null,
          value: null,
          confidence: 'none',
          source: 'unmatched',
          clues,
          filled: false,
        });
        unmatchedForLLM.push({
          index: matchResults.length - 1,
          clues,
          tagName: element.tagName.toLowerCase(),
          type: element.type || '',
        });
      }
    });
    // console.log(matchResults);

    console.log('[Apply Pilot] 第二轮：按历史学习到的线索精确复用 commonAnswers');
    // 第二轮：按历史学习到的线索精确复用 commonAnswers
    const stillForLLM = [];
    for (const item of unmatchedForLLM) {
      const sig = cluesSignatureFromClues(item.clues);
      const flatKey = learnedSigToKey.get(sig);
      if (flatKey && profileData[flatKey]) {
        const r = matchResults[item.index];
        r.profileKey = flatKey;
        r.value = profileData[flatKey];
        r.confidence = 'high';
        r.source = 'learned';
      } else {
        stillForLLM.push(item);
      }
    }
    unmatchedForLLM = stillForLLM;
    // console.log(unmatchedForLLM);

    // console.log('[Apply Pilot] 第三轮：LLM 匹配（如果启用）');
    // 第三轮：LLM 匹配（如果启用）
    if (options.useLLM && unmatchedForLLM.length > 0) {
      console.log('[Apply Pilot] 第三轮：LLM 匹配（启用）');
      showNotification(I18n.t('content.notif.aiAnalyzing'), 'info');
      const llmMapping = await llmMatchFields(
        unmatchedForLLM.map(f => ({
          clues: f.clues,
          tagName: f.tagName,
          type: f.type,
        })),
        profileData
      );

      for (const [llmIdx, profileKey] of Object.entries(llmMapping)) {
        const originalIdx = unmatchedForLLM[parseInt(llmIdx)]?.index;
        if (originalIdx !== undefined && matchResults[originalIdx]) {
          matchResults[originalIdx].profileKey = profileKey;
          matchResults[originalIdx].value = profileData[profileKey];
          matchResults[originalIdx].confidence = 'medium';
          matchResults[originalIdx].source = 'llm';
        }
      }

      // 第四轮：对仍未匹配的 textarea，批量调用 LLM 生成开放式回答
      const openEndedFields = unmatchedForLLM
        .filter(f => !matchResults[f.index].value && f.tagName === 'textarea')
        .map(f => ({ ...f, question: pickLearnedLabel(f.clues) || f.clues.join(' ') }))
        .filter(f => f.question);
      if (openEndedFields.length > 0) {
        console.log('[Apply Pilot] 第四轮：LLM 批量生成开放式回答');
        const answers = await llmGenerateAnswers(
          openEndedFields.map(f => f.question),
          profileData
        );
        for (const [i, answer] of Object.entries(answers)) {
          const field = openEndedFields[parseInt(i)];
          if (field && answer) {
            matchResults[field.index].value = answer;
            matchResults[field.index].confidence = 'medium';
            matchResults[field.index].source = 'llm-generated';
          }
        }
      }
    }

    // 统计
    const matched = matchResults.filter(r => r.value);
    const unmatched = matchResults.filter(r => !r.value);
    showNotification(
      I18n.t('content.notif.matchDone', { matched: matched.length, unmatched: unmatched.length }),
      matched.length > 0 ? 'success' : 'warning'
    );
    // console.log(matched);
    // console.log(unmatched);

    // 显示覆盖层
    showOverlay();

    // 如果选择自动填充（对高置信度字段）
    if (options.autoFill) {
      fillHighConfidenceFields();
    }
  }

  /**
   * 填充高置信度的字段
   */
  function fillHighConfidenceFields() {
    let count = 0;
    matchResults.forEach((result) => {
      if (result.value && result.confidence === 'high' && !result.filled) {
        fillField(result.element, result.value);
        result.filled = true;
        count++;
      }
    });
    if (count > 0) {
      showNotification(
        I18n.t('content.notif.filledHigh', { count, hint: FRAMEWORK_VERIFY_HINT_TOAST() }),
        'success',
        9000
      );
    }
  }

  /**
   * 填充所有已匹配的字段
   */
  function fillAllMatchedFields() {
    let count = 0;
    matchResults.forEach((result) => {
      if (result.value && !result.filled) {
        fillField(result.element, result.value);
        result.filled = true;
        count++;
      }
    });
    if (count > 0) {
      showNotification(
        I18n.t('content.notif.filledAll', { count, hint: FRAMEWORK_VERIFY_HINT_TOAST() }),
        'success',
        9000
      );
    }
    updateOverlay();
  }

  /**
   * 让 React / Vue 等受控组件识别到值变化（普通 Event 往往不够）
   */
  function dispatchInputForFramework(element, textValue) {
    const v = textValue == null ? '' : String(textValue);
    try {
      element.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertReplacementText',
        data: v,
      }));
    } catch (_e) {
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  function dispatchChangeForFramework(element) {
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  function blurForFramework(element) {
    window.setTimeout(() => {
      try {
        element.dispatchEvent(new FocusEvent('blur', { bubbles: true, composed: true }));
      } catch (_e) {
        element.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      }
    }, 0);
  }

  /**
   * 向表单元素填入值，并触发相应事件
   */
  function fillField(element, value) {
    const tag = element.tagName.toLowerCase();
    const type = element.type?.toLowerCase();
    const strVal = value == null ? '' : String(value);

    if (tag === 'select') {
      // 下拉框：尝试匹配 option 的 value 或文本
      const options = Array.from(element.options);
      const match = options.find(opt =>
        opt.value.toLowerCase() === strVal.toLowerCase() ||
        opt.textContent.trim().toLowerCase() === strVal.toLowerCase()
      );
      if (match) {
        element.value = match.value;
      } else {
        // 尝试模糊匹配
        const fuzzy = options.find(opt =>
          opt.textContent.trim().toLowerCase().includes(strVal.toLowerCase()) ||
          strVal.toLowerCase().includes(opt.textContent.trim().toLowerCase())
        );
        if (fuzzy) element.value = fuzzy.value;
      }
      dispatchChangeForFramework(element);
      blurForFramework(element);
    } else if (type === 'checkbox') {
      const shouldCheck = ['yes', 'true', '1', '是'].includes(strVal.toLowerCase());
      element.checked = shouldCheck;
      dispatchChangeForFramework(element);
      blurForFramework(element);
    } else if (type === 'radio') {
      // radio 需要特殊处理
      if (element.value.toLowerCase() === strVal.toLowerCase()) {
        element.checked = true;
        dispatchChangeForFramework(element);
        blurForFramework(element);
      }
    } else if (type === 'file') {
      // 文件上传无法程序化设置，标记提醒用户
      highlightElement(element, I18n.t('content.notif.fileUpload'));
      return;
    } else {
      // 文本类输入：原生 setter + InputEvent，便于受控组件更新 state
      try {
        if (element.focus) {
          try {
            element.focus({ preventScroll: true });
          } catch (_e) {
            element.focus();
          }
        }
      } catch (_e) { /* ignore */ }

      const proto = tag === 'textarea'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(element, strVal);
      } else {
        element.value = strVal;
      }

      dispatchInputForFramework(element, strVal);
      blurForFramework(element);
    }

    // 添加视觉标记
    element.style.outline = '2px solid #22c55e';
    element.style.outlineOffset = '1px';
    setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }, 3000);
  }

  /**
   * 读取表单控件当前值（与 fillField 对称）
   */
  function readFieldValue(element) {
    const tag = element.tagName.toLowerCase();
    const type = (element.type || '').toLowerCase();

    if (tag === 'select') {
      const v = (element.value || '').trim();
      // 未选择具体选项（占位项 value 常为空）视为未回答，不收集
      if (!v) return '';
      const opt = element.options[element.selectedIndex];
      if (!opt) return '';
      const t = opt.textContent.trim();
      return (t || v).trim();
    }
    if (type === 'checkbox') {
      return element.checked ? 'yes' : '';
    }
    if (type === 'radio') {
      if (!element.checked) return '';
      return (element.value || '').trim() || 'yes';
    }
    if (type === 'file') return '';
    return (element.value || '').trim();
  }

  function pickLearnedLabel(clues) {
    const parts = (clues || []).filter(Boolean).map((c) => String(c).trim()).filter((c) => c.length > 0);
    const head = parts.slice(0, 3).join(' · ');
    return head.length > 120 ? `${head.slice(0, 117)}...` : head;
  }

  /**
   * 是否有可保存的回答（未填写、仅空白的不收集）
   */
  function hasLearnableAnswer(raw) {
    if (raw === undefined || raw === null) return false;
    return String(raw).trim().length > 0;
  }

  /**
   * 收集「当前仍未匹配」且用户已填写内容的字段（未回答的不入库）
   */
  function collectManualAnswersToLearn() {
    const entries = [];
    for (const result of matchResults) {
      if (result.value) continue;
      const raw = readFieldValue(result.element);
      if (!hasLearnableAnswer(raw)) continue;
      const value = typeof raw === 'string' ? raw.trim() : String(raw).trim();
      const clues = result.clues?.length ? result.clues : extractFieldClues(result.element);
      const signature = cluesSignatureFromClues(clues);
      if (!signature) continue;
      entries.push({
        signature,
        clues,
        label: pickLearnedLabel(clues),
        value,
      });
    }
    return entries;
  }

  function persistLearnedEntries(entries) {
    const valid = entries.filter((e) => e.value && String(e.value).trim());
    if (!valid.length) return Promise.resolve(0);
    return new Promise((resolve) => {
      chrome.storage.local.get('applyPilotProfile', (result) => {
        let profile = result.applyPilotProfile;
        if (!profile || typeof profile !== 'object') profile = {};
        if (!profile.commonAnswers || typeof profile.commonAnswers !== 'object') profile.commonAnswers = {};
        if (!profile.learnedAnswerMeta || typeof profile.learnedAnswerMeta !== 'object') {
          profile.learnedAnswerMeta = {};
        }

        const existingKeys = new Set(Object.keys(profile.commonAnswers));
        let n = 0;
        for (const e of valid) {
          let answerKey = null;
          for (const [k, meta] of Object.entries(profile.learnedAnswerMeta)) {
            if (meta && meta.cluesSignature === e.signature) {
              answerKey = k;
              break;
            }
          }
          if (!answerKey) {
            answerKey = generateLearnedAnswerKey(e.signature, existingKeys);
            existingKeys.add(answerKey);
          }
          profile.commonAnswers[answerKey] = e.value;
          profile.learnedAnswerMeta[answerKey] = {
            label: e.label,
            cluesSignature: e.signature,
            clues: e.clues,
            updatedAt: new Date().toISOString(),
            source: 'learned',
          };
          n += 1;
        }
        chrome.storage.local.set({ applyPilotProfile: profile }, () => resolve(n));
      });
    });
  }

  async function updateMatchResultsAfterLearn() {
    const profile = await loadProfile();
    const sigMap = buildLearnedSignatureToProfileKeyMap(profile);
    const data = await getFilledFields();
    for (const r of matchResults) {
      if (r.value) continue;
      const clues = r.clues?.length ? r.clues : extractFieldClues(r.element);
      const sig = cluesSignatureFromClues(clues);
      const fk = sigMap.get(sig);
      if (fk && data[fk]) {
        r.profileKey = fk;
        r.value = data[fk];
        r.confidence = 'high';
        r.source = 'learned';
      }
    }
  }

  async function saveManualAnswersToProfile() {
    const entries = collectManualAnswersToLearn();
    if (!entries.length) {
      showNotification(I18n.t('content.notif.noLearnContent'), 'info');
      return;
    }
    const saved = await persistLearnedEntries(entries);
    if (!saved) {
      showNotification(I18n.t('content.qa.nothingToSave'), 'info');
      return;
    }
    await updateMatchResultsAfterLearn();
    removeOverlay();
    showOverlay();
    showNotification(I18n.t('content.qa.savedNotif', { count: saved }), 'success');
  }

  async function onCloseClick() {
    const entries = collectManualAnswersToLearn();
    if (entries.length > 0) {
      const ok = confirm(I18n.t('content.qa.learnPrompt'));
      if (ok) {
        const saved = await persistLearnedEntries(entries);
        if (saved > 0) {
          await updateMatchResultsAfterLearn();
          showNotification(I18n.t('content.qa.savedToPreset', { count: saved }), 'success');
        }
      }
    }
    removeOverlay();
  }


  // ========== 覆盖层 UI ==========

  function showOverlay() {
    removeOverlay();
    overlayVisible = true;

    // 为每个字段添加小标签
    matchResults.forEach((result, idx) => {
      const el = result.element;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;

      const badge = document.createElement('div');
      badge.className = 'apply-pilot-badge';
      badge.dataset.idx = idx;

      if (result.value) {
        badge.classList.add(result.filled ? 'filled' : 'matched');
        badge.textContent = result.filled ? '✓' : `→ ${result.profileKey?.split('.').pop()}`;
        badge.title =
          I18n.t('content.badge.willFill', { value: result.value, source: result.source, confidence: result.confidence }) +
          FRAMEWORK_VERIFY_HINT_TOAST();
        badge.addEventListener('click', () => {
          fillField(result.element, result.value);
          result.filled = true;
          badge.classList.remove('matched');
          badge.classList.add('filled');
          badge.textContent = '✓';
          badge.title = I18n.t('content.notif.tryFilled', { hint: FRAMEWORK_VERIFY_HINT_TOAST() });
        });
      } else {
        badge.classList.add('unmatched');
        badge.textContent = '?';
        badge.title = I18n.t('content.badge.unmatched', { clues: (result.clues || []).join(', ') });
      }

      // 定位到字段旁边
      badge.style.position = 'absolute';
      badge.style.left = `${window.scrollX + rect.right + 4}px`;
      badge.style.top = `${window.scrollY + rect.top}px`;
      badge.style.zIndex = '2147483647';

      document.body.appendChild(badge);
    });

    // 显示操作浮窗
    showActionBar();
  }

  function showActionBar() {
    const bar = document.createElement('div');
    bar.id = 'apply-pilot-action-bar';
    bar.innerHTML = `
      <div class="apply-pilot-bar-main">
        <div class="apply-pilot-bar-title"><img src="${chrome.runtime.getURL('icons/icon16.png')}" alt="Apply Pilot" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;border-radius:3px;"> Apply Pilot</div>
        <div class="apply-pilot-bar-stats"></div>
        <div class="apply-pilot-bar-buttons">
          <button id="ap-fill-high">${I18n.t('content.bar.fillHigh')}</button>
          <button id="ap-fill-all">${I18n.t('content.bar.fillAll')}</button>
          <button id="ap-save-learned" title="${I18n.t('content.bar.saveLearnedTitle')}">${I18n.t('content.bar.saveLearned')}</button>
          <button id="ap-close">${I18n.t('content.bar.close')}</button>
        </div>
      </div>
      <div class="apply-pilot-bar-hint" role="status">${FRAMEWORK_VERIFY_HINT_SHORT()}</div>
    `;
    document.body.appendChild(bar);

    updateActionBarStats();

    document.getElementById('ap-fill-high').addEventListener('click', () => {
      fillHighConfidenceFields();
      updateOverlay();
      updateActionBarStats();
    });
    document.getElementById('ap-fill-all').addEventListener('click', () => {
      fillAllMatchedFields();
      updateActionBarStats();
    });
    document.getElementById('ap-save-learned').addEventListener('click', () => {
      void saveManualAnswersToProfile().then(() => updateActionBarStats());
    });
    document.getElementById('ap-close').addEventListener('click', () => {
      void onCloseClick();
    });
  }

  function updateActionBarStats() {
    const statsEl = document.querySelector('.apply-pilot-bar-stats');
    if (!statsEl) return;
    const total = matchResults.length;
    const matched = matchResults.filter(r => r.value).length;
    const filled = matchResults.filter(r => r.filled).length;
    statsEl.textContent = I18n.t('content.notif.statsBar', { total, matched, filled });
  }

  function updateOverlay() {
    document.querySelectorAll('.apply-pilot-badge').forEach(badge => {
      const idx = parseInt(badge.dataset.idx);
      const result = matchResults[idx];
      if (result?.filled) {
        badge.classList.remove('matched');
        badge.classList.add('filled');
        badge.textContent = '✓';
        badge.title = I18n.t('content.notif.tryFilled', { hint: FRAMEWORK_VERIFY_HINT_TOAST() });
      }
    });
  }

  function removeOverlay() {
    overlayVisible = false;
    document.querySelectorAll('.apply-pilot-badge').forEach(el => el.remove());
    const bar = document.getElementById('apply-pilot-action-bar');
    if (bar) bar.remove();
  }

  function highlightElement(element, message) {
    element.style.outline = '2px solid #f59e0b';
    element.title = `[Apply Pilot] ${message}`;
  }


  // ========== 通知 ==========

  function showNotification(message, type = 'info', durationMs = 4000) {
    const existing = document.getElementById('apply-pilot-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'apply-pilot-notification';
    notification.className = `apply-pilot-notif apply-pilot-notif-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), durationMs);
  }


  // ========== 消息监听（来自 popup 或 background） ==========

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'scanAndFill') {
      scanAndFill(msg.options || {}).then(() => {
        sendResponse({ success: true, stats: getStats() });
      });
      return true; // 异步响应
    }

    if (msg.action === 'fillAll') {
      fillAllMatchedFields();
      sendResponse({ success: true, stats: getStats() });
    }

    if (msg.action === 'fillHighConfidence') {
      fillHighConfidenceFields();
      sendResponse({ success: true, stats: getStats() });
    }

    if (msg.action === 'getStats') {
      sendResponse({ stats: getStats() });
    }

    if (msg.action === 'clearOverlay') {
      removeOverlay();
      sendResponse({ success: true });
    }
  });

  function getStats() {
    return {
      total: matchResults.length,
      matched: matchResults.filter(r => r.value).length,
      filled: matchResults.filter(r => r.filled).length,
      unmatched: matchResults.filter(r => !r.value).length,
    };
  }

  console.log('[Apply Pilot] Content script loaded and ready');
})();
