# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.2] - 2026-09-05

### Changed
- Release 2.2.0 with local Ollama provider support.
- Release 2.1.1 with updated AI model defaults and broader open-ended filling.
- For google search
- Improve landing page SEO with icons, sitemap, and structured data
- Add GitHub Pages website badge (EN/ZH)
- Add OG cover image and meta tags for social preview
- Add product landing page (index.html)
- Document docs/ and materials/ layout in DEVELOPMENT tree
- Materials/ for promo, screenshots, logo, store listing
- Move privacy policy HTML back to docs/
- Move privacy policy HTML from docs/ to pages/
- Add Chrome Web Store badge and recommended install path to READMEs
- Refresh hero/features tiles and add 1400x560 marquee
- Add promo screenshots and marketing assets
## [2.2.1] - 2026-09-05

### Changed
- Release 2.2.0 with local Ollama provider support.
- Release 2.1.1 with updated AI model defaults and broader open-ended filling.
- For google search
- Improve landing page SEO with icons, sitemap, and structured data
- Add GitHub Pages website badge (EN/ZH)
- Add OG cover image and meta tags for social preview
- Add product landing page (index.html)
- Document docs/ and materials/ layout in DEVELOPMENT tree
- Materials/ for promo, screenshots, logo, store listing
- Move privacy policy HTML back to docs/
- Move privacy policy HTML from docs/ to pages/
- Add Chrome Web Store badge and recommended install path to READMEs
- Refresh hero/features tiles and add 1400x560 marquee
- Add promo screenshots and marketing assets
## [2.2.0] - 2026-09-05

### Added
- Local Ollama provider with configurable loopback address and installed model name, without an API key
- Background transport for local inference, connection testing, field matching, answer generation, and TXT/Markdown smart import
- Automatic Ollama model discovery, dropdown selection with a saved default, refresh control, and offline/empty-list feedback
- Settings-page Ollama setup guidance with per-extension commands, platform selection, copy support, and automatic guidance on HTTP 403
- Ollama regression tests and bilingual setup instructions

### Changed
- Require Chrome 110+ to keep slow local inference alive in the background worker

## [2.1.1] - 2026-09-04

### Changed
- Update AI defaults to Claude Sonnet 4.6 and GPT-5.6 Luna
- Add GPT-5.6 Terra as a higher-quality option and retain GPT-4o Mini for legacy compatibility
- Migrate retired or invalid saved model selections to supported replacements
- Generate AI answers for unmatched plain text inputs as well as textareas


## [2.1.0] - 2026-04-18

### Added
- Add Chrome Web Store listing screenshots and doc updates
- Add example profile and QA JSON; update README and DEVELOPMENT docs

### Changed
- Inject content scripts on user action; remove all_urls host permission

## [2.0.1] - 2026-04-18

### Changed
- Use extension icon in action bar; add web_accessible_resources for icons
- Streamline READMEs, expand developer docs, add CWS permissions

## [2.0.0] - 2026-04-18

### Changed
- Respect LLM toggle from storage; OpenAI key/model; batch textarea answers
- Improve form field matching and clue extraction
- Rename doc/ to docs/ and refresh dev docs
- Move privacy policy under docs/ with standalone HTML
- Auto-generate CHANGELOG from git in release script

## [1.1.3] - 2026-04-17

### Added
- Privacy Policy (English and Chinese)
- i18n support for content script (EN / ZH)
- Build and release scripts (`npm run pack`, `npm run release:*`)

### Changed
- Made English the primary language for README, CONTRIBUTING, and DEVELOPMENT docs
- Added Chinese variants (`-zh`) for all documentation

## [1.1.0] - 2026-03-01

### Added
- Init
- Smart form auto-fill with AI semantic matching
- Support for English, German, and Chinese job application forms
- Claude API and OpenAI GPT integration
- Chrome Manifest V3 extension
