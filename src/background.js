/**
 * Apply Pilot - Background Service Worker
 * 处理快捷键和扩展消息
 */

// 监听快捷键
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill-form') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'scanAndFill',
        options: { useLLM: true, autoFill: false },
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
