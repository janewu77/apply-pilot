# Apply Pilot

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.2-blue.svg)](src/manifest.json)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow.svg)](https://developer.chrome.com/docs/extensions/)

**Smart Job Application Form Auto-Filler** — [中文版](README.zh.md)

Tired of typing the same information into every job application form? Apply Pilot fills it for you — instantly.

Save your profile once — name, contact info, work history, education, and Q&A presets — then let Apply Pilot scan and fill any application form with one click or `Alt+F` (`Option+F` on Mac).

- ⚡ **Keyword matching**: instantly maps your profile to form fields
- 🔄 **Learned answers**: reuses answers you've saved from previous applications
- 🤖 **AI semantic matching** (optional): connects to Claude or GPT to handle fields that don't match keywords
- 🟡 **Colour-coded labels**: Blue = matched · Green = filled · Yellow = unmatched, fill manually
- 📚 **Auto-learning**: manually fill a yellow field once, and it's remembered for next time
- 🔒 **Privacy-first**: all data stays in Chrome Storage — nothing sent to any server
- ✅ **You stay in control**: nothing is submitted automatically

Supports forms in English · Deutsch · 中文. Works on most job sites. No account required. No data collected.

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
- Use the keyboard shortcut **Alt+F** (or **Option+F** on Mac)

## Workflow

```
Open application page
    ↓
Click Scan (or Alt+F / Option+F on Mac)
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
- You can separately **export / import Common Q&A** as JSON
- See [`example/`](example/) for sample export files showing the expected JSON format

## Keyboard Shortcut

| Shortcut | Action |
|----------|--------|
| `Alt+F` (or `Option+F` on Mac) | Scan and match the current page's form |

## "Filled but still shows required field error"?

Some job sites may not recognize auto-filled values right away. If you see validation errors after filling, simply **press Tab to go through each field once** — that's usually enough to fix it.

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
