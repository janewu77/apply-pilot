# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.3] - 2026-09-05

No additional user-facing changes since 2.2.2.

## [2.2.2] - 2026-09-05

### Fixed

- Prevent nearby labels, such as city names, from overriding a field's own label, input type, or autocomplete information
- Prevent short keywords such as `ort` and `tel` from matching unrelated words
- Improve recognition of camelCase field names and autocomplete values with section or contact prefixes

### Changed

- Clarify that smart import sends the selected document to the configured AI service even when automatic matching is disabled
- Clarify data handling for cloud AI services and Ollama, including the distinction between local and cloud models

## [2.2.1] - 2026-09-05

No separate release notes are available for this version.

## [2.2.0] - 2026-09-05

### Added

- Ollama support for AI field matching and answer generation without an API key
- TXT and Markdown smart import through Ollama; PDF import is not supported by this provider
- Ollama model discovery and selection, with a saved default and connection testing
- Ollama setup instructions and guidance for connection permission errors

### Changed

- Require Chrome 110 or later for Ollama support

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
