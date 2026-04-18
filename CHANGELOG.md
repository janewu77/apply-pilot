# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---


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
