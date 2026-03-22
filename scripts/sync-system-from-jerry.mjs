import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sourceArg = args.find((arg) => !arg.startsWith('--')) || '../jerry-notes';
const sourceDir = path.resolve(rootDir, sourceArg);

const EXCLUDED_PREFIXES = [
  '.git/',
  'node_modules/',
  '.obsidian/',
  'dist/',
  '.wrangler/',
  '.trash/',
  'posts/',
  'assets/files/',
];

const EXCLUDED_EXACT = new Set([
  'site.config.mjs',
]);

const IGNORED_FILE_NAMES = new Set([
  '.DS_Store',
]);

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeAssetHref(href = '') {
  return String(href || '').replace(/^\.\//, '').split('?')[0];
}

async function loadConfig(configPath) {
  const configUrl = `${pathToFileURL(configPath).href}?t=${Date.now()}`;
  const module = await import(configUrl);
  return module.default || {};
}

function shouldSkip(relPath, sourceBannerAsset) {
  const normalized = toPosix(relPath);
  const baseName = path.posix.basename(normalized);

  if (IGNORED_FILE_NAMES.has(baseName)) return true;
  if (EXCLUDED_EXACT.has(normalized)) return true;
  if (sourceBannerAsset && normalized === sourceBannerAsset) return true;

  return EXCLUDED_PREFIXES.some((prefix) => (
    normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)
  ));
}

function replaceIndexPlaceholder(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function applyLocalBranding(indexHtml, targetConfig) {
  const title = escapeHtml(targetConfig.siteTitle || 'Irene Notes');
  const description = escapeHtml(targetConfig.siteDescription || '');
  const themeStorageKey = escapeHtml(targetConfig.themeStorageKey || 'irene-notes-theme');
  const faviconHref = escapeHtml(targetConfig.assets?.faviconHref || './assets/mouse-favicon.svg');
  const faviconType = escapeHtml(targetConfig.assets?.faviconType || 'image/svg+xml');
  const bannerHref = escapeHtml(targetConfig.assets?.bannerHref || '');
  const bannerAlt = escapeHtml(
    targetConfig.assets?.bannerAlt || targetConfig.siteTitle || '站点标题图',
  );
  const siteKicker = escapeHtml(targetConfig.siteKicker || '');
  const heroDescription = escapeHtml(
    targetConfig.heroDescription || targetConfig.siteDescription || '',
  );
  const aboutText = escapeHtml(targetConfig.aboutText || '');
  const footerText = escapeHtml(targetConfig.footerText || '');

  let next = indexHtml;
  next = replaceIndexPlaceholder(next, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  next = replaceIndexPlaceholder(
    next,
    /<meta id="site-meta-description" name="description" content="[^"]*" \/>/,
    `<meta id="site-meta-description" name="description" content="${description}" />`,
  );
  next = replaceIndexPlaceholder(
    next,
    /<link id="site-favicon" rel="icon" type="[^"]*" href="[^"]*" \/>/,
    `<link id="site-favicon" rel="icon" type="${faviconType}" href="${faviconHref}" />`,
  );
  next = replaceIndexPlaceholder(next, /var key = '[^']+';/, `var key = '${themeStorageKey}';`);
  next = replaceIndexPlaceholder(
    next,
    /<img id="site-banner" class="header-banner" src="[^"]*" alt="[^"]*" \/>/,
    `<img id="site-banner" class="header-banner" src="${bannerHref}" alt="${bannerAlt}" />`,
  );
  next = replaceIndexPlaceholder(
    next,
    /<span id="site-kicker" class="site-kicker(?: hidden)?">[\s\S]*?<\/span>/,
    siteKicker
      ? `<span id="site-kicker" class="site-kicker">${siteKicker}</span>`
      : '<span id="site-kicker" class="site-kicker hidden"></span>',
  );
  next = replaceIndexPlaceholder(next, /<h1 id="site-title">[\s\S]*?<\/h1>/, `<h1 id="site-title">${title}</h1>`);
  next = replaceIndexPlaceholder(
    next,
    /<p id="site-hero-description">[\s\S]*?<\/p>/,
    `<p id="site-hero-description">${heroDescription}</p>`,
  );
  next = replaceIndexPlaceholder(next, /<p id="about-copy">[\s\S]*?<\/p>/, `<p id="about-copy">${aboutText}</p>`);
  next = replaceIndexPlaceholder(
    next,
    /<span id="site-footer-text">[\s\S]*?<\/span>/,
    `<span id="site-footer-text">${footerText}</span>`,
  );

  return next;
}

function buffersEqual(leftBuffer, rightBuffer) {
  return leftBuffer.equals(rightBuffer);
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Source repo not found: ${sourceDir}`);
  process.exit(1);
}

const sourceConfig = await loadConfig(path.join(sourceDir, 'site.config.mjs'));
const targetConfig = await loadConfig(path.join(rootDir, 'site.config.mjs'));
const sourceBannerAsset = normalizeAssetHref(sourceConfig.assets?.bannerHref);

const changedFiles = [];

function syncDirectory(currentSourceDir, relDir = '') {
  const entries = fs.readdirSync(currentSourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const relPath = relDir ? path.posix.join(relDir, entry.name) : entry.name;
    if (shouldSkip(relPath, sourceBannerAsset)) continue;

    const sourcePath = path.join(currentSourceDir, entry.name);
    const targetPath = path.join(rootDir, relPath);

    if (entry.isDirectory()) {
      syncDirectory(sourcePath, relPath);
      continue;
    }

    let nextBuffer = fs.readFileSync(sourcePath);

    if (relPath === 'index.html') {
      nextBuffer = Buffer.from(applyLocalBranding(nextBuffer.toString('utf8'), targetConfig), 'utf8');
    }

    const targetExists = fs.existsSync(targetPath);
    const targetBuffer = targetExists ? fs.readFileSync(targetPath) : null;
    if (targetBuffer && buffersEqual(nextBuffer, targetBuffer)) continue;

    changedFiles.push(relPath);
    if (!dryRun) {
      ensureDirectory(targetPath);
      fs.writeFileSync(targetPath, nextBuffer);
    }
  }
}

syncDirectory(sourceDir);

console.log(JSON.stringify({
  ok: true,
  sourceDir,
  targetDir: rootDir,
  dryRun,
  changedFiles,
  preservedPaths: [
    'posts/',
    'assets/files/',
    'site.config.mjs',
    sourceBannerAsset || '(no source banner asset)',
    '.obsidian/',
  ],
  note: 'Code paths are synced from jerry-notes, while Irene content and site branding config stay local.',
}, null, 2));
