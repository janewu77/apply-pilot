#!/usr/bin/env node
/**
 * release.js — Apply Pilot 版本号管理 + 发布
 *
 * 用法：
 *   node scripts/release.js patch   # 1.1.3 → 1.1.4
 *   node scripts/release.js minor   # 1.1.3 → 1.2.0
 *   node scripts/release.js major   # 1.1.3 → 2.0.0
 *
 * 执行内容：
 *   1. 读取当前版本（来自 src/manifest.json）
 *   2. 递增指定部分
 *   3. 同步更新 src/manifest.json 和 package.json
 *   4. 收集 git commits，自动插入 CHANGELOG.md 新条目
 *   5. 调用 build.js --pack 生成发布包
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const ROOT         = path.resolve(__dirname, '..');
const MANIFEST     = path.join(ROOT, 'src', 'manifest.json');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const CHANGELOG    = path.join(ROOT, 'CHANGELOG.md');

const BUMP_TYPE = process.argv[2];

if (!['patch', 'minor', 'major'].includes(BUMP_TYPE)) {
  console.error('用法: node scripts/release.js [patch|minor|major]');
  process.exit(1);
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function bumpVersion(version, type) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3) throw new Error(`无效的版本号格式: ${version}`);
  if (type === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0; }
  if (type === 'minor') { parts[1]++; parts[2] = 0; }
  if (type === 'patch') { parts[2]++; }
  return parts.join('.');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 根据 commit message 前缀归类到 Added / Changed / Fixed / Removed
 */
function categorizeCommits(commits) {
  const categories = { Added: [], Changed: [], Fixed: [], Removed: [] };

  for (const msg of commits) {
    // 去掉 hash 前缀（如 "a1b2c3d message"）
    const message = msg.replace(/^[a-f0-9]{7,}\s+/, '').trim();
    if (!message) continue;

    const lower = message.toLowerCase();
    if (/^(add|feat|feature)[:\s]/i.test(message)) {
      categories.Added.push(message.replace(/^[^:]+:\s*/, ''));
    } else if (/^(fix|bug|hotfix)[:\s]/i.test(message)) {
      categories.Fixed.push(message.replace(/^[^:]+:\s*/, ''));
    } else if (/^(remove|delete|drop)[:\s]/i.test(message)) {
      categories.Removed.push(message.replace(/^[^:]+:\s*/, ''));
    } else {
      // 过滤掉纯工具性提交
      if (!/^(merge|wip|temp|tmp|chore)/i.test(lower)) {
        categories.Changed.push(message.replace(/^[^:]+:\s*/, ''));
      }
    }
  }

  return categories;
}

/**
 * 获取自上次 tag 以来的 git commits（没有 tag 则取最近 20 条）
 */
function getCommitsSinceLastTag() {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null', {
      cwd: ROOT, stdio: 'pipe',
    }).toString().trim();

    const range = lastTag ? `${lastTag}..HEAD` : '';
    const log = execSync(
      `git log ${range} --pretty=format:"%h %s" --no-merges`.trim(),
      { cwd: ROOT, stdio: 'pipe' }
    ).toString().trim();

    return log ? log.split('\n') : [];
  } catch {
    // 没有 tag，取最近 20 条
    try {
      const log = execSync(
        'git log -20 --pretty=format:"%h %s" --no-merges',
        { cwd: ROOT, stdio: 'pipe' }
      ).toString().trim();
      return log ? log.split('\n') : [];
    } catch {
      return [];
    }
  }
}

/**
 * 在 CHANGELOG.md 顶部（第一个 ## 之前）插入新版本条目
 */
function insertChangelog(newVersion, categories) {
  const lines = [];
  lines.push(`## [${newVersion}] - ${today()}`);
  lines.push('');

  let hasContent = false;
  for (const [cat, items] of Object.entries(categories)) {
    if (items.length === 0) continue;
    hasContent = true;
    lines.push(`### ${cat}`);
    for (const item of items) {
      // 首字母大写
      const text = item.charAt(0).toUpperCase() + item.slice(1);
      lines.push(`- ${text}`);
    }
    lines.push('');
  }

  if (!hasContent) {
    lines.push('### Changed');
    lines.push('- (no notable commits since last release)');
    lines.push('');
  }

  const newEntry = lines.join('\n');

  if (!fs.existsSync(CHANGELOG)) {
    // CHANGELOG 不存在，创建一个最简版本
    const header = [
      '# Changelog\n',
      'All notable changes to this project will be documented in this file.\n',
      'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).\n',
      '---\n\n',
    ].join('\n');
    fs.writeFileSync(CHANGELOG, header + newEntry, 'utf8');
    return;
  }

  const existing = fs.readFileSync(CHANGELOG, 'utf8');

  // 在第一个 "## [" 之前插入
  const insertPos = existing.indexOf('\n## [');
  if (insertPos === -1) {
    fs.writeFileSync(CHANGELOG, existing.trimEnd() + '\n\n' + newEntry, 'utf8');
  } else {
    const before = existing.slice(0, insertPos + 1);
    const after  = existing.slice(insertPos + 1);
    fs.writeFileSync(CHANGELOG, before + newEntry + after, 'utf8');
  }
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

function main() {
  // 1. 读取当前版本
  const manifest   = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const oldVersion = manifest.version;
  const newVersion = bumpVersion(oldVersion, BUMP_TYPE);

  console.log(`\n🔖 版本升级: v${oldVersion} → v${newVersion}  (${BUMP_TYPE})\n`);

  // 2. 收集 git commits（在改版本号之前，避免把版本提交本身也算进去）
  console.log(`  ▶ 收集 git commits...`);
  const commits    = getCommitsSinceLastTag();
  const categories = categorizeCommits(commits);
  const total      = Object.values(categories).reduce((s, a) => s + a.length, 0);
  console.log(`  ✅ 收集到 ${commits.length} 条提交，整理为 ${total} 条 changelog 条目`);

  // 3. 更新版本号
  manifest.version = newVersion;
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`  ✅ 已更新 src/manifest.json`);

  if (fs.existsSync(PACKAGE_JSON)) {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`  ✅ 已更新 package.json`);
  }

  // 4. 写入 CHANGELOG.md
  insertChangelog(newVersion, categories);
  console.log(`  ✅ 已更新 CHANGELOG.md`);

  // 5. 打包
  console.log(`\n  ▶ 开始打包...\n`);
  try {
    execSync(`node "${path.join(__dirname, 'build.js')}" --pack`, {
      stdio: 'inherit',
      cwd: ROOT,
    });
  } catch (e) {
    console.error('❌ 打包失败，版本号已更新但未生成 zip，请手动运行 npm run pack');
    process.exit(1);
  }
}

main();
