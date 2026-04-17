#!/usr/bin/env node
/**
 * build.js — Apply Pilot 打包脚本
 *
 * 用法：
 *   node scripts/build.js          # 仅构建到 dist/
 *   node scripts/build.js --pack   # 构建 + 生成 Chrome Web Store 用 zip 包
 *
 * 产物：
 *   dist/                          # 可直接加载到 Chrome 的扩展目录
 *   releases/apply-pilot-v{x.y.z}.zip  # 上传到 Chrome Web Store 的包
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── 配置 ────────────────────────────────────────────────────────────────────

const ROOT      = path.resolve(__dirname, '..');
const SRC_DIR   = path.join(ROOT, 'src');
const DIST_DIR  = path.join(ROOT, 'dist');
const REL_DIR   = path.join(ROOT, 'releases');
const MANIFEST  = path.join(SRC_DIR, 'manifest.json');

const PACK_FLAG = process.argv.includes('--pack');

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function log(msg)  { console.log(`  ${msg}`); }
function ok(msg)   { console.log(`✅ ${msg}`); }
function info(msg) { console.log(`\n🔧 ${msg}`); }
function err(msg)  { console.error(`❌ ${msg}`); process.exit(1); }

/** 递归拷贝目录 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** 递归删除目录（对不可删除的文件做降级处理） */
function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {
    // 某些沙箱环境不允许 unlink，降级为跳过（copyDir 会覆盖已有文件）
  }
}

/** 统计目录下文件数量 */
function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }
  return count;
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

function main() {
  // 1. 读取版本号
  if (!fs.existsSync(MANIFEST)) err(`找不到 manifest.json: ${MANIFEST}`);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const version  = manifest.version;
  if (!version) err('manifest.json 中缺少 version 字段');

  console.log(`\n🚀 Apply Pilot v${version} 打包开始\n`);

  // 2. 清理并重建 dist/
  info('清理 dist/');
  rmDir(DIST_DIR);
  log('已清空 dist/');

  // 3. 拷贝 src/ → dist/
  info('拷贝源文件 src/ → dist/');
  copyDir(SRC_DIR, DIST_DIR);
  const fileCount = countFiles(DIST_DIR);
  ok(`已拷贝 ${fileCount} 个文件到 dist/`);

  // 4. 验证 manifest 在 dist/ 根目录
  const distManifest = path.join(DIST_DIR, 'manifest.json');
  if (!fs.existsSync(distManifest)) err('dist/ 中缺少 manifest.json，打包中止');
  ok('manifest.json 验证通过');

  // 5. 如需打包，生成 zip
  if (PACK_FLAG) {
    info('生成 zip 包');
    fs.mkdirSync(REL_DIR, { recursive: true });

    const zipName = `apply-pilot-v${version}.zip`;
    const zipPath = path.join(REL_DIR, zipName);

    // 用 Python zipfile 模块打包（跨平台，无需额外依赖；会自动覆盖已有文件）
    // 将脚本写入临时文件，避免 shell 转义问题
    const tmpScript = path.join(REL_DIR, '_pack_tmp.py');
    fs.writeFileSync(tmpScript, [
      'import zipfile, os, sys',
      'dist_dir, zip_path = sys.argv[1], sys.argv[2]',
      'with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:',
      '    for root, dirs, files in os.walk(dist_dir):',
      '        for f in files:',
      '            abs_p = os.path.join(root, f)',
      '            zf.write(abs_p, os.path.relpath(abs_p, dist_dir))',
    ].join('\n'));

    try {
      execSync(`python3 "${tmpScript}" "${DIST_DIR}" "${zipPath}"`, { stdio: 'pipe' });
    } catch (e) {
      // 降级：尝试系统 zip 命令
      try {
        execSync(`cd "${DIST_DIR}" && zip -r "${zipPath}" .`, { stdio: 'pipe' });
      } catch (e2) {
        err(`打包失败 (python3 + zip 均不可用): ${e2.message}`);
      }
    }

    // 清理临时脚本
    try { fs.unlinkSync(tmpScript); } catch (_) { /* ignore */ }

    const sizeKB = (fs.statSync(zipPath).size / 1024).toFixed(1);
    ok(`已生成: releases/${zipName}  (${sizeKB} KB)`);
    console.log(`\n📦 Chrome Web Store 上传路径:\n   ${zipPath}\n`);
  } else {
    console.log(`\n✨ 构建完成！dist/ 可直接加载到 Chrome 开发者模式\n`);
    console.log(`   提示：运行 npm run pack 可同时生成 zip 包\n`);
  }
}

main();
