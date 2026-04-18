/**
 * Apply Pilot - 关键词匹配引擎
 * 根据表单字段的 label/name/placeholder 等属性，匹配到 profile 中的对应字段
 */

// ========== 关键词 → profile 字段 映射表 ==========
// 每个 profile 字段对应一组关键词（支持英语、德语、中文）
const FIELD_KEYWORDS = {
  'personal.firstName': {
    keywords: ['first name', 'vorname', 'given name', 'fname', '名'],
    priority: 10,
  },
  'personal.lastName': {
    keywords: ['last name', 'nachname', 'surname', 'family name', 'lname', '姓'],
    priority: 10,
  },
  'personal.fullName': {
    keywords: ['full name', 'name', 'your name', '姓名', 'vollständiger name'],
    priority: 5, // 低优先级，避免和 firstName/lastName 冲突
  },
  'personal.email': {
    keywords: ['email', 'e-mail', 'mail', '邮箱', '电子邮件'],
    inputTypes: ['email'],
    priority: 10,
  },
  'personal.phone': {
    keywords: ['phone', 'telephone', 'tel', 'mobile', 'cell', '电话', '手机', 'telefon', 'rufnummer'],
    inputTypes: ['tel'],
    priority: 10,
  },
  'personal.dateOfBirth': {
    keywords: ['date of birth', 'birthday', 'dob', 'birth date', '出生日期', 'geburtsdatum'],
    priority: 8,
  },
  'personal.gender': {
    keywords: ['gender', 'sex', '性别', 'geschlecht'],
    priority: 8,
  },
  'personal.nationality': {
    keywords: ['nationality', 'citizenship', '国籍', 'staatsangehörigkeit'],
    priority: 8,
  },
  'personal.currentLocation': {
    keywords: ['current location', 'location', 'city', '所在城市', 'standort', 'wohnort'],
    priority: 6,
  },

  // 地址
  'address.street': {
    keywords: ['street', 'address line', 'street address', '街道', 'straße', 'strasse', 'adresse'],
    priority: 8,
  },
  'address.city': {
    keywords: ['city', 'town', '城市', 'stadt', 'ort'],
    priority: 8,
  },
  'address.state': {
    keywords: ['state', 'province', 'region', '省份', 'bundesland'],
    priority: 8,
  },
  'address.postalCode': {
    keywords: ['postal code', 'zip', 'zip code', 'postcode', '邮编', 'plz', 'postleitzahl'],
    priority: 8,
  },
  'address.country': {
    keywords: ['country', '国家', 'land'],
    priority: 7,
  },

  // 在线链接
  'links.linkedin': {
    keywords: ['linkedin', 'linkedin url', 'linkedin profile'],
    priority: 9,
  },
  'links.github': {
    keywords: ['github', 'github url', 'github profile'],
    priority: 9,
  },
  'links.portfolio': {
    keywords: ['portfolio', 'portfolio url', 'personal site', '作品集'],
    priority: 8,
  },
  'links.website': {
    keywords: ['website', 'personal website', 'url', 'homepage', '个人网站'],
    priority: 6,
  },

  // 工作信息
  'work.currentTitle': {
    keywords: ['current title', 'job title', 'current position', 'title', '职位', 'aktuelle position'],
    priority: 7,
  },
  'work.currentCompany': {
    keywords: ['current company', 'company', 'current employer', '公司', 'arbeitgeber', 'unternehmen'],
    priority: 7,
  },
  'work.yearsOfExperience': {
    keywords: ['years of experience', 'experience', 'total experience', '工作年限', 'berufserfahrung'],
    priority: 7,
  },
  'work.noticePeriod': {
    keywords: ['notice period', 'availability', '到岗时间', 'kündigungsfrist'],
    priority: 7,
  },
  'work.salaryExpectation': {
    keywords: [
      'salary', 'salary expectation', 'expected salary', 'compensation',
      'desired pay', 'desired salary', 'expected pay', 'target salary', 'pay expectation',
      '期望薪资', '期望工资', '薪资期望',
      'gehaltsvorstellung', 'wunschgehalt', 'gehaltswunsch',
    ],
    priority: 7,
  },
  'work.willingToRelocate': {
    keywords: ['relocate', 'relocation', 'willing to relocate', '是否愿意搬迁'],
    priority: 7,
  },
  'work.workAuthorization': {
    keywords: ['work authorization', 'authorized to work', 'work permit', '工作许可', 'arbeitserlaubnis'],
    priority: 8,
  },
  'work.visaSponsorship': {
    keywords: ['visa', 'sponsorship', 'visa sponsorship', '签证'],
    priority: 8,
  },
  'work.startDate': {
    keywords: ['start date', 'earliest start', 'available from', 'date available', 'availability date', 'available start', '入职日期', 'eintrittsdatum', 'frühester eintrittstermin'],
    priority: 7,
  },

  // 教育
  'education.highestDegree': {
    keywords: ['degree', 'highest degree', 'education level', '学历', 'abschluss'],
    priority: 7,
  },
  'education.university': {
    keywords: ['university', 'school', 'college', 'institution', '大学', 'universität', 'hochschule'],
    priority: 7,
  },
  'education.major': {
    keywords: ['major', 'field of study', 'specialization', '专业', 'studiengang', 'fachrichtung'],
    priority: 7,
  },
  'education.graduationYear': {
    keywords: ['graduation year', 'year of graduation', 'graduated', '毕业年份', 'abschlussjahr'],
    priority: 7,
  },

  // 技能
  'skills.languages': {
    keywords: ['language', 'languages spoken', 'spoken languages', '语言能力', 'sprachkenntnisse'],
    priority: 6,
  },
  'skills.technical': {
    keywords: ['technical skills', 'skills', 'technologies', '技术技能'],
    priority: 5,
  },
};


