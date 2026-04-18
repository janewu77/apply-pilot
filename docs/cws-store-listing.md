# Chrome Web Store — Store Listing Copy

## Single-Purpose Statement
*(CWS Developer Dashboard → "Single purpose" field)*

> Apply Pilot auto-fills job application forms using your saved profile, keyword matching, and optional AI semantic understanding.

---

## Short Description
*(≤ 132 characters)*

> Auto-fill job application forms with one click. Supports keyword matching, AI semantic fill, and auto-learning. Works in English, German & Chinese.

Character count: 131

---

## Detailed Description

```
Tired of typing the same info into every job application? Apply Pilot fills forms for you — instantly.

Save your profile once — name, contact, work history, education, and Q&A presets — then fill any application form with one click or Alt+F (Option+F on Mac).

HOW IT WORKS
• Keyword matching: maps your profile to form fields using labels, placeholders, and field names.
• Learned answers: reuses answers you've saved from previous applications.
• AI semantic matching (optional): uses Claude or GPT to handle fields that don't match keywords.
• Open-ended questions (e.g. "Why do you want to join us?") can be drafted by AI.

COLOUR-CODED LABELS
🔵 Blue = matched | 🟢 Green = filled | 🟡 Yellow = needs manual input

AUTO-LEARNING
Fill a yellow field and click "Save to Presets" — the clue and answer are saved locally and matched automatically next time.

YOU STAY IN CONTROL
Nothing is submitted automatically. Review, edit, and submit everything yourself.

LANGUAGES
English · Deutsch · 中文

PERMISSIONS & PRIVACY
• All data stored locally in Chrome Storage — nothing sent to any server.
• Your API key is only used to call the AI provider you choose.
• Export a profile backup or reset all data any time in Settings.
• activeTab + scripting: needed to scan and fill the current page.
• storage: saves your profile and learned answers locally.
• host_permissions (<all_urls>): allows the extension to work on any job site.
```


## privacy
https://janewu77.github.io/apply-pilot/privacy.html

---

## Permission Justifications
*(CWS Developer Dashboard → Privacy practices → Permission justification)*

**storage justification**
Apply Pilot stores the user's profile data (name, contact info, work history, education, Q&A presets), LLM settings (provider choice and API key), and auto-learned field answers locally using Chrome Storage. All data stays on the user's device — nothing is sent to any server. Storage is also used to persist settings across browser sessions.

**activeTab justification**
Apply Pilot needs access to the currently active tab to scan form fields on the job application page the user is viewing and to inject match labels and the action bar when the user clicks the extension icon or uses the Alt+F shortcut. Access is only requested at the moment the user triggers the extension — not in the background.

**scripting justification**
Apply Pilot uses the scripting API to inject its content script and CSS overlay into the active tab. This is required to detect form fields, display colour-coded match labels (blue/green/yellow), and fill in values — all of which require direct interaction with the page's DOM. The script is only injected when the user explicitly triggers the extension.

**Host permission justification**
Job application forms exist on thousands of different domains — company career pages, and platforms like Greenhouse, Lever, Workday, Ashby, and others. There is no fixed list of job sites. The <all_urls> host permission is necessary so Apply Pilot can work on any job application page the user visits, regardless of domain.
