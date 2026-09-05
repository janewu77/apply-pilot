# 商店界面截图

更新日期：2026-09-05。截图对应当前 v2.2.2 工作区源码，全部为 **1280 × 800、24 位 RGB PNG、无透明通道**。原有 8 张图片已重截，新增 `setting_ollama.png`。

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

商店的 5 张展示图可选：`apply_2.png`、`setting_profile.png`、`setting_QA.png`、`setting_llm.png`、`setting_ollama.png`。其余图片作为备选。

## 截图来源与验证范围

- 在独立临时 Microsoft Edge（Chromium）配置中加载真实扩展源码，使用真实扩展页面、存储和 content script；没有模拟 Chrome API 或重绘扩展界面。未访问日常 Chrome 配置。
- 使用 Alex Morgan 的虚构示例资料，未使用真实 API Key。截图中的云端密钥输入框为空，仅显示 placeholder。
- 设置页使用 100% 浏览器缩放；Ollama 页使用 85% 缩放以完整展示配置卡片。输出尺寸均为 1280 × 800。
- 两张填写截图来自仓库中的[本地演示表单](../../example/store-demo-form.html)，替换了旧的第三方招聘页面截图。页面明确标注 Demo，不发送申请。
- 演示时关闭 AI，真实验证了关键词匹配与填写；检查了电话、城市、国家及待手填字段的值。截图不代表 AI 推理或任意招聘网站的兼容性测试。
- Ollama 图中的 6 个模型来自本机 `/api/tags` 的真实响应；没有运行连接测试、推理或智能导入，也未下载模型。
- 已检查图片尺寸、RGB 格式、选中状态、文本和主要控件的显示。长设置页按当前视口截图，不是整页长图。

## 本次发现的独立问题

`src/matcher.js` 的城市关键词包含 `ort`，按子串匹配时，会把带有 `opportunity` 的问题误判为城市字段。首次尝试使用 “What interests you about this opportunity?” 时复现了这一问题。本次未修改匹配逻辑；最终演示问题为 “A message for the hiring team”，真实结果为未匹配并保留空白。此问题仍需单独修复，不应把本次截图当作匹配准确性验收。
