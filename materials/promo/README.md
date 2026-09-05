# 宣传图与高清母版

更新：2026-09-05。近期更新的 5 张宣传图及网站 OG 封面已重新渲染；流程说明、功能说明、表单标签和按钮调整了字号或文字亮度。

## 文件选择

| 内容 | 原尺寸版本 | 2 倍像素密度母版 |
|---|---|---|
| 主宣传图 | [1-hero.png](1-hero.png)，1280 × 800 | [1-hero@2x.png](retina/1-hero@2x.png)，2560 × 1600 |
| 使用流程 | [2-how-it-works.png](2-how-it-works.png)，1280 × 800 | [2-how-it-works@2x.png](retina/2-how-it-works@2x.png)，2560 × 1600 |
| 功能介绍 | [3-features.png](3-features.png)，1280 × 800 | [3-features@2x.png](retina/3-features@2x.png)，2560 × 1600 |
| 小宣传图 | [tile-440x280.png](tile-440x280.png)，440 × 280 | [tile-440x280@2x.png](retina/tile-440x280@2x.png)，880 × 560 |
| 横幅 | [marquee-1400x560.png](marquee-1400x560.png)，1400 × 560 | [marquee-1400x560@2x.png](retina/marquee-1400x560@2x.png)，2800 × 1120 |
| 网站分享封面 | [og-cover.png](../../docs/images/og-cover.png)，1200 × 630 | [og-cover@2x.png](retina/og-cover@2x.png)，2400 × 1260 |

原尺寸版本沿用既有路径，供现有页面或指定尺寸的素材位置使用。高清版集中放在 `retina/`，用于高像素密度展示、查看细节和后续排版。高清版的像素尺寸不同，上传前应选用目标位置要求的版本。

两套图片均由同一 HTML 源文件分别按 `deviceScaleFactor: 1` 和 `2` 直接生成，为 24 位 RGB PNG，无透明通道；未放大旧 PNG，也未对截图进行缩放或锐化处理。

## 重新生成

在项目根目录运行 [scripts/render-promo.js](../../scripts/render-promo.js)。需要已有的 Playwright 和 Microsoft Edge；脚本不会安装依赖。默认使用 macOS 的 `/Applications/Microsoft Edge.app`，通过 `PROMO_BROWSER_PATH` 可指定其他已安装的 Chromium 浏览器可执行文件。

如果当前 Node 环境能够直接加载 Playwright：

```sh
node scripts/render-promo.js
```

如果 Playwright 已安装在独立工具环境，指定其模块路径：

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright node scripts/render-promo.js
```

脚本启动独立无界面浏览器，加载本地 HTML，等待字体就绪，检查图片资源和文字边界，再覆盖表中的 12 个 PNG。源文件和输出映射保存在脚本的 `assets` 列表中。

本次检查：12 个 PNG 的尺寸、RGB 格式、图片资源和文字边界检查通过；人工查看了 6 张原尺寸图及流程、功能两张高清图，未发现文字重叠或裁切。自动边界检查不能替代排版目检。

## 其他素材

`apply-pilot-promo-*.png` 是之前保留的 4 张插画，本次未重新生成。宣传图中的示意表单由 HTML 绘制；真实扩展界面截图见 [screenshots/README.md](../screenshots/README.md)。
