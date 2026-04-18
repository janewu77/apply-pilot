/**
 * Apply Pilot - 个人档案模块
 * 管理用户的个人信息，供表单填充使用
 */

const DEFAULT_PROFILE = {
  // === 基本信息 ===
  personal: {
    firstName: '',
    lastName: '',
    fullName: '',           // 如果网站只有一个"姓名"字段
    email: '',
    phone: '',
    dateOfBirth: '',        // YYYY-MM-DD
    gender: '',             // male / female / other / prefer_not_to_say
    nationality: '',
    currentLocation: '',    // 城市, 国家
  },

  // === 地址 ===
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },

  // === 在线资料 ===
  links: {
    linkedin: '',
    github: '',
    portfolio: '',
    website: '',
    twitter: '',
  },

  // === 工作信息 ===
  work: {
    currentTitle: '',       // 当前职位
    currentCompany: '',
    yearsOfExperience: '',
    noticePeriod: '',       // e.g. "2 weeks", "1 month", "immediately"
    salaryExpectation: '',
    willingToRelocate: '',  // yes / no / open
    workAuthorization: '',  // e.g. "Authorized to work in Germany"
    visaSponsorship: '',    // yes / no / not_needed
    startDate: '',          // 最早入职日期
  },

  // === 教育背景 ===
  education: {
    highestDegree: '',      // e.g. "Master's", "Bachelor's"
    university: '',
    major: '',
    graduationYear: '',
  },

  // === 技能 ===
  skills: {
    languages: '',          // e.g. "Chinese (Native), English (Fluent), German (B2)"
    technical: '',          // e.g. "Python, JavaScript, React, AWS"
    certifications: '',
  },

  // === 简历文件路径 ===
  resume: {
    filePath: '',           // 本地简历路径（用于自动上传提示）
  },

  // === 常见开放问题的预设回答 ===
  // key 是问题的语义标签，value 是你的回答模板
  commonAnswers: {
    whyThisCompany: '',
    whyThisRole: '',
    greatestStrength: '',
    greatestWeakness: '',
    selfIntroduction: '',
    careerGoals: '',
    // 可自由添加更多...
  },

  // 自动学习条目的元数据（key 与 commonAnswers 中的 learned* 键对应）
  learnedAnswerMeta: {},
};

/**
 * 从表单字段的线索数组生成一个稳定的字符串签名。
 *
 * 「线索」是从 DOM 元素上提取的描述性文本，例如 label 文字、name 属性、
 * placeholder、aria-label 等。同一个字段在不同页面上这些文本可能顺序不同、
 * 大小写不同，但语义相同。本函数通过标准化 + 排序，把所有等价的线索组合
 * 都映射到同一个签名，从而让历史学习系统能跨页面可靠地识别「同一道题」。
 *
 * 处理流程：
 *  1. 每条线索转为字符串、全小写、去首尾空白、把内部连续空白压成单个空格
 *  2. 过滤掉空字符串，避免空值干扰签名
 *  3. 按字典序排序，消除顺序差异
 *  4. 用 Unicode Unit Separator（U+241E）拼接，该字符极少出现在正常文本中，
 *     不会与线索内容冲突
 *
 * 示例：
 *  cluesSignatureFromClues(["Email Address", "email"])
 *  cluesSignatureFromClues(["email", "Email Address"])
 *  // 两者均返回 "email\u241eemail address"
 *
 * @param {string[]} clues - 从 DOM 元素提取的线索数组（label/name/placeholder 等）
 * @returns {string} 标准化后的签名字符串，可直接用作存储 key 或比对依据
 */
function cluesSignatureFromClues(clues) {
  const norm = (clues || [])
    .map((c) => String(c).toLowerCase().trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .sort();
  return norm.join('\u241e'); // U+241E Unit Separator，用作线索间的分隔符
}

/**
 * 为学习条目生成合法 commonAnswers 键名 [a-zA-Z][a-zA-Z0-9]*
 * @param {string} signature
 * @param {Set<string>} existingKeys - commonAnswers 已有键
 */
function generateLearnedAnswerKey(signature, existingKeys) {
  let h = 0;
  for (let i = 0; i < signature.length; i++) {
    h = ((h << 5) - h) + signature.charCodeAt(i);
    h |= 0;
  }
  const tail = (Math.abs(h) >>> 0).toString(36).padStart(7, '0').slice(0, 10);
  let base = `learnedx${tail}`;
  let key = base;
  let n = 0;
  while (existingKeys.has(key)) {
    key = `${base}a${n}`;
    n += 1;
  }
  return key;
}

/**
 * 由 profile 构建 signature -> 展平 profileKey（commonAnswers.xxx）映射
 * @param {object} profile
 * @returns {Map<string, string>}
 */
function buildLearnedSignatureToProfileKeyMap(profile) {
  const map = new Map();
  const meta = profile.learnedAnswerMeta;
  if (!meta || typeof meta !== 'object') return map;
  for (const [answerKey, entry] of Object.entries(meta)) {
    if (!entry || typeof entry !== 'object' || !entry.cluesSignature) continue;
    const flatKey = `commonAnswers.${answerKey}`;
    map.set(entry.cluesSignature, flatKey);
  }
  return map;
}

/**
 * 从 Chrome Storage 加载档案
 */
async function loadProfile() {
  return new Promise((resolve) => {
    chrome.storage.local.get('applyPilotProfile', (result) => {
      const profile = result.applyPilotProfile || DEFAULT_PROFILE;
      resolve(profile);
    });
  });
}

/**
 * 保存档案到 Chrome Storage
 */
async function saveProfile(profile) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ applyPilotProfile: profile }, resolve);
  });
}

/**
 * 将嵌套的 profile 对象展平为 key-value 对
 * e.g. { personal: { firstName: 'Jane' } } => { 'personal.firstName': 'Jane' }
 */
function flattenProfile(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!prefix && key === 'learnedAnswerMeta') continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenProfile(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

/**
 * 获取所有非空档案字段（展平后）
 */
async function getFilledFields() {
  const profile = await loadProfile();
  const flat = flattenProfile(profile);
  const filled = {};
  for (const [key, value] of Object.entries(flat)) {
    if (value && String(value).trim()) {
      filled[key] = String(value).trim();
    }
  }
  return filled;
}
