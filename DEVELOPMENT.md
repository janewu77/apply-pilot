# Development Guide

本文档面向想要在本地运行、调试或修改 Apply Pilot 的开发者。

## 环境要求

- Google Chrome 浏览器（Manifest V3 支持，Chrome 88+）
- 无需 Node.js / 构建工具 —— 这是一个纯原生 JS 扩展，直接加载即可运行

## 本地加载扩展

本地加载方式见 README 的"安装步骤"一节，选择 `src/` 文件夹加载即可。修改代码后点击扩展卡片上的刷新图标生效；Content Script 改动还需刷新目标页面。

## 项目结构

```
apply-pilot/
├── src/
│   ├── manifest.json        # 扩展配置（权限、入口、图标等）
│   ├── background.js        # Service Worker：处理快捷键、安装事件
│   ├── content.js           # Content Script 主控制器：扫描、匹配、填充、UI 注入
│   ├── matcher.js           # 关键词匹配引擎（英/德/中三语关键词表）
│   ├── llm.js               # LLM 语义匹配模块（Anthropic / OpenAI API 调用）
│   ├── profile.js           # 用户档案数据结构与 Chrome Storage 读写
│   ├── popup.html           # 点击扩展图标弹出的小窗口
│   ├── popup.js             # 弹窗逻辑
│   ├── options.html         # 设置页面
│   ├── options.js           # 设置页面逻辑（档案编辑、AI 配置、数据导入导出）
│   ├── styles/
│   │   └── overlay.css      # 页面内注入的标签与操作栏样式
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── doc/
│   └── todo.md              # 项目待办
├── README.md
├── DEVELOPMENT.md           # 本文档
├── CONTRIBUTING.md
└── LICENSE
```

## 核心模块说明

### `profile.js`
定义 `DEFAULT_PROFILE` 数据结构（个人信息、工作信息、教育信息、常见问答等），提供 `loadProfile()` / `saveProfile()` 等工具函数。所有数据通过 `chrome.storage.local` 存储在本地，不上传任何服务器。

### `matcher.js`
维护一张关键词 → profile 字段的映射表（`FIELD_KEYWORDS`），支持英语、德语、中文三种语言。核心函数：
- `matchFieldByKeywords(element)` — 对单个表单字段做关键词匹配，返回匹配结果与置信度
- `extractFieldClues(element)` — 提取字段的 label、name、placeholder 等线索，供 LLM 和自动学习使用

### `llm.js`
当关键词匹配失败时，调用 LLM API 做语义推断。支持 Anthropic (Claude) 和 OpenAI (GPT)。API Key 由用户在设置页面输入，仅存储在本地 Chrome Storage 中，导出档案时不包含。

### `content.js`
Content Script 主控制器，注入到所有页面。负责：
- 扫描页面表单字段（过滤隐藏域、honeypot）
- 协调三轮匹配流程（关键词 → 历史学习 → LLM）
- 在页面上注入匹配标签（蓝/绿/黄）和底部操作栏
- 填充字段时触发原生事件（InputEvent + change + blur），兼容 React/Vue 受控组件

### `background.js`
Service Worker，职责很轻：监听 `Alt+F` 快捷键，转发 `scanAndFill` 消息给当前 Tab 的 content script；首次安装时自动打开设置页面。

## 数据存储结构

Chrome Storage Local 中存储两个 key：

```js
// 用户档案
chrome.storage.local.get('applyPilotProfile')
// 结构见 profile.js 中的 DEFAULT_PROFILE

// LLM 设置
chrome.storage.local.get('applyPilotLLM')
// { provider, apiKey, apiKeyOpenAI, model, enabled }
```

## 调试技巧

- **Content Script 日志**：打开目标页面的 DevTools → Console，过滤 `[Apply Pilot]`
- **Background 日志**：`chrome://extensions/` → 扩展卡片 → "Service Worker" 链接 → Console
- **Storage 内容查看**：DevTools → Application → Storage → Local Storage（注意：扩展的 Storage 在扩展自己的 DevTools 里，不是页面的）→ 或在 background console 执行 `chrome.storage.local.get(null, console.log)`
