# Apply Pilot

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.2-blue.svg)](src/manifest.json)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow.svg)](https://developer.chrome.com/docs/extensions/)

**Smart Job Application Form Auto-Filler** — [中文版](README.zh.md)

## What It Does

1. **One-click scan**: Automatically detects all form fields on the page
2. **Keyword matching**: Intelligently maps your profile to fields via label, placeholder, name, and other attributes
3. **AI semantic understanding**: Falls back to Claude/GPT API for fields that can't be matched by keywords
4. **Open-ended question generation**: Drafts answers for questions like "Why do you want to join us?"
5. **Auto-learning for unmatched fields**: When you manually fill a yellow "?" field and click **Save to Presets** (or confirm on close), the field clue and your answer are saved locally. Next time the same clue appears it will be matched with high confidence. These entries are tagged "Auto-learned" and appear under **Common Q&A Presets** in Settings, where you can edit or delete them
6. **You stay in control**: Review, edit, and submit everything yourself

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `src/` folder from this repository
5. The settings page opens automatically after installation

## Getting Started

### 1. Fill in your profile
After installation the settings page opens automatically. Fill in:
- **Personal info**: name, email, phone, etc.
- **Online profiles**: LinkedIn, GitHub links
- **Work info**: current title, years of experience, expected salary, etc.
- **Common Q&A**: preset answers for frequently asked interview/application questions

### 2. Configure AI (optional but recommended)
Go to the **AI Settings** tab:
- Choose Anthropic (Claude) or OpenAI (GPT)
- Enter the corresponding API key
- Click **Test connection** to verify
- Check **Enable AI semantic matching**

### 3. Start using
Open any job application page. Two ways to trigger:
- Click the 🚀 icon in the browser toolbar → **Scan & Match Form**
- Use the keyboard shortcut **Alt+F**

## Workflow

```
Open application page
    ↓
Click Scan (or Alt+F)
    ↓
Round 1: Keyword matching (instant)
    ↓
Round 2: Reuse learned answers from history (exact clue match)
    ↓
Round 3: AI semantic matching (if enabled, ~1–3 s)
    ↓
Colour-coded labels appear on page:
  🔵 Blue  = matched, click to fill
  🟢 Green = filled
  🟡 Yellow = unmatched, fill manually
    ↓
Bottom action bar:
  [Fill High-Confidence] [Fill All Matched] [Save to Presets] [Close]
  (On close, if unmatched fields already have content you can confirm saving them to presets)
    ↓
Review & edit → submit manually
```

### Bottom action bar — button reference

| Button | What it does |
|--------|-------------|
| **Fill High-Confidence** | Fills only **high-confidence** matched fields — those matched by keyword rules or by an exact match with a previously learned clue. Skips AI-only (medium-confidence) matches to reduce accidental fills. |
| **Fill All Matched** | Fills all matched fields (high and medium confidence), including keyword matches, learned-answer reuse, and AI semantic results. Yellow "unmatched" fields are left untouched. |
| **Save to Presets** | For still-**unmatched** (yellow `?`) fields: reads whatever you have typed in the page (blank or whitespace-only values are skipped), pairs it with the field's clue, and writes it to **Common Q&A Presets** in Settings for high-confidence reuse next time. Does not close the bar; labels refresh after saving. |

**Close** collapses all labels and the action bar. If any unmatched fields already have valid content at that point, you will be asked whether to save them to presets (same logic as **Save to Presets**).

## Supported Field Types

| Category | Fields |
|----------|--------|
| Personal info | Name, email, phone, gender, date of birth, nationality |
| Address | Street, city, state/province, postal code, country |
| Online profiles | LinkedIn, GitHub, portfolio, personal website |
| Work | Job title, company, years of experience, notice period, salary, start date, visa |
| Education | Degree, institution, major, graduation year |
| Skills | Language proficiency, technical skills, certifications |

## Supported Languages

Keyword matching supports forms in three languages:
- 🇬🇧 English
- 🇩🇪 Deutsch
- 🇨🇳 Chinese

## Data & Privacy

- All data is stored locally in Chrome Storage — **nothing is sent to any server**
- Your API key is only used to call the AI API when you enable that feature
- Exported profiles **do not include your API key**
- You can export a backup or reset all data at any time under Data Management
- **Export profile** includes the full profile (including auto-learned Q&A and `learnedAnswerMeta`); you can also separately **export / import Common Q&A** as JSON

## Keyboard Shortcut

| Shortcut | Action |
|----------|--------|
| `Alt+F` | Scan and match the current page's form |

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

## "Filled but still shows required field error"?

Many job sites use **React / Vue** controlled inputs: the field looks filled in the UI, but the framework's internal state wasn't updated — so validation still fails on submit.

**The extension tries hard to be compatible**: for text inputs it uses the native `value` setter and dispatches an **`InputEvent`** (`insertReplacementText`, `composed: true`) plus `change`, then a `blur` on the next frame to trigger the form's `touched`/validation logic. Dropdowns and checkboxes also receive `input`/`change` events.

**The UI warns you**: a yellow notice bar appears in the action bar after scanning; batch-fill notifications stay visible a few extra seconds with a self-check reminder; field label tooltips and the extension popup footer also carry a brief note.

If a specific site still reports errors, try:
1. In an auto-filled field, **type one character then delete it**, or **click inside then click outside** (triggers a real `focus`/`blur`).
2. Check for **a hidden input with the same name** (some sites validate against the hidden field, not the visible one).
3. If the **whole page is inside an iframe**, make sure the extension injected into the document you're actually filling.

## Known Limitations

- File uploads (resume) cannot be automated — they will be flagged for manual upload
- Some sites using Shadow DOM (e.g. Workday) may need extra adaptation
- Heavily dynamic forms may require waiting for the page to fully load before scanning

## Roadmap

- [ ] Dedicated adapters for major ATS platforms (Greenhouse, Lever, Workday)
- [ ] Resume file auto-upload
- [ ] Multiple profile support (different languages / job tracks)
- [ ] Fill history log

## Contributing

Issues and pull requests are welcome!

- Local development & project structure: see [DEVELOPMENT.md](DEVELOPMENT.md)
- Contribution guidelines: see [CONTRIBUTING.md](CONTRIBUTING.md)

## License

[MIT License](LICENSE)
