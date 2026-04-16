/**
 * Apply Pilot - Content Script (主控制器)
 * 注入到页面中，协调扫描、匹配、填充的完整流程
 */

(() => {
  // 避免重复注入
  if (window.__applyPilotInjected) return;
  window.__applyPilotInjected = true;

  /** 受控组件风险：界面有字但提交仍可能判空 — 需在 UI 中反复提醒用户自检 */
  const FRAMEWORK_VERIFY_HINT_SHORT =
    '部分招聘站用 React / Vue 等：框里看得见字，不等于已通过网站校验。提交前请在重要栏位里点一下或 Tab 离开，确认没有红字报错。';
  const FRAMEWORK_VERIFY_HINT_TOAST =
    '若点「提交」仍提示缺内容：在对应栏位内点击聚焦，或删一个字再输回，强制网站接受你的输入。';

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
      showNotification('请先在设置中填写你的个人档案', 'warning');
      return;
    }

    const rawProfile = await loadProfile();
    const learnedSigToKey = buildLearnedSignatureToProfileKeyMap(rawProfile);

    const fields = scanFormFields();
    if (fields.length === 0) {
      showNotification('当前页面没有检测到表单字段', 'info');
      return;
    }

    showNotification(`检测到 ${fields.length} 个表单字段，正在匹配...`, 'info');

    matchResults = [];
    let unmatchedForLLM = [];

    // 第一轮：关键词匹配
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

    // 第三轮：LLM 匹配（如果启用）
    if (options.useLLM && unmatchedForLLM.length > 0) {
      showNotification('正在用 AI 分析剩余字段...', 'info');
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
    }

    // 统计
    const matched = matchResults.filter(r => r.value);
    const unmatched = matchResults.filter(r => !r.value);
    showNotification(
      `匹配完成: ${matched.length} 个可填充, ${unmatched.length} 个需手动处理`,
      matched.length > 0 ? 'success' : 'warning'
    );

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
        `已自动填充 ${count} 个高置信度字段\n\n⚠ ${FRAMEWORK_VERIFY_HINT_TOAST}`,
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
        `已填充 ${count} 个字段\n\n⚠ ${FRAMEWORK_VERIFY_HINT_TOAST}`,
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
      highlightElement(element, '请手动上传文件');
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
      showNotification('没有在未匹配栏位中检测到填写内容', 'info');
      return;
    }
    const saved = await persistLearnedEntries(entries);
    if (!saved) {
      showNotification('没有可保存的回答（空白或未选择选项不会收集）', 'info');
      return;
    }
    await updateMatchResultsAfterLearn();
    removeOverlay();
    showOverlay();
    showNotification(`已将 ${saved} 条存入预设回答（常见问答）`, 'success');
  }

  async function onCloseClick() {
    const entries = collectManualAnswersToLearn();
    if (entries.length > 0) {
      const ok = confirm(
        '检测到未匹配栏位中已有填写内容。是否将这些内容存入「常见问答」预设，供下次自动匹配？\n\n点「取消」则直接关闭，不保存。'
      );
      if (ok) {
        const saved = await persistLearnedEntries(entries);
        if (saved > 0) {
          await updateMatchResultsAfterLearn();
          showNotification(`已保存 ${saved} 条到预设回答`, 'success');
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
          `将填入: ${result.value}\n来源: ${result.source}\n置信度: ${result.confidence}\n点击填充\n\n` +
          `提示：${FRAMEWORK_VERIFY_HINT_TOAST}`;
        badge.addEventListener('click', () => {
          fillField(result.element, result.value);
          result.filled = true;
          badge.classList.remove('matched');
          badge.classList.add('filled');
          badge.textContent = '✓';
          badge.title =
            `已尝试填入。${FRAMEWORK_VERIFY_HINT_TOAST}\n\n若提交报错，请在该栏位内再点一下或稍作编辑。`;
        });
      } else {
        badge.classList.add('unmatched');
        badge.textContent = '?';
        badge.title = `未能匹配\n线索: ${(result.clues || []).join(', ')}`;
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
        <div class="apply-pilot-bar-title">🚀 Apply Pilot</div>
        <div class="apply-pilot-bar-stats"></div>
        <div class="apply-pilot-bar-buttons">
          <button id="ap-fill-high">填充高置信度</button>
          <button id="ap-fill-all">填充全部匹配</button>
          <button id="ap-save-learned" title="把当前在未匹配栏位中填写的内容写入档案">存入预设回答</button>
          <button id="ap-close">关闭</button>
        </div>
      </div>
      <div class="apply-pilot-bar-hint" role="status">${FRAMEWORK_VERIFY_HINT_SHORT}</div>
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
    statsEl.textContent = `共 ${total} 字段 | 已匹配 ${matched} | 已填充 ${filled}`;
  }

  function updateOverlay() {
    document.querySelectorAll('.apply-pilot-badge').forEach(badge => {
      const idx = parseInt(badge.dataset.idx);
      const result = matchResults[idx];
      if (result?.filled) {
        badge.classList.remove('matched');
        badge.classList.add('filled');
        badge.textContent = '✓';
        badge.title =
          `已尝试填入。${FRAMEWORK_VERIFY_HINT_TOAST}\n\n若提交报错，请在该栏位内再点一下或稍作编辑。`;
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
