/**
 * Apply Pilot - LLM 语义匹配模块
 * 当关键词匹配失败时，调用 LLM API 做语义理解
 */

/**
 * 从 storage 加载 LLM 设置
 */
async function loadLLMSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('applyPilotLLM', (result) => {
      resolve(result.applyPilotLLM || {
        provider: 'anthropic',  // 'anthropic' | 'openai'
        apiKey: '',
        model: 'claude-sonnet-4-5-20250514',
        enabled: false,
      });
    });
  });
}

/**
 * 保存 LLM 设置
 */
async function saveLLMSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ applyPilotLLM: settings }, resolve);
  });
}

/**
 * 调用 LLM 做字段匹配
 * @param {Array} unmatchedFields - 未匹配的字段信息 [{ clues, tagName, type }]
 * @param {Object} profileData - 展平后的 profile 数据
 * @returns {Object} { fieldIndex: profileKey } 的映射
 */
async function llmMatchFields(unmatchedFields, profileData) {
  const settings = await loadLLMSettings();
  const activeKey = settings.provider === 'openai' ? settings.apiKeyOpenAI : settings.apiKey;
  if (!settings.enabled || !activeKey) {
    return {};
  }

  const profileKeys = Object.keys(profileData);
  const profileSummary = profileKeys.map(k => `  "${k}": "${profileData[k]}"`).join('\n');

  const fieldsDescription = unmatchedFields.map((f, i) =>
    `Field ${i}: tag=${f.tagName}, type=${f.type}, clues=[${f.clues.join(', ')}]`
  ).join('\n');

  const prompt = `You are a job application form analyzer. Given form fields and a user profile, determine which profile field best matches each form field.

User Profile:
${profileSummary}

Unmatched Form Fields:
${fieldsDescription}

For each field, respond with a JSON object mapping field index to the best matching profile key, or "SKIP" if no match.
Only respond with valid JSON, no explanation. Example: {"0": "personal.email", "1": "SKIP", "2": "work.currentTitle"}`;

  try {
    let responseText;
    // console.log(prompt);
    if (settings.provider === 'anthropic') {
      responseText = await callAnthropic(settings, prompt);
    } else {
      responseText = await callOpenAI(settings, prompt);
    }

    // 解析 JSON 响应
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const mapping = JSON.parse(jsonMatch[0]);
    const result = {};
    for (const [idx, key] of Object.entries(mapping)) {
      if (key !== 'SKIP' && profileData[key]) {
        result[parseInt(idx)] = key;
      }
    }
    // console.log(result);
    return result;
  } catch (error) {
    console.warn('[Apply Pilot] LLM matching failed:', error);
    return {};
  }
}

/**
 * 调用 LLM 生成开放问题的回答
 * @param {string} question - 问题文本
 * @param {Object} profileData - 用户档案
 * @param {string} jobContext - 当前页面的职位信息（可选）
 * @returns {string} 生成的回答
 */
async function llmGenerateAnswer(question, profileData, jobContext = '') {
  const settings = await loadLLMSettings();
  const activeKey = settings.provider === 'openai' ? settings.apiKeyOpenAI : settings.apiKey;
  if (!settings.enabled || !activeKey) {
    return null;
  }

  // 先检查 commonAnswers 中有没有相关的模板
  const commonAnswers = {};
  for (const [key, value] of Object.entries(profileData)) {
    if (key.startsWith('commonAnswers.') && value) {
      commonAnswers[key.replace('commonAnswers.', '')] = value;
    }
  }

  const prompt = `You are helping a job applicant fill out an application form. Generate a professional, concise answer to the following question.

Applicant Background:
- Current Title: ${profileData['work.currentTitle'] || 'N/A'}
- Experience: ${profileData['work.yearsOfExperience'] || 'N/A'} years
- Skills: ${profileData['skills.technical'] || 'N/A'}
- Education: ${profileData['education.highestDegree'] || ''} in ${profileData['education.major'] || ''} from ${profileData['education.university'] || ''}

${jobContext ? `Job Context: ${jobContext}` : ''}

${Object.keys(commonAnswers).length > 0 ? `Reference answers the applicant has prepared:\n${JSON.stringify(commonAnswers, null, 2)}` : ''}

Question: "${question}"

Write a natural, professional response (2-4 sentences). Use first person. Be specific and authentic.`;

  try {
    if (settings.provider === 'anthropic') {
      return await callAnthropic(settings, prompt);
    } else {
      return await callOpenAI(settings, prompt);
    }
  } catch (error) {
    console.warn('[Apply Pilot] LLM answer generation failed:', error);
    return null;
  }
}


/**
 * 批量调用 LLM 生成多个开放问题的回答（一次请求）
 * @param {Array<string>} questions - 问题文本列表
 * @param {Object} profileData - 用户档案
 * @param {string} jobContext - 当前页面的职位信息（可选）
 * @returns {Object} { index: answer } 的映射，失败时返回 {}
 */
async function llmGenerateAnswers(questions, profileData, jobContext = '') {
  const settings = await loadLLMSettings();
  const activeKey = settings.provider === 'openai' ? settings.apiKeyOpenAI : settings.apiKey;
  if (!settings.enabled || !activeKey || questions.length === 0) {
    return {};
  }

  const commonAnswers = {};
  for (const [key, value] of Object.entries(profileData)) {
    if (key.startsWith('commonAnswers.') && value) {
      commonAnswers[key.replace('commonAnswers.', '')] = value;
    }
  }

  const questionsText = questions.map((q, i) => `Question ${i}: "${q}"`).join('\n');

  const prompt = `You are helping a job applicant fill out an application form. Generate professional, concise answers for each question below.

Applicant Background:
- Current Title: ${profileData['work.currentTitle'] || 'N/A'}
- Experience: ${profileData['work.yearsOfExperience'] || 'N/A'} years
- Skills: ${profileData['skills.technical'] || 'N/A'}
- Education: ${profileData['education.highestDegree'] || ''} in ${profileData['education.major'] || ''} from ${profileData['education.university'] || ''}

${jobContext ? `Job Context: ${jobContext}` : ''}

${Object.keys(commonAnswers).length > 0 ? `Reference answers the applicant has prepared:\n${JSON.stringify(commonAnswers, null, 2)}` : ''}

Questions:
${questionsText}

Respond with a JSON object mapping each question index to its answer. Each answer should be 2-4 sentences, natural, professional, first person, and specific.
Only respond with valid JSON, no explanation. Example: {"0": "I have 5 years of experience...", "1": "I am motivated by..."}`;

  try {
    let responseText;
    if (settings.provider === 'anthropic') {
      responseText = await callAnthropic(settings, prompt);
    } else {
      responseText = await callOpenAI(settings, prompt);
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.warn('[Apply Pilot] LLM batch answer generation failed:', error);
    return {};
  }
}

// ========== API 调用实现 ==========

async function callAnthropic(settings, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.model || 'claude-sonnet-4-5-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callOpenAI(settings, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKeyOpenAI}`,
    },
    body: JSON.stringify({
      model: settings.modelOpenAI || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
