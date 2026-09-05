/**
 * Apply Pilot - i18n / Internationalization
 * Supports: English (en, default), Chinese Simplified (zh)
 */

const TRANSLATIONS = {
  en: {
    // ── Popup ──────────────────────────────────────────────
    'popup.stat.fieldsDetected':  'Fields Detected',
    'popup.stat.matched':         'Matched',
    'popup.stat.filled':          'Filled',
    'popup.btn.scan':             'Scan & Match Form  (Alt+F)',
    'popup.btn.fillAll':          'Fill All Matched Fields',
    'popup.btn.clear':            'Clear Overlays',
    'popup.hint.strong':          'Before submitting, verify:',
    'popup.hint.body':            'Some sites (React/Vue etc.) may show filled text but still report empty. After auto-fill, click or Tab through important fields to confirm no errors before submitting.',
    'popup.footer.settings':      '⚙️ Profile Settings',
    'popup.footer.shortcut':      'Alt+F Quick Scan',

    // Popup dynamic messages
    'popup.msg.noTab':            'Cannot connect to current page',
    'popup.msg.refresh':          'Please refresh the page and try again',
    'popup.msg.scanning':         '⏳ Scanning...',
    'popup.msg.scanDone':         'Scan complete',
    'popup.msg.fillDone':         'Fill complete',
    'popup.msg.cleared':          'Cleared',

    // ── Options – Top bar ──────────────────────────────────
    'options.title':              'Apply Pilot Settings',
    'options.saveAuto':           'All changes auto-saved',
    'options.saved':              '✓ Saved',

    // ── Options – Tabs ─────────────────────────────────────
    'options.tab.profile':        '📋 Profile',
    'options.tab.links':          '🔗 Links',
    'options.tab.work':           '💼 Work',
    'options.tab.qa':             '💬 Q&A',
    'options.tab.llm':            '🤖 AI Settings',
    'options.tab.data':           '📦 Data',

    // ── Options – Smart Import ─────────────────────────────
    'options.smartImport.title':        '📄 Smart Import — Upload resume, auto-fill profile',
    'options.smartImport.desc':         'Upload your resume or personal profile document. AI will automatically extract all information to fill in the profile. Requires API Key configured in AI Settings.',
    'options.smartImport.dropTitle':    'Click to upload or drag file here',
    'options.smartImport.dropDesc':     'AI will automatically extract personal info, work experience, education, skills, etc.',
    'options.smartImport.prep':         'Preparing...',
    'options.smartImport.confirmBtn':   'Confirm & Apply to Profile',
    'options.smartImport.cancelBtn':    'Cancel',
    'options.smartImport.extractDone':  '✅ AI extraction complete, please review:',
    'options.smartImport.readingFile':  'Reading {filename}...',
    'options.smartImport.readingPdf':   'Reading PDF...',
    'options.smartImport.extracting':   'AI is extracting personal information...',
    'options.smartImport.generating':   'Extraction complete, generating preview...',

    // ── Options – Profile ──────────────────────────────────
    'options.profile.basicInfo':    '👤 Basic Information',
    'options.profile.firstName':    'First Name',
    'options.profile.lastName':     'Last Name',
    'options.profile.fullName':     'Full Name',
    'options.profile.fullNameHint': 'For sites with a single name input field',
    'options.profile.email':        'Email',
    'options.profile.phone':        'Phone',
    'options.profile.dob':          'Date of Birth',
    'options.profile.gender':       'Gender',
    'options.profile.nationality':  'Nationality',
    'options.profile.location':     'Current Location',
    'options.profile.address':      '🏠 Address',
    'options.profile.street':       'Street Address',
    'options.profile.city':         'City',
    'options.profile.state':        'State / Province',
    'options.profile.postal':       'Postal Code',
    'options.profile.country':      'Country',
    'options.profile.education':    '🎓 Education',
    'options.profile.degree':       'Highest Degree',
    'options.profile.university':   'University',
    'options.profile.major':        'Major',
    'options.profile.gradYear':     'Graduation Year',
    'options.profile.skills':       '🛠️ Skills',
    'options.profile.langSkills':   'Language Skills',
    'options.profile.techSkills':   'Technical Skills',
    'options.profile.certifications': 'Certifications',

    // Select placeholders
    'options.select.prompt':              '-- Select --',
    'options.gender.male':                'Male',
    'options.gender.female':              'Female',
    'options.gender.other':               'Other',
    'options.gender.preferNotToSay':      'Prefer not to say',
    'options.relocate.yes':               'Yes',
    'options.relocate.no':                'No',
    'options.relocate.open':              'Open to discussion',
    'options.visa.notNeeded':             'Not needed',
    'options.visa.yes':                   'Yes, need sponsorship',
    'options.visa.no':                    'No',

    // ── Options – Links ────────────────────────────────────
    'options.links.title':      '🔗 Online Links',
    'options.links.portfolio':  'Portfolio',
    'options.links.website':    'Personal Website',

    // ── Options – Work ─────────────────────────────────────
    'options.work.title':           '💼 Current Work Status',
    'options.work.currentTitle':    'Current Title',
    'options.work.currentCompany':  'Current Company',
    'options.work.yearsExp':        'Years of Experience',
    'options.work.noticePeriod':    'Notice Period',
    'options.work.salary':          'Salary Expectation',
    'options.work.startDate':       'Earliest Start Date',
    'options.work.relocate':        'Willing to Relocate',
    'options.work.workAuth':        'Work Authorization',
    'options.work.visa':            'Visa Sponsorship Needed',

    // ── Options – Q&A ──────────────────────────────────────
    'options.qa.title':           '💬 Common Interview / Application Question Templates',
    'options.qa.desc':            'Pre-set answers for common questions. AI uses these as reference when filling related fields. After scanning, manually fill unfilled fields and click "Save as template answer" — they will appear here (marked "Auto-learned") and will be matched with high confidence next time.',
    'options.qa.selfIntro':       'Self Introduction',
    'options.qa.whyCompany':      'Why this company?',
    'options.qa.whyRole':         'Why this role?',
    'options.qa.strength':        'Greatest strength',
    'options.qa.weakness':        'Greatest weakness',
    'options.qa.careerGoals':     'Career goals',
    'options.qa.addBtn':          '+ Add Question',
    'options.qa.newKeyPh':        'New question label (English, e.g. teamworkExample)',
    'options.qa.learnedBadge':    'Auto-learned',
    'options.qa.deleteBtn':       'Delete',
    'options.qa.answerPh':        'Your answer...',

    // ── Options – AI Settings ──────────────────────────────
    'options.llm.title':          '🤖 AI Semantic Matching Settings',
    'options.llm.desc':           'When keyword matching fails to identify form fields, AI will analyze field semantics and match the corresponding information. AI can also generate draft answers for open questions.',
    'options.llm.enable':         'Enable AI semantic matching',
    'options.llm.selectProvider': 'Select AI Provider',
    'options.llm.anthropicName':  'Anthropic (Claude)',
    'options.llm.anthropicDesc':  'Recommended — strong semantic understanding',
    'options.llm.ollamaName': 'Ollama (Local)',
    'options.llm.setupTitle': 'First-time setup: allow this extension in Ollama',
    'options.llm.setupIntro': 'Ollama must allow this extension to send requests. A model list can load even when inference is blocked with 403. If Test Connection already succeeds, no further setup is needed.',
    'options.llm.setupExpand': 'Show setup instructions and copy command',
    'options.llm.setupStep1': 'Choose how you run Ollama, then copy and run the command below. It adds this extension to OLLAMA_ORIGINS.',
    'options.llm.setupStep2': 'For desktop apps, fully quit Ollama from its menu and reopen it. Closing the window alone may leave the server running. For terminal startup, keep ollama serve running.',
    'options.llm.setupStep3': 'Return here, refresh models, then click Test Connection.',
    'options.llm.setupPlatform': 'Ollama environment',
    'options.llm.setupMac': 'macOS desktop app · Terminal',
    'options.llm.setupWin': 'Windows desktop app · PowerShell',
    'options.llm.setupLinux': 'Linux · terminal (bash)',
    'options.llm.setupCommand': 'Command for this extension',
    'options.llm.setupCopy': 'Copy command',
    'options.llm.setupCopied': 'Copied. Run it in your terminal; copying alone does not apply the setting.',
    'options.llm.setupCopyFailed': 'Copy was blocked. The command is selected; copy it manually.',
    'options.llm.setupScope': 'This only displays a command; the extension cannot change your system settings. Keep any origins configured elsewhere when adding this extension.',
    'options.llm.setupDocs': 'Official Ollama setup guide',
    'options.llm.setupNote.mac': 'Run in Terminal. This preserves origins already set with launchctl and adds this extension. The setting lasts for the current login session; after logging out or restarting the Mac, it may need to be applied again.',
    'options.llm.setupNote.win': 'Run in PowerShell. This adds the extension to your user environment variable and persists it. Then fully quit Ollama from the system tray and start it from the Start menu.',
    'options.llm.setupNote.linux': 'This command starts Ollama for this terminal session; stop any existing Ollama server first. If you use systemd, configure OLLAMA_ORIGINS in the service instead and restart it, following the official guide below.',
    'options.llm.setupForbidden': '❌ Ollama rejected this extension (403). Follow the expanded setup instructions above, restart Ollama, then test again.',
    'options.llm.ollamaRefresh': '↻ Refresh models',
    'options.llm.ollamaSelectModel': 'Select a model',
    'options.llm.ollamaLoading': 'Loading available models…',
    'options.llm.ollamaLoaded': '{count} models available. Your selection is saved automatically.',
    'options.llm.ollamaEmpty': 'No models found. Install a model in Ollama, then refresh.',
    'options.llm.ollamaUnavailable': '{model} (saved; unavailable or not verified)',
    'options.llm.ollamaLoadError': 'Could not load models: {msg}. Check that Ollama is running and the server address is correct; for 403, check OLLAMA_ORIGINS.',
    'options.llm.ollamaDesc': 'Local models, no API key',
    'options.llm.ollamaUrl': 'Local server address',
    'options.llm.ollamaUrlHint': 'Use localhost, 127.0.0.1 or [::1], with an optional port.',
    'options.llm.ollamaModelHint': 'Choose a model available on this server. Use a downloaded local model; cloud models run remotely.',
    'options.llm.ollamaHint': 'Start Ollama, select a model, then test the connection. First use may take longer while the model loads. Text/Markdown import is supported; PDF import is not supported.',
    'options.llm.ollamaTroubleshoot': 'Check the server address and ollama list. For a 403 error, allow this extension in OLLAMA_ORIGINS and restart Ollama.',
    'options.llm.openaiName':     'OpenAI (GPT)',
    'options.llm.openaiDesc':     'Widely used alternative',
    'options.llm.anthropicKey':   'Anthropic API Key',
    'options.llm.anthropicHint':  'Get from <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color: #60a5fa;">console.anthropic.com</a>',
    'options.llm.openaiKey':      'OpenAI API Key',
    'options.llm.openaiHint':     'Get from <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #60a5fa;">platform.openai.com</a>',
    'options.llm.modelLabel':     'Model',
    'options.llm.testBtn':        '🔌 Test Connection',
    // Model options
    'options.llm.claudeHaiku45':  'Claude Haiku 4.5 (Faster & cheaper)',
    'options.llm.claudeSonnet46': 'Claude Sonnet 4.6 (Recommended)',
    'options.llm.gpt56Luna':      'GPT-5.6 Luna (Recommended, efficient)',
    'options.llm.gpt56Terra':     'GPT-5.6 Terra (Higher quality)',
    'options.llm.gpt4oMini':      'GPT-4o Mini (Legacy compatibility)',
    // Test status
    'options.llm.testing':        '⏳ Testing connection...',
    'options.llm.noApiKey':       '❌ Please enter your API Key first',
    'options.llm.testSuccess':    '✅ Connected! ({provider} - {model})',
    'options.llm.testError':      '❌ API Error {status}: {msg}',
    'options.llm.networkError':   '❌ Network error: {msg}',

    // ── Options – Data ─────────────────────────────────────
    'options.data.title':         '📦 Import / Export Profile',
    'options.data.desc':          'Export your profile as a JSON backup, or import from file to restore.',
    'options.data.exportBtn':     '📤 Export Profile',
    'options.data.importBtn':     '📥 Import Profile',
    'options.data.qaDesc':        'Q&A only (with auto-learned entries and metadata):',
    'options.data.exportQaBtn':   '📤 Export Q&A',
    'options.data.importQaBtn':   '📥 Import Q&A',
    'options.data.dangerTitle':   '⚠️ Danger Zone',
    'options.data.dangerDesc':    'Clear all saved profile data. This action cannot be undone.',
    'options.data.resetBtn':      '🗑️ Reset All Data',

    // ── Options – Alert / Confirm messages ────────────────
    'options.alert.invalidQaKey':     'Label can only contain letters and numbers, and must start with a letter',
    'options.alert.invalidQaFile':    'Invalid Q&A file (missing commonAnswers)',
    'options.alert.qaImported':       'Q&A imported and merged successfully.',
    'options.alert.invalidProfileFile':'Invalid profile file format',
    'options.alert.parseFailed':      'File parse failed: {msg}',
    'options.alert.profileImported':  'Profile imported successfully!',
    'options.alert.resetConfirm1':    'Are you sure you want to clear all data? This cannot be undone!',
    'options.alert.resetConfirm2':    'Confirm again: all personal profile and settings will be permanently deleted.',
    'options.alert.deleteQaConfirm':  'Delete this auto-learned entry?',
    'options.alert.importApplied':    'Profile updated! You can review and fine-tune the fields below.',
    'options.alert.noApiKey':         'Please configure your API Key in the AI Settings tab first. Smart Import requires AI to extract information.',
    'options.alert.fileContentTooShort': 'File content too short to extract meaningful information',
    'options.alert.smartImportFailed': 'Smart import failed: {msg}',
    'options.alert.anthropicApiError': 'Anthropic API error {status}: {msg}',
    'options.alert.openaiApiError':    'OpenAI API error {status}: {msg}',
    'options.alert.ollamaNoPdf': 'Ollama import supports Markdown/TXT only. Convert your PDF to text first.',
    'options.alert.openaiNoPdf':       'OpenAI does not support PDF directly. Please switch to Anthropic (Claude) in AI Settings, or upload Markdown/TXT format.',

    // ── Options – Import Preview labels ───────────────────
    'options.preview.firstName':   'First Name',
    'options.preview.lastName':    'Last Name',
    'options.preview.fullName':    'Full Name',
    'options.preview.email':       'Email',
    'options.preview.phone':       'Phone',
    'options.preview.dob':         'Date of Birth',
    'options.preview.gender':      'Gender',
    'options.preview.nationality': 'Nationality',
    'options.preview.location':    'Location',
    'options.preview.street':      'Street',
    'options.preview.city':        'City',
    'options.preview.state':       'State/Province',
    'options.preview.postal':      'Postal Code',
    'options.preview.country':     'Country',
    'options.preview.linkedin':    'LinkedIn',
    'options.preview.github':      'GitHub',
    'options.preview.portfolio':   'Portfolio',
    'options.preview.website':     'Website',
    'options.preview.twitter':     'Twitter',
    'options.preview.currentTitle':    'Current Title',
    'options.preview.currentCompany':  'Current Company',
    'options.preview.yearsExp':        'Years of Exp.',
    'options.preview.noticePeriod':    'Notice Period',
    'options.preview.salary':          'Salary Exp.',
    'options.preview.relocate':        'Willing to Relocate',
    'options.preview.workAuth':        'Work Auth.',
    'options.preview.visaSponsorship': 'Visa Sponsorship',
    'options.preview.startDate':       'Earliest Start',
    'options.preview.degree':          'Degree',
    'options.preview.university':      'University',
    'options.preview.major':           'Major',
    'options.preview.gradYear':        'Grad Year',
    'options.preview.langSkills':      'Language Skills',
    'options.preview.techSkills':      'Technical Skills',
    'options.preview.certifications':  'Certifications',
    'options.preview.selfIntro':       'Self Introduction',
    'options.preview.notExtracted':    '(Not found)',

    // ── Content Script ─────────────────────────────────────
    'content.hint.frameworkShort':  'Some job sites use React / Vue etc.: visible text in the field does not mean the site has accepted it. Before submitting, click or Tab through important fields to confirm there are no validation errors.',
    'content.hint.frameworkToast':  'If clicking "Submit" still shows missing fields: click the field to focus it, or delete and retype a character to force the site to accept your input.',
    'content.notif.noProfile':      'Please fill in your profile in Settings first',
    'content.notif.noFields':       'No form fields detected on this page',
    'content.notif.fieldsDetected': 'Detected {count} form field(s), matching...',
    'content.notif.aiAnalyzing':    'Using AI to analyze remaining fields...',
    'content.notif.matchDone':      'Matching complete: {matched} fillable, {unmatched} need manual input',
    'content.notif.filledHigh':     'Auto-filled {count} high-confidence field(s)\n\n⚠ {hint}',
    'content.notif.filledAll':      'Filled {count} field(s)\n\n⚠ {hint}',
    'content.notif.statsBar':       '{total} fields | {matched} matched | {filled} filled',
    'content.notif.tryFilled':      'Fill attempted. {hint}\n\nIf the site still shows an error, click the field and make a small edit.',
    'content.qa.nothingToSave':     'No answers to save (blank fields or unselected options are not collected)',
    'content.qa.savedNotif':        'Saved {count} answer(s) to Q&A presets',
    'content.qa.learnPrompt':       'Unfilled fields have been manually filled in. Save these to Q&A presets for auto-matching next time?\n\nClick "Cancel" to close without saving.',
    'content.qa.savedToPreset':     'Saved {count} answer(s) to presets',
    'content.bar.fillHigh':         'Fill High Confidence',
    'content.bar.fillAll':          'Fill All Matched',
    'content.bar.saveLearned':      'Save as preset answer',
    'content.bar.saveLearnedTitle': 'Save content filled in unmatched fields as preset answers',
    'content.bar.close':            'Close',
    'content.notif.fileUpload':     'Please upload the file manually',
    'content.notif.noLearnContent': 'No user-filled content found in unmatched fields',
    'content.badge.willFill':       'Will fill: {value}\nSource: {source}\nConfidence: {confidence}\nClick to fill\n\n',
    'content.badge.unmatched':      'Unmatched\nClues: {clues}',
  },

  zh: {
    // ── Popup ──────────────────────────────────────────────
    'popup.stat.fieldsDetected':  '检测到字段',
    'popup.stat.matched':         '已匹配',
    'popup.stat.filled':          '已填充',
    'popup.btn.scan':             '扫描并匹配表单（Alt+F 快捷扫描）',
    'popup.btn.fillAll':          '填充全部匹配字段',
    'popup.btn.clear':            '清除覆盖层',
    'popup.hint.strong':          '提交前请自检：',
    'popup.hint.body':            '部分网站（React / Vue 等）可能「框里有字」仍判未填。自动填充后请在重要栏位里点一下或 Tab 离开，确认无红字再递交。',
    'popup.footer.settings':      '⚙️ 档案设置',
    'popup.footer.shortcut':      'Alt+F 快捷扫描',

    // Popup dynamic messages
    'popup.msg.noTab':            '无法连接到当前页面',
    'popup.msg.refresh':          '请刷新页面后重试',
    'popup.msg.scanning':         '⏳ 扫描中...',
    'popup.msg.scanDone':         '扫描完成',
    'popup.msg.fillDone':         '填充完成',
    'popup.msg.cleared':          '已清除',

    // ── Options – Top bar ──────────────────────────────────
    'options.title':              'Apply Pilot 设置',
    'options.saveAuto':           '所有更改自动保存',
    'options.saved':              '✓ 已保存',

    // ── Options – Tabs ─────────────────────────────────────
    'options.tab.profile':        '📋 个人档案',
    'options.tab.links':          '🔗 在线资料',
    'options.tab.work':           '💼 工作信息',
    'options.tab.qa':             '💬 常见问答',
    'options.tab.llm':            '🤖 AI 设置',
    'options.tab.data':           '📦 数据管理',

    // ── Options – Smart Import ─────────────────────────────
    'options.smartImport.title':        '📄 智能导入 — 上传简历，一键填好档案',
    'options.smartImport.desc':         '上传你的简历或个人介绍文档，AI 自动提取所有信息填入档案。需要先在「AI 设置」中配置 API Key。',
    'options.smartImport.dropTitle':    '点击上传 或 拖拽文件到这里',
    'options.smartImport.dropDesc':     'AI 将自动提取个人信息、工作经历、教育背景、技能等',
    'options.smartImport.prep':         '准备中...',
    'options.smartImport.confirmBtn':   '确认写入档案',
    'options.smartImport.cancelBtn':    '取消',
    'options.smartImport.extractDone':  '✅ AI 提取完成，请检查：',
    'options.smartImport.readingFile':  '正在读取 {filename}...',
    'options.smartImport.readingPdf':   '正在读取 PDF...',
    'options.smartImport.extracting':   '正在用 AI 提取个人信息...',
    'options.smartImport.generating':   '提取完成，正在生成预览...',

    // ── Options – Profile ──────────────────────────────────
    'options.profile.basicInfo':    '👤 基本信息',
    'options.profile.firstName':    '名 (First Name)',
    'options.profile.lastName':     '姓 (Last Name)',
    'options.profile.fullName':     '全名 (Full Name)',
    'options.profile.fullNameHint': '用于只有一个姓名输入框的网站',
    'options.profile.email':        '邮箱 (Email)',
    'options.profile.phone':        '电话 (Phone)',
    'options.profile.dob':          '出生日期',
    'options.profile.gender':       '性别',
    'options.profile.nationality':  '国籍',
    'options.profile.location':     '当前所在地',
    'options.profile.address':      '🏠 地址',
    'options.profile.street':       '街道地址',
    'options.profile.city':         '城市',
    'options.profile.state':        '州/省',
    'options.profile.postal':       '邮编',
    'options.profile.country':      '国家',
    'options.profile.education':    '🎓 教育背景',
    'options.profile.degree':       '最高学历',
    'options.profile.university':   '学校',
    'options.profile.major':        '专业',
    'options.profile.gradYear':     '毕业年份',
    'options.profile.skills':       '🛠️ 技能',
    'options.profile.langSkills':   '语言能力',
    'options.profile.techSkills':   '技术技能',
    'options.profile.certifications': '证书',

    // Select placeholders
    'options.select.prompt':              '-- 选择 --',
    'options.gender.male':                'Male',
    'options.gender.female':              'Female',
    'options.gender.other':               'Other',
    'options.gender.preferNotToSay':      'Prefer not to say',
    'options.relocate.yes':               '是',
    'options.relocate.no':                '否',
    'options.relocate.open':              '可以商量',
    'options.visa.notNeeded':             '不需要',
    'options.visa.yes':                   '是，需要担保',
    'options.visa.no':                    '否',

    // ── Options – Links ────────────────────────────────────
    'options.links.title':      '🔗 在线链接',
    'options.links.portfolio':  '作品集 / Portfolio',
    'options.links.website':    '个人网站',

    // ── Options – Work ─────────────────────────────────────
    'options.work.title':           '💼 当前工作状态',
    'options.work.currentTitle':    '当前职位',
    'options.work.currentCompany':  '当前公司',
    'options.work.yearsExp':        '工作年限',
    'options.work.noticePeriod':    '通知期 (Notice Period)',
    'options.work.salary':          '期望薪资',
    'options.work.startDate':       '最早入职日期',
    'options.work.relocate':        '是否愿意搬迁',
    'options.work.workAuth':        '工作许可',
    'options.work.visa':            '是否需要签证担保',

    // ── Options – Q&A ──────────────────────────────────────
    'options.qa.title':           '💬 常见面试/申请问题预设回答',
    'options.qa.desc':            '预设常见问题的回答模板。AI 匹配到相关问题时会参考这些回答生成个性化内容。在申请页扫描后，对未匹配栏位手动填写并点击「存入预设回答」，会自动出现在此处（带「自动学习」标记），下次相同线索会高置信度匹配。',
    'options.qa.selfIntro':       '自我介绍 (Self Introduction)',
    'options.qa.whyCompany':      '为什么想加入这家公司？ (Why this company?)',
    'options.qa.whyRole':         '为什么对这个职位感兴趣？ (Why this role?)',
    'options.qa.strength':        '你的最大优势？ (Greatest strength)',
    'options.qa.weakness':        '你的不足？ (Greatest weakness)',
    'options.qa.careerGoals':     '职业目标 (Career goals)',
    'options.qa.addBtn':          '+ 添加问题',
    'options.qa.newKeyPh':        '新问题标签 (英文, 如 teamworkExample)',
    'options.qa.learnedBadge':    '自动学习',
    'options.qa.deleteBtn':       '删除',
    'options.qa.answerPh':        '你的回答...',

    // ── Options – AI Settings ──────────────────────────────
    'options.llm.title':          '🤖 AI 语义匹配设置',
    'options.llm.desc':           '当关键词匹配无法识别表单字段时，AI 会分析字段语义并匹配对应信息。AI 还可以为开放问题生成回答草稿。',
    'options.llm.enable':         '启用 AI 语义匹配',
    'options.llm.selectProvider': '选择 AI 服务商',
    'options.llm.anthropicName':  'Anthropic (Claude)',
    'options.llm.anthropicDesc':  '推荐 - 语义理解能力强',
    'options.llm.ollamaName': 'Ollama（本地）',
    'options.llm.setupTitle': '首次使用：允许此扩展访问 Ollama',
    'options.llm.setupIntro': 'Ollama 需要允许此扩展发送请求。即使模型列表能显示，推理请求仍可能被 403 拒绝。若“测试连接”已成功，则无需重复配置。',
    'options.llm.setupExpand': '展开配置步骤并复制命令',
    'options.llm.setupStep1': '选择 Ollama 的运行方式，复制并执行下方命令，将此扩展加入 OLLAMA_ORIGINS。',
    'options.llm.setupStep2': '桌面版请从菜单完整退出 Ollama 后重新打开；只关闭窗口可能不会停止服务。通过终端启动时，请保持 ollama serve 运行。',
    'options.llm.setupStep3': '回到本页，刷新模型，再点击“测试连接”。',
    'options.llm.setupPlatform': 'Ollama 运行环境',
    'options.llm.setupMac': 'macOS 桌面版 · 终端',
    'options.llm.setupWin': 'Windows 桌面版 · PowerShell',
    'options.llm.setupLinux': 'Linux · 终端（bash）',
    'options.llm.setupCommand': '当前扩展专用命令',
    'options.llm.setupCopy': '复制命令',
    'options.llm.setupCopied': '已复制。请到终端执行；仅复制不会应用配置。',
    'options.llm.setupCopyFailed': '复制被阻止，已选中命令，请手动复制。',
    'options.llm.setupScope': '这里只显示命令，扩展不会修改你的系统设置。若你在其他位置配置了允许来源，添加此扩展时请保留已有来源。',
    'options.llm.setupDocs': 'Ollama 官方配置说明',
    'options.llm.setupNote.mac': '在“终端”中运行。命令保留通过 launchctl 设置的已有来源，再添加此扩展。配置仅在当前登录会话有效，注销或重启 Mac 后可能需要再次执行。',
    'options.llm.setupNote.win': '在 PowerShell 中运行。命令将此扩展追加到用户环境变量并保存。完成后，从系统托盘完整退出 Ollama，再从开始菜单启动。',
    'options.llm.setupNote.linux': '此命令为当前终端会话启动 Ollama，执行前请先停止已有服务。如果使用 systemd，请按下方官方说明修改服务的 OLLAMA_ORIGINS 并重启服务。',
    'options.llm.setupForbidden': '❌ Ollama 拒绝了此扩展的请求（403）。请按上方已展开的步骤配置，重启 Ollama 后再测试。',
    'options.llm.ollamaRefresh': '↻ 刷新模型',
    'options.llm.ollamaSelectModel': '请选择模型',
    'options.llm.ollamaLoading': '正在读取可用模型…',
    'options.llm.ollamaLoaded': '找到 {count} 个模型，所选模型会自动保存。',
    'options.llm.ollamaEmpty': '未找到模型，请先在 Ollama 中安装模型，再刷新列表。',
    'options.llm.ollamaUnavailable': '{model}（已保存，尚未确认可用）',
    'options.llm.ollamaLoadError': '读取模型失败：{msg}。请检查 Ollama 是否运行、服务地址是否正确；遇到 403 时请检查 OLLAMA_ORIGINS。',
    'options.llm.ollamaDesc': '本地模型，无需 API Key',
    'options.llm.ollamaUrl': '本地服务地址',
    'options.llm.ollamaUrlHint': '支持 localhost、127.0.0.1 或 [::1]，可自定义端口。',
    'options.llm.ollamaModelHint': '从下拉列表选择服务上的模型。请使用已下载的本地模型；云模型仍会远程运行。',
    'options.llm.ollamaHint': '启动 Ollama，选择模型后测试连接。首次加载模型可能较慢。支持 TXT/Markdown 智能导入，暂不支持 PDF。',
    'options.llm.ollamaTroubleshoot': '请检查服务地址和 ollama list；遇到 403 时，在 OLLAMA_ORIGINS 中允许本扩展并重启 Ollama。',
    'options.llm.openaiName':     'OpenAI (GPT)',
    'options.llm.openaiDesc':     '广泛使用的备选方案',
    'options.llm.anthropicKey':   'Anthropic API Key',
    'options.llm.anthropicHint':  '从 <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color: #60a5fa;">console.anthropic.com</a> 获取',
    'options.llm.openaiKey':      'OpenAI API Key',
    'options.llm.openaiHint':     '从 <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #60a5fa;">platform.openai.com</a> 获取',
    'options.llm.modelLabel':     '模型',
    'options.llm.testBtn':        '🔌 测试连接',
    // Model options
    'options.llm.claudeHaiku45':  'Claude Haiku 4.5 (更快更便宜)',
    'options.llm.claudeSonnet46': 'Claude Sonnet 4.6 (推荐)',
    'options.llm.gpt56Luna':      'GPT-5.6 Luna (推荐，高效)',
    'options.llm.gpt56Terra':     'GPT-5.6 Terra (更高质量)',
    'options.llm.gpt4oMini':      'GPT-4o Mini (旧版兼容)',
    // Test status
    'options.llm.testing':        '⏳ 正在测试连接...',
    'options.llm.noApiKey':       '❌ 请先输入 API Key',
    'options.llm.testSuccess':    '✅ 连接成功！({provider} - {model})',
    'options.llm.testError':      '❌ API 错误 {status}: {msg}',
    'options.llm.networkError':   '❌ 网络错误: {msg}',

    // ── Options – Data ─────────────────────────────────────
    'options.data.title':         '📦 导入 / 导出档案',
    'options.data.desc':          '将你的档案导出为 JSON 文件备份，或从文件导入恢复。',
    'options.data.exportBtn':     '📤 导出档案',
    'options.data.importBtn':     '📥 导入档案',
    'options.data.qaDesc':        '仅常见问答（含自动学习条目与元数据）：',
    'options.data.exportQaBtn':   '📤 导出常见问答',
    'options.data.importQaBtn':   '📥 导入常见问答',
    'options.data.dangerTitle':   '⚠️ 危险操作',
    'options.data.dangerDesc':    '清除所有已保存的档案数据。此操作不可撤销。',
    'options.data.resetBtn':      '🗑️ 重置所有数据',

    // ── Options – Alert / Confirm messages ────────────────
    'options.alert.invalidQaKey':     '标签只能包含英文字母和数字，且以字母开头',
    'options.alert.invalidQaFile':    '无效的常见问答文件（缺少 commonAnswers）',
    'options.alert.qaImported':       '常见问答已导入并合并。',
    'options.alert.invalidProfileFile':'无效的档案文件格式',
    'options.alert.parseFailed':      '文件解析失败: {msg}',
    'options.alert.profileImported':  '档案导入成功！',
    'options.alert.resetConfirm1':    '确定要清除所有数据吗？此操作不可撤销！',
    'options.alert.resetConfirm2':    '再次确认：所有个人档案和设置都将被删除。',
    'options.alert.deleteQaConfirm':  '确定删除这条自动学习记录？',
    'options.alert.importApplied':    '档案已更新！你可以在下方各字段中检查和微调。',
    'options.alert.noApiKey':         '请先在「AI 设置」标签页中配置 API Key，智能导入需要 AI 来提取信息。',
    'options.alert.fileContentTooShort': '文件内容太少，无法提取有效信息',
    'options.alert.smartImportFailed': '智能导入失败: {msg}',
    'options.alert.anthropicApiError': 'Anthropic API 错误 {status}: {msg}',
    'options.alert.openaiApiError':    'OpenAI API 错误 {status}: {msg}',
    'options.alert.ollamaNoPdf': 'Ollama 智能导入仅支持 Markdown/TXT，请先将 PDF 转为文本。',
    'options.alert.openaiNoPdf':       'OpenAI 不支持直接读取 PDF。请在「AI 设置」中切换到 Anthropic (Claude) 后重试，或上传 Markdown/TXT 格式。',

    // ── Options – Import Preview labels ───────────────────
    'options.preview.firstName':   '名',
    'options.preview.lastName':    '姓',
    'options.preview.fullName':    '全名',
    'options.preview.email':       '邮箱',
    'options.preview.phone':       '电话',
    'options.preview.dob':         '出生日期',
    'options.preview.gender':      '性别',
    'options.preview.nationality': '国籍',
    'options.preview.location':    '所在地',
    'options.preview.street':      '街道',
    'options.preview.city':        '城市',
    'options.preview.state':       '州/省',
    'options.preview.postal':      '邮编',
    'options.preview.country':     '国家',
    'options.preview.linkedin':    'LinkedIn',
    'options.preview.github':      'GitHub',
    'options.preview.portfolio':   '作品集',
    'options.preview.website':     '网站',
    'options.preview.twitter':     'Twitter',
    'options.preview.currentTitle':    '当前职位',
    'options.preview.currentCompany':  '当前公司',
    'options.preview.yearsExp':        '工作年限',
    'options.preview.noticePeriod':    '通知期',
    'options.preview.salary':          '期望薪资',
    'options.preview.relocate':        '愿意搬迁',
    'options.preview.workAuth':        '工作许可',
    'options.preview.visaSponsorship': '签证担保',
    'options.preview.startDate':       '最早入职',
    'options.preview.degree':          '学历',
    'options.preview.university':      '学校',
    'options.preview.major':           '专业',
    'options.preview.gradYear':        '毕业年份',
    'options.preview.langSkills':      '语言能力',
    'options.preview.techSkills':      '技术技能',
    'options.preview.certifications':  '证书',
    'options.preview.selfIntro':       '自我介绍',
    'options.preview.notExtracted':    '（未提取到）',

    // ── Content Script ─────────────────────────────────────
    'content.hint.frameworkShort':  '部分招聘站用 React / Vue 等：框里看得见字，不等于已通过网站校验。提交前请在重要栏位里点一下或 Tab 离开，确认没有红字报错。',
    'content.hint.frameworkToast':  '若点「提交」仍提示缺内容：在对应栏位内点击聚焦，或删一个字再输回，强制网站接受你的输入。',
    'content.notif.noProfile':      '请先在设置中填写你的个人档案',
    'content.notif.noFields':       '当前页面没有检测到表单字段',
    'content.notif.fieldsDetected': '检测到 {count} 个表单字段，正在匹配...',
    'content.notif.aiAnalyzing':    '正在用 AI 分析剩余字段...',
    'content.notif.matchDone':      '匹配完成: {matched} 个可填充, {unmatched} 个需手动处理',
    'content.notif.filledHigh':     '已自动填充 {count} 个高置信度字段\n\n⚠ {hint}',
    'content.notif.filledAll':      '已填充 {count} 个字段\n\n⚠ {hint}',
    'content.notif.statsBar':       '共 {total} 字段 | 已匹配 {matched} | 已填充 {filled}',
    'content.notif.tryFilled':      '已尝试填入。{hint}\n\n若提交报错，请在该栏位内再点一下或稍作编辑。',
    'content.qa.nothingToSave':     '没有可保存的回答（空白或未选择选项不会收集）',
    'content.qa.savedNotif':        '已将 {count} 条存入预设回答（常见问答）',
    'content.qa.learnPrompt':       '检测到未匹配栏位中已有填写内容。是否将这些内容存入「常见问答」预设，供下次自动匹配？\n\n点「取消」则直接关闭，不保存。',
    'content.qa.savedToPreset':     '已保存 {count} 条到预设回答',
    'content.bar.fillHigh':         '填充高置信度',
    'content.bar.fillAll':          '填充全部匹配',
    'content.bar.saveLearned':      '存入预设回答',
    'content.bar.saveLearnedTitle': '把当前在未匹配栏位中填写的内容写入档案',
    'content.bar.close':            '关闭',
    'content.notif.fileUpload':     '请手动上传文件',
    'content.notif.noLearnContent': '没有在未匹配栏位中检测到填写内容',
    'content.badge.willFill':       '将填入: {value}\n来源: {source}\n置信度: {confidence}\n点击填充\n\n',
    'content.badge.unmatched':      '未能匹配\n线索: {clues}',
  },
};

