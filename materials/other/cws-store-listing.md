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
• AI semantic matching (optional): uses Claude, GPT, or a model served by Ollama to handle fields that don't match keywords.
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
• Your profile, settings, and learned answers are saved locally in Chrome Storage.
• When you enable AI matching or explicitly use an AI action, relevant data is sent to your selected service (Anthropic, OpenAI, or Ollama). No AI requests are routed through an Apply Pilot server.
• Smart import sends the selected document content to your configured service, even when automatic AI matching is disabled. Connection testing sends a short test prompt.
• Ollama connects through a local loopback address. Downloaded local models run on your device; cloud models served through Ollama run remotely.
• Your cloud API key is only used to call the AI provider you choose. Ollama does not require an API key in the extension.
• Export a profile backup or reset all data any time in Settings.
• activeTab + scripting: needed to scan and fill the form on the current page — only activated when you explicitly trigger the extension.
• storage: saves your profile and learned answers locally.
• Localhost host permissions: allow the extension to discover models and send AI requests to your configured local Ollama server.
```


## privacy
https://janewu77.github.io/apply-pilot/privacy.html

---

## Permission Justifications
*(CWS Developer Dashboard → Privacy practices → Permission justification)*

**storage justification**
Apply Pilot uses Chrome Storage to save the user's profile data (name, contact info, work history, education, Q&A presets), LLM settings (provider choice, API key, and Ollama server/model settings), and auto-learned field answers locally across browser sessions. Separately, when the user enables AI matching or explicitly invokes an AI action, relevant data is sent to the selected AI service as described in the privacy policy. No AI requests are routed through an Apply Pilot server.

**activeTab justification**
Apply Pilot needs access to the currently active tab to scan form fields on the job application page the user is viewing and to inject match labels and the action bar when the user clicks the extension icon or uses the Alt+F shortcut. Access is only requested at the moment the user triggers the extension — not in the background.

**scripting justification**
Apply Pilot uses the scripting API to inject its content script and CSS overlay into the active tab. This is required to detect form fields, display colour-coded match labels (blue/green/yellow), and fill in values — all of which require direct interaction with the page's DOM. The script is only injected when the user explicitly triggers the extension.

**host permissions justification**
Apply Pilot requires HTTP/HTTPS access to loopback addresses (localhost, 127.0.0.1, and [::1]) so its background service worker can connect to the user's configured local Ollama server. This supports installed-model discovery, connection testing, AI form-field matching, draft answer generation, and user-initiated text/Markdown document import. Requests are restricted to the fixed /api/tags and /api/chat endpoints; redirects are rejected. These host permissions do not grant access to arbitrary websites. Downloaded local models run on the user's device; cloud models served through Ollama run remotely.

*Publishing: after uploading the new extension package, copy these justifications into CWS Developer Dashboard → Privacy practices → Permission justification and save them. This local file does not sync to the dashboard automatically.*

## Screenshots
Up to a maximum of 5
1280x800 or 640x400
JPEG or 24-bit PNG (no alpha)
At least one is required

Current UI screenshots and capture notes: [materials/screenshots/README.md](../screenshots/README.md).
Suggested five: `apply_2.png`, `setting_profile.png`, `setting_QA.png`, `setting_llm.png`, and `setting_ollama.png`.