/**
 * 从表单元素提取文本线索
 */
function extractFieldClues(element) {
  const clues = [];

  // 1. aria-label
  if (element.getAttribute('aria-label')) {
    clues.push(element.getAttribute('aria-label'));
  }

  // 2. placeholder
  if (element.placeholder) {
    clues.push(element.placeholder);
  }

  // 3. name / id 属性
  // 把 `.` 也视为分隔符（兼容 "streetAddress.value" 这类框架内部命名）
  // 并剥掉末尾常见的框架后缀（.value / .input）
  const cleanAttr = (str) =>
    str
      .replace(/\.(value|input|field|control)$/i, '') // 去掉无语义后缀
      .replace(/[._\-\[\]]/g, ' ');                  // 分隔符统一转空格
  if (element.name) {
    clues.push(cleanAttr(element.name));
  }
  if (element.id) {
    clues.push(cleanAttr(element.id));
  }

  // 标签文字清洗：剥掉必填标记（* ＊ (required) 等），还原纯语义文本
  const cleanLabel = (str) =>
    str
      .replace(/\s*[*＊]\s*$/, '')
      .replace(/\s*\(required\)\s*$/i, '')
      .replace(/\s*（必填）\s*$/, '')
      .trim();

  // 4. 关联的 <label>
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) clues.push(cleanLabel(label.textContent.trim()));
  }
  // 也检查父级 label
  const parentLabel = element.closest('label');
  if (parentLabel) {
    clues.push(cleanLabel(parentLabel.textContent.trim()));
  }

  // 5. 上一个兄弟节点（很多表单把标签放在输入框前面）
  const prev = element.previousElementSibling;
  if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'DIV')) {
    clues.push(cleanLabel(prev.textContent.trim()));
  }

  // 6. 父容器中的文本（限制范围，避免拿到太多无关文字）
  const parent = element.parentElement;
  if (parent) {
    const parentText = Array.from(parent.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && ['LABEL', 'SPAN', 'P', 'DIV'].includes(n.tagName) && n !== element))
      .map(n => cleanLabel(n.textContent.trim()))
      .filter(t => t.length > 0 && t.length < 100)
      .join(' ');
    if (parentText) clues.push(parentText);
  }

  // 7. autocomplete 属性
  if (element.autocomplete && element.autocomplete !== 'off') {
    clues.push(element.autocomplete.replace(/-/g, ' '));
  }

  return clues.map(c => c.toLowerCase().trim()).filter(c => c.length > 0);
}


/**
 * 尝试用关键词匹配为一个表单字段找到对应的 profile 字段
 * 返回: { profileKey: string, confidence: 'high' | 'medium' | 'low' } | null
 */