/**
 * Interpolate {placeholder} tokens in a string.
 * e.g. interpolate('Hello {name}!', { name: 'World' }) → 'Hello World!'
 */
function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

const I18n = {
  currentLang: 'en',

  /** Load persisted language preference from storage. */
  init() {
    return new Promise(resolve => {
      chrome.storage.local.get('applyPilotLang', result => {
        this.currentLang = result.applyPilotLang || 'en';
        resolve(this.currentLang);
      });
    });
  },

  /** Persist a new language choice and update currentLang. */
  setLang(lang) {
    this.currentLang = lang;
    return new Promise(resolve => {
      chrome.storage.local.set({ applyPilotLang: lang }, resolve);
    });
  },

  /**
   * Translate a key, with optional variable interpolation.
   * @param {string} key
   * @param {object} [vars]  e.g. { filename: 'resume.pdf' }
   */
  t(key, vars) {
    const dict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
    const str = (dict[key] !== undefined ? dict[key] : TRANSLATIONS.en[key]) ?? key;
    return interpolate(str, vars);
  },

  /**
   * Walk the DOM and apply translations to all annotated elements.
   * - data-i18n="key"           → element.textContent = t(key)
   * - data-i18n-html="key"      → element.innerHTML   = t(key)
   * - data-i18n-ph="key"        → element.placeholder = t(key)
   * - data-i18n-title="key"     → element.title       = t(key)
   */
  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = this.t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPh);
    });
    const htmlLang = this.currentLang === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.lang = htmlLang;
  },
};

window.I18n = I18n;
