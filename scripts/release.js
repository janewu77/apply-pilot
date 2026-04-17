#!/usr/bin/env node
/**
 * release.js — Apply Pilot 版本号管理 + 发布
 *
 * 用法：
 *   node scripts/release.js patch   # 1.1.2 → 1.1.3
 *   node scripts/release.js minor   # 1.1.2 → 1.2.0
 *   node scripts/release.js major   # 1.1.2 → 2.0.0
 *
 * 执行内容：
 *   1. 读取当前版本（来自 src/manifest.json）
 *   2. 递增指定部分
 *   3. 同步更新 src/manifest.json 和 package.json
 *   4. 自动调用 build.js --pack 生成发布包
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const ROOT         = path.resolve(__dirname, '..');
const MANIFEST     = path.join(ROOT, 'src', 'manifest.json');
const PACKAGE_JSON = path.join(ROOT, 'package.json');

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

// ─── 主流程 ───────────────────────────────────────────────────────────────────

function main() {
  // 读取当前版本
  const manifest    = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const oldVersion  = manifest.version;
  const newVersion  = bumpVersion(oldVersion, BUMP_TYPE);

  console.log(`\n🔖 版本升级: v${oldVersion} → v${newVersion}  (${BUMP_TYPE})\n`);

  // 更新 manifest.json
  manifest.version = newVersion;
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`  ✅ 已更新 src/manifest.json`);

  // 更新 package.json（如存在）
  if (fs.existsSync(PACKAGE_JSON)) {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`  ✅ 已更新 package.json`);
  }

  // 调用打包
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
