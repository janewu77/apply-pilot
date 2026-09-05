# 界面截图（高清母版）

更新日期：2026-09-05。截图对应当前 **v2.2.3** 工作区源码，9 张图片均已用 Microsoft Edge 重新渲染截图，采用 **2 倍像素密度、24 位 RGB PNG、无透明通道**。普通页面为 **2560 × 1600**，`setting_ollama.png` 为 **2560 × 2000**。这些文件是高清母版；用于商店上传时需另行按上传要求导出尺寸。

## 图片内容

| 文件 | 内容 |
|---|---|
| [apply_1.png](apply_1.png) | 本地演示表单扫描结果：9 个字段，8 个匹配，1 个待手填 |
| [apply_2.png](apply_2.png) | 同一表单实际填写后的结果：8 个已填，1 个保留空白 |
| [setting_profile.png](setting_profile.png) | 智能导入说明和示例个人资料 |
| [setting_links.png](setting_links.png) | 示例在线资料链接 |
| [setting_work.png](setting_work.png) | 示例工作信息 |
| [setting_QA.png](setting_QA.png) | 示例申请问答模板 |
| [setting_llm.png](setting_llm.png) | Anthropic、OpenAI、Ollama 三个服务选项及当前 Claude 默认模型 |
| [setting_ollama.png](setting_ollama.png) | Ollama 本机地址、真实模型发现结果、连接测试入口和折叠的首次配置说明 |
| [setting_data.png](setting_data.png) | 档案和问答导入、导出及重置入口 |

制作商店展示图时可选这 5 张母版：`apply_2.png`、`setting_profile.png`、`setting_QA.png`、`setting_llm.png`、`setting_ollama.png`。其余图片作为备选。

## 截图来源与验证范围

- 在独立临时 Microsoft Edge（Chromium）配置中加载真实扩展源码，使用真实扩展页面、存储和 content script；没有模拟 Chrome API 或重绘扩展界面。未访问日常 Chrome 配置。
- 使用 Alex Morgan 的虚构示例资料，未使用真实 API Key。截图中的云端密钥输入框为空，仅显示 placeholder。
- 所有页面均使用 100% 浏览器缩放和 `deviceScaleFactor: 2`。普通页面视口为 1280 × 800 CSS 像素；Ollama 页增加至 1280 × 1000 CSS 像素，完整展示配置卡片。PNG 直接取自浏览器原生截图，没有放大旧图或重新采样。
- 两张填写截图来自仓库中的[本地演示表单](../../example/store-demo-form.html)，替换了旧的第三方招聘页面截图。页面明确标注 Demo，不发送申请。
- 演示时关闭 AI，真实验证了关键词匹配与填写；检查了电话、城市、国家及待手填字段的值。截图不代表 AI 推理或任意招聘网站的兼容性测试。
- Ollama 图中的 6 个模型来自本机 `/api/tags` 的真实响应；没有运行连接测试、推理或智能导入，也未下载模型。
- 已检查图片尺寸、RGB 格式、选中状态、文本和主要控件的显示。长设置页按当前视口截图，不是整页长图。

## 历史问题说明

上一轮截图曾发现城市关键词 `ort` 的子串误匹配。当前版本已包含短关键词边界修复，详见 [CHANGELOG](../../CHANGELOG.md)。本次沿用 “A message for the hiring team” 演示问题，重新验证了 9 个字段、8 个匹配、1 个未匹配，以及电话、城市、国家和留空字段的实际值；这不等同于完整的匹配回归验收。
