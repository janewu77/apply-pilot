# Privacy Policy — Apply Pilot

**Last updated: April 16, 2026**

Apply Pilot ("the Extension") is a Chrome extension that helps you auto-fill job application forms using a personal profile you create and manage entirely on your own device.

---

## 1. Data We Collect and Store

Apply Pilot stores the following data **locally on your device** using Chrome's built-in `chrome.storage.local` API. This data never leaves your device unless you explicitly enable the optional AI feature described in Section 3.

| Category | Examples |
|---|---|
| Personal information | Name, email address, phone number, date of birth, gender, nationality |
| Address | Street, city, state, postal code, country |
| Online profiles | LinkedIn, GitHub, portfolio, personal website URLs |
| Work information | Job title, company, years of experience, notice period, salary expectation, work authorization status |
| Education | Degree, university, major, graduation year |
| Skills | Programming languages, technical skills, certifications |
| Pre-written answers | Your prepared answers to common application questions (e.g., "Why do you want this role?") |
| AI provider settings | Your chosen AI provider (Anthropic or OpenAI), model name, and API key — stored locally only |

**We do not operate any servers. None of this data is transmitted to Apply Pilot or its developer.**

---

## 2. How We Use Your Data

Your profile data is used solely to:

- Automatically detect and fill form fields on job application pages you visit
- Match form fields to the relevant profile entries using keyword and semantic analysis
- Generate draft answers for open-ended application questions (when AI is enabled)
- Remember answers you manually enter so the same field can be filled automatically next time ("auto-learning")

---

## 3. Optional AI Features and Third-Party Data Transmission

Apply Pilot includes an **optional AI matching feature** powered by third-party large language model (LLM) APIs. This feature is **disabled by default** and only activates when you:

1. Explicitly enable it in the extension's Settings page, and
2. Provide your own API key from Anthropic or OpenAI.

**When AI is enabled**, the following data is sent to the API provider you selected (Anthropic or OpenAI):

- Selected fields from your profile (e.g., job title, years of experience, skills, education, pre-written answers)
- Information about unmatched form fields on the current page (field labels, placeholders, input types)

This data is transmitted directly from your browser to the API provider. It is **not** routed through any Apply Pilot server.

Please review the privacy policies of your chosen provider:
- Anthropic: https://www.anthropic.com/privacy
- OpenAI: https://openai.com/policies/privacy-policy

**If you do not enable the AI feature, no data is ever sent to any external service.**

---

## 4. Data Storage and Retention

All data is stored locally in your browser using `chrome.storage.local`. It remains on your device until you:

- Manually clear it in the Settings page
- Uninstall the extension (which removes all stored data)

Apply Pilot does not have access to your stored data, cannot retrieve it, and cannot delete it on your behalf.

---

## 5. Permissions Explanation

| Permission | Purpose |
|---|---|
| `storage` | Save your profile and settings locally on your device |
| `activeTab` | Read the current tab's URL to identify the active page |
| `scripting` | Inject the form-filling script into the current page when you trigger it |
| `host_permissions: <all_urls>` | Job application forms exist across thousands of different employer and recruiting platform websites. Broad host permission is required so the extension can work on any site you choose to use it on. |

---

## 6. Data Sharing

Apply Pilot does **not**:

- Sell, rent, or share your personal data with any third party
- Transmit your data to any Apply Pilot server
- Use your data for advertising or analytics
- Share data with third parties except as described in Section 3 (API calls you initiate)

---

## 7. Children's Privacy

Apply Pilot is intended for adults seeking employment. We do not knowingly collect data from users under the age of 16.

---

## 8. Changes to This Policy

If this policy is updated, the "Last updated" date at the top of this page will change. Continued use of the extension after changes constitutes acceptance of the updated policy.

---

## 9. Contact

If you have questions or concerns about this privacy policy, please contact:

**Email:**  support@littlellm.com
**GitHub:** https://github.com/janewu77/apply-pilot
