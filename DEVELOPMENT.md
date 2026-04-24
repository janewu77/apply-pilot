# Development Guide

For developers who want to run, debug, or modify Apply Pilot locally. — [中文版](DEVELOPMENT.zh.md)

## Requirements

- Google Chrome (Manifest V3 support, Chrome 88+)
- No Node.js or build tools required — this is a plain native JS extension that loads directly

## Loading the Extension Locally

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `src/` folder from this repository
5. The settings page opens automatically after installation
6. After editing code, click the refresh icon on the extension card to reload it. 
7. Changes to content scripts also require a page refresh on the target tab.

## Project Structure

```
apply-pilot/
├── src/
│   ├── manifest.json        # Extension config (permissions, entry points, icons)
│   ├── background.js        # Service Worker: handles shortcuts and install events
│   ├── content.js           # Content Script main controller: scan, match, fill, UI injection
│   ├── matcher.js           # Keyword matching engine (EN / DE / ZH keyword tables)
│   ├── llm.js               # LLM semantic matching module (Anthropic / OpenAI API calls)
│   ├── profile.js           # User profile data structure and Chrome Storage read/write
│   ├── popup.html           # Small popup window shown when clicking the extension icon
│   ├── popup.js             # Popup logic
│   ├── options.html         # Settings page
│   ├── options.js           # Settings page logic (profile editing, AI config, import/export)
│   ├── styles/
│   │   └── overlay.css      # Styles for injected labels and action bar
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── docs/                    # GitHub Pages root — web-facing content (privacy policy, etc.)
│   ├── privacy.html         # Privacy policy page
│   └── icons/               # Icons used in web pages
├── example/
│   ├── apply-pilot-profile-example.json   # Example profile export (data format reference)
│   └── apply-pilot-qa-example.json        # Example Q&A export (data format reference)
├── materials/               # Static assets for store listings and promotion (logos, screenshots, promo images)
│   ├── logo/
│   ├── screenshots/
│   └── promo/
├── README.md
├── README.zh.md
├── DEVELOPMENT.md           # This file
├── DEVELOPMENT.zh.md
├── CONTRIBUTING.md
├── CONTRIBUTING.zh.md
└── LICENSE
```

## Core Modules

### `profile.js`
Defines the `DEFAULT_PROFILE` data structure (personal info, work info, education, common Q&A, etc.) and provides utility functions like `loadProfile()` / `saveProfile()`. All data is stored locally via `chrome.storage.local` — nothing is sent to any server.

### `matcher.js`
Maintains a keyword → profile field mapping table (`FIELD_KEYWORDS`) supporting English, German, and Chinese. Key functions:
- `matchFieldByKeywords(element)` — keyword-matches a single form field and returns the match result with confidence level
- `extractFieldClues(element)` — extracts label, name, placeholder, and other clues from a field for use by the LLM and the auto-learning system

### `llm.js`
When keyword matching fails, calls the LLM API for semantic inference. Supports Anthropic (Claude) and OpenAI (GPT). The API key is entered by the user in Settings and stored only in local Chrome Storage; it is not included in exported profiles.

### `content.js`
The Content Script main controller, injected into all pages. Responsibilities:
- Scans page form fields (filters hidden fields and honeypots)
- Coordinates the three-round matching pipeline (keywords → learned history → LLM)
- Injects colour-coded match labels (blue/green/yellow) and the bottom action bar into the page
- Triggers native events when filling fields (`InputEvent` + `change` + `blur`) for React/Vue controlled component compatibility

### `background.js`
Service Worker with a light footprint: listens for the `Alt+F` (or `Option+F` on Mac) shortcut and forwards a `scanAndFill` message to the current tab's content script; automatically opens the settings page on first install.

## Hidden Field Filtering

The scanner automatically skips invisible inputs to avoid filling hidden honeypot fields. It detects 10 types of hidden elements:

1. `type=hidden` and `disabled` fields
2. CSS `display:none`, `visibility:hidden`, `opacity:0`
3. Extremely small dimensions (width or height < 2 px — common honeypot technique)
4. Off-screen via large negative `left`/`top` positioning
5. CSS clipping (`clip: rect(0,0,0,0)`, `clip-path: inset(100%)`, etc.)
6. CSS `width:0` / `height:0` / `max-width:0`
7. Ancestor element `overflow:hidden` + very small container (layered honeypot)
8. `aria-hidden="true"` on the element itself or an ancestor
9. `tabindex=-1` combined with suspicious dimensions
10. `name`/`id` containing honeypot keywords (`honeypot`, `trap`, `bot`, `leave_blank`, etc.)

## Data Storage

Two keys are stored in Chrome Storage Local:

```js
// User profile
chrome.storage.local.get('applyPilotProfile')
// Structure: see DEFAULT_PROFILE in profile.js

// LLM settings
chrome.storage.local.get('applyPilotLLM')
// { provider, apiKey, apiKeyOpenAI, model, enabled }
```

## React / Vue Compatibility

Many job sites use controlled inputs — the field looks filled in the UI, but the framework's internal state wasn't updated. To handle this, the extension:

- Uses the native `value` setter and dispatches an **`InputEvent`** (`insertReplacementText`, `composed: true`) plus `change`, then a `blur` on the next frame to trigger the form's `touched`/validation logic
- Dropdowns and checkboxes also receive `input`/`change` events
- A yellow notice bar appears in the action bar after scanning as a reminder to self-check filled fields

## Debugging Tips

- **Content Script logs**: open DevTools on the target page → Console, filter by `[Apply Pilot]`
- **Background logs**: `chrome://extensions/` → extension card → "Service Worker" link → Console
- **Inspect Storage**: DevTools → Application → Storage → Local Storage (note: the extension's storage lives in the extension's own DevTools, not the page's) — or run `chrome.storage.local.get(null, console.log)` in the background console
