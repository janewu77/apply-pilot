# 参与贡献

感谢你对 Apply Pilot 的关注！无论是报告 Bug、提出建议还是提交代码，都非常欢迎。— [English](CONTRIBUTING.md)

## 提交 Issue

### 报告 Bug

请尽量提供以下信息，方便复现和定位：

- **Chrome 版本**（`chrome://settings/help` 可查看）
- **扩展版本**（`chrome://extensions/` 中查看）
- **出现问题的招聘网站**（如 LinkedIn、Greenhouse、某公司官网）
- **复现步骤**：一步步描述操作流程
- **实际结果** vs **期望结果**
- **DevTools Console 报错截图**（如有）

### 功能建议

直接描述你希望实现的场景和需求即可，不需要写技术方案。

---

## 提交 Pull Request

### 流程

1. Fork 本仓库
2. 从 `main` 分支创建你的功能分支：`git checkout -b feat/your-feature`
3. 本地修改和测试（参考 [DEVELOPMENT.zh.md](DEVELOPMENT.zh.md)）
4. 提交代码：`git commit -m "feat: 简短描述"`
5. Push 到你的 Fork：`git push origin feat/your-feature`
6. 在 GitHub 上发起 Pull Request，描述改动内容和测试方法

### PR 要求

- 每个 PR 只做一件事，保持改动范围清晰
- 在 PR 描述中说明：**改了什么、为什么改、如何测试**
- 如果修复了某个 Issue，在描述中加上 `Closes #issue编号`

---

## 代码风格

本项目没有引入 ESLint / Prettier，保持以下约定即可：

- 缩进用 **2 个空格**
- 字符串优先用**单引号**
- 函数和变量名用 **camelCase**，常量用 **UPPER_SNAKE_CASE**
- 每个模块顶部保留文件用途注释（参考现有文件格式）
- 避免引入外部依赖——本项目是纯原生 JS 扩展，不使用打包工具

## Commit 信息格式

使用简单的前缀区分类型：

| 前缀 | 含义 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | Bug 修复 |
| `docs:` | 文档改动 |
| `style:` | 样式调整 |
| `refactor:` | 重构（不影响功能） |
| `chore:` | 构建、配置等杂项 |

示例：`fix: 修复 LinkedIn 表单字段未能正确匹配 email 的问题`

---

再次感谢你的贡献 🙌
