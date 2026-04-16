/**
 * Apply Pilot - Popup 控制面板
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnScan = document.getElementById('btnScan');
  const btnFillAll = document.getElementById('btnFillAll');
  const btnClear = document.getElementById('btnClear');
  const openSettings = document.getElementById('openSettings');
  const messageEl = document.getElementById('message');

  function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.style.color = isError ? '#f87171' : '#fbbf24';
    setTimeout(() => { messageEl.textContent = ''; }, 3000);
  }

  function updateStats(stats) {
    if (!stats) return;
    document.getElementById('totalFields').textContent = stats.total ?? '-';
    document.getElementById('matchedFields').textContent = stats.matched ?? '-';
    document.getElementById('filledFields').textContent = stats.filled ?? '-';
  }

  async function sendToTab(message) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showMessage('无法连接到当前页面', true);
      return null;
    }
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          showMessage('请刷新页面后重试', true);
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  }

  // 扫描
  btnScan.addEventListener('click', async () => {
    btnScan.disabled = true;
    btnScan.textContent = '⏳ 扫描中...';
    const res = await sendToTab({
      action: 'scanAndFill',
      options: { useLLM: true, autoFill: false },
    });
    if (res?.stats) {
      updateStats(res.stats);
      showMessage('扫描完成');
    }
    btnScan.disabled = false;
    btnScan.innerHTML = '<span>🔍</span> 扫描并匹配表单';
  });

  // 填充全部
  btnFillAll.addEventListener('click', async () => {
    const res = await sendToTab({ action: 'fillAll' });
    if (res?.stats) {
      updateStats(res.stats);
      showMessage('填充完成');
    }
  });

  // 清除
  btnClear.addEventListener('click', async () => {
    await sendToTab({ action: 'clearOverlay' });
    showMessage('已清除');
    updateStats({ total: '-', matched: '-', filled: '-' });
  });

  // 打开设置页
  openSettings.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // 初始化时获取当前状态
  sendToTab({ action: 'getStats' }).then(res => {
    if (res?.stats) updateStats(res.stats);
  });
});