function matchFieldByKeywords(element) {
  const clues = extractFieldClues(element);
  if (clues.length === 0) return null;

  const clueText = clues.join(' ').toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [profileKey, config] of Object.entries(FIELD_KEYWORDS)) {
    let score = 0;

    // 检查 input type 匹配
    if (config.inputTypes && config.inputTypes.includes(element.type)) {
      score += 5;
    }

    // 检查关键词匹配
    for (const keyword of config.keywords) {
      if (clueText.includes(keyword.toLowerCase())) {
        // 越长的关键词匹配越精确
        score += keyword.length + config.priority;
      }
    }

    // 检查 autocomplete 属性直接匹配
    const autocompleteMap = {
      'given-name': 'personal.firstName',
      'family-name': 'personal.lastName',
      'name': 'personal.fullName',
      'email': 'personal.email',
      'tel': 'personal.phone',
      'street-address': 'address.street',
      'address-level2': 'address.city',
      'address-level1': 'address.state',
      'postal-code': 'address.postalCode',
      'country-name': 'address.country',
      'bday': 'personal.dateOfBirth',
      'url': 'links.website',
    };
    if (element.autocomplete && autocompleteMap[element.autocomplete] === profileKey) {
      score += 20; // 强匹配
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = profileKey;
    }
  }

  if (!bestMatch) return null;

  // 根据分数判断置信度
  let confidence = 'low';
  if (bestScore >= 15) confidence = 'high';
  else if (bestScore >= 8) confidence = 'medium';

  return { profileKey: bestMatch, confidence, score: bestScore };
}


/**
 * 扫描页面上所有可填写的表单元素
 */
function scanFormFields() {
  const selectors = [
    'input[type="text"]',
    'input[type="email"]',
    'input[type="tel"]',
    'input[type="url"]',
    'input[type="number"]',
    'input[type="date"]',
    'input[type="search"]',
    'input:not([type])',      // 没有 type 的 input 默认是 text
    'textarea',
    'select',
    'input[type="radio"]',
    'input[type="checkbox"]',
  ];

  const elements = document.querySelectorAll(selectors.join(', '));

  // 严格过滤掉隐藏的和不可见的输入框
  // 很多网站有隐藏的 honeypot、CSRF、tracking 等字段，必须跳过
  return Array.from(elements).filter(el => {
    // 1. type=hidden 直接排除
    if (el.type === 'hidden') return false;
    if (el.disabled) return false;

    // 2. 检查元素自身及所有祖先的 computed style
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;

    // 3. 检查尺寸：宽或高为 0，或者极小（< 2px，常见 honeypot 手法）
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;

    // 4. 被移出可视区域（left/top 极大负值）
    if (rect.right < 0 || rect.bottom < 0) return false;
    if (rect.left > window.innerWidth + 100 || rect.top > window.innerHeight + 5000) return false;

    // 5. clip / clip-path 隐藏
    if (style.clip === 'rect(0px, 0px, 0px, 0px)') return false;
    if (style.clipPath === 'inset(100%)' || style.clipPath === 'circle(0)' || style.clipPath === 'polygon(0 0)') return false;

    // 6. 尺寸通过 CSS 设为 0（有些元素 rect 有值但 CSS 宽高为 0）
    if (style.width === '0px' || style.height === '0px') return false;
    if (style.maxWidth === '0px' || style.maxHeight === '0px') return false;

    // 7. overflow:hidden + 极小容器（祖先级 honeypot）
    let parent = el.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
      const pStyle = window.getComputedStyle(parent);
      const pRect = parent.getBoundingClientRect();
      if (pStyle.overflow === 'hidden' && (pRect.width < 2 || pRect.height < 2)) return false;
      if (pStyle.display === 'none' || pStyle.visibility === 'hidden') return false;
      if (parseFloat(pStyle.opacity) === 0) return false;
      parent = parent.parentElement;
      depth++;
    }

    // 8. aria-hidden 属性检查
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.closest('[aria-hidden="true"]')) return false;

    // 9. tabindex=-1 + 不可见的组合（常见于辅助/隐藏字段）
    // 仅当同时满足其他可疑条件时才排除
    if (el.tabIndex === -1 && (rect.width < 10 || rect.height < 10)) return false;

    // 10. 常见 honeypot 特征：name/id 包含诱导性名称
    const nameId = ((el.name || '') + (el.id || '')).toLowerCase();
    const honeypotPatterns = [
      'honeypot', 'hp_', 'trap', 'bot', 'website_url_field',
      'captcha_field', 'leave_blank', 'do_not_fill',
    ];
    if (honeypotPatterns.some(p => nameId.includes(p))) return false;

    return true;
  });
}
