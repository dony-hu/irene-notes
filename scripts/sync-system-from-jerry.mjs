import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sourceArg = args.find((arg) => !arg.startsWith('--')) || '../jerry-notes';
const sourceDir = path.resolve(rootDir, sourceArg);

const SITE_REPLACEMENTS = [
  ['Deploy Pages (Direct Upload)', 'Deploy Irene Notes'],
  ['Deploy to existing Cloudflare Pages project', 'Deploy Irene site'],
  ['Jerry的个人站', 'Irene的个人站'],
  ['Jerry Notes static site', 'Irene Notes static site'],
  ['Jerry Notes', 'Irene Notes'],
  ["Jerry's Notes", "Irene's Notes"],
  ['jerry-notes-theme', 'irene-notes-theme'],
  ['jerry-notes.pages.dev', 'irene-notes.pages.dev'],
  ['`jerry-notes`', '`irene-notes`'],
  ['jerry-notes', 'irene-notes'],
];

const SYNC_PLAN = [
  { path: '.dev.vars.example', mode: 'copy' },
  { path: '.github/workflows/deploy-pages-direct-upload.yml', mode: 'copy' },
  { path: '.gitignore', mode: 'copy' },
  { path: '.node-version', mode: 'copy' },
  { path: '_headers', mode: 'copy' },
  { path: 'package.json', mode: 'package-json' },
  { path: 'slides-template.md', mode: 'copy' },
  { path: 'slides.css', mode: 'copy' },
  { path: 'wrangler.toml', mode: 'copy' },
  { path: 'functions/_lib/feishu-auth.js', mode: 'copy' },
  { path: 'functions/api/auth/feishu/login.js', mode: 'copy' },
  { path: 'functions/api/auth/feishu/callback.js', mode: 'copy' },
  { path: 'functions/api/auth/feishu/logout.js', mode: 'copy' },
  { path: 'functions/api/auth/feishu/me.js', mode: 'copy' },
  { path: 'functions/posts/_middleware.js', mode: 'copy' },
  { path: 'functions/posts/[slug].js', mode: 'copy' },
  { path: 'functions/posts/posts.json.js', mode: 'copy' },
  { path: 'scripts/export-pdf.js', mode: 'copy' },
  { path: 'scripts/generate-posts-index.mjs', mode: 'copy' },
  { path: 'scripts/generate-wechat-article.js', mode: 'copy' },
  { path: 'scripts/slides-data-to-md.js', mode: 'copy' },
  {
    path: 'README.md',
    mode: 'manual',
    reason: 'README carries repo-specific feature and deployment guidance.',
  },
  {
    path: 'index.html',
    mode: 'manual',
    reason: 'Homepage template mixes shared structure with Irene-only banner, copy, and layout.',
  },
  {
    path: 'app.js',
    mode: 'manual',
    reason: 'Frontend behavior has diverged and includes site-specific UX and data shaping.',
  },
  {
    path: 'styles.css',
    mode: 'manual',
    reason: 'Stylesheet mixes shared tokens with site-specific layout and interaction styles.',
  },
  {
    path: 'scripts/build-site.mjs',
    mode: 'manual',
    reason: 'Build output paths differ between the two sites and affect runtime routing.',
  },
  {
    path: 'scripts/content-utils.mjs',
    mode: 'manual',
    reason: 'Content pipeline rules differ in summaries, timestamps, and access policy.',
  },
  {
    path: 'scripts/md-to-slides.js',
    mode: 'manual',
    reason: 'Slides shell uses site-specific home links and asset paths.',
  },
  {
    path: 'functions/_lib/post-access.js',
    mode: 'manual',
    reason: 'Access helper needs Irene-specific slide asset routing.',
  },
  {
    path: 'functions/[slug].js',
    mode: 'manual',
    reason: 'Root slide route is Irene-specific because webslides are published at /<slug>.html.',
  },
  {
    path: 'functions/slides/_middleware.js',
    mode: 'manual',
    reason: 'Slide routes differ because Irene does not publish deck files under /slides by default.',
  },
  {
    path: 'functions/slides/[slug].js',
    mode: 'manual',
    reason: 'Slide routes differ because Irene does not publish deck files under /slides by default.',
  },
];

function applySiteReplacements(content) {
  return SITE_REPLACEMENTS.reduce((output, [from, to]) => output.split(from).join(to), content);
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function mergeObjectKeepingTargetOnlyKeys(sourceObject = {}, targetObject = {}) {
  const merged = { ...sourceObject };

  Object.keys(targetObject).forEach((key) => {
    if (!(key in merged)) {
      merged[key] = targetObject[key];
    }
  });

  return merged;
}

function hasOwnKeys(value) {
  return Boolean(value && typeof value === 'object' && Object.keys(value).length > 0);
}

function mergePackageJson(sourceContent, targetContent) {
  const source = JSON.parse(applySiteReplacements(sourceContent));
  const target = targetContent ? JSON.parse(targetContent) : {};

  const merged = {
    ...source,
    scripts: mergeObjectKeepingTargetOnlyKeys(source.scripts, target.scripts),
  };

  const objectFields = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ];

  objectFields.forEach((field) => {
    const nextValue = mergeObjectKeepingTargetOnlyKeys(source[field], target[field]);
    if (hasOwnKeys(nextValue)) {
      merged[field] = nextValue;
    } else {
      delete merged[field];
    }
  });

  Object.keys(target).forEach((key) => {
    if (objectFields.includes(key) && !hasOwnKeys(target[key])) return;
    if (!(key in merged)) {
      merged[key] = target[key];
    }
  });

  return `${JSON.stringify(merged, null, 2)}\n`;
}

function buildNextContent(entry, sourceContent, targetContent) {
  if (entry.mode === 'package-json') {
    return mergePackageJson(sourceContent, targetContent);
  }

  return applySiteReplacements(sourceContent);
}

function compareManualFile(sourceContent, targetContent) {
  if (targetContent == null) return 'missing-target';
  return applySiteReplacements(sourceContent) === targetContent ? 'in-sync' : 'drifted';
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Source repo not found: ${sourceDir}`);
  process.exit(1);
}

const changedFiles = [];
const missingFiles = [];
const manualReviewFiles = [];

for (const entry of SYNC_PLAN) {
  const sourcePath = path.join(sourceDir, entry.path);
  const targetPath = path.join(rootDir, entry.path);

  if (!fs.existsSync(sourcePath)) {
    missingFiles.push(entry.path);
    continue;
  }

  const sourceContent = readUtf8(sourcePath);
  const targetContent = fs.existsSync(targetPath) ? readUtf8(targetPath) : null;

  if (entry.mode === 'manual') {
    const status = compareManualFile(sourceContent, targetContent);
    if (status !== 'in-sync') {
      manualReviewFiles.push({
        path: entry.path,
        reason: entry.reason,
        status,
      });
    }
    continue;
  }

  const nextContent = buildNextContent(entry, sourceContent, targetContent);
  if (targetContent === nextContent) continue;

  changedFiles.push(entry.path);
  if (!dryRun) {
    ensureDirectory(targetPath);
    fs.writeFileSync(targetPath, nextContent, 'utf8');
  }
}

console.log(JSON.stringify({
  ok: true,
  sourceDir,
  targetDir: rootDir,
  dryRun,
  changedFiles,
  manualReviewFiles,
  missingFiles,
  note: 'Only stable shared files are auto-synced. Mixed engine + site-specific files are reported for manual review instead of being overwritten.',
}, null, 2));
