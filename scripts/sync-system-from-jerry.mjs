import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sourceArg = args.find((arg) => !arg.startsWith('--')) || '../jerry-notes';
const sourceDir = path.resolve(rootDir, sourceArg);

const SYNC_FILES = [
  '.github/workflows/deploy-pages-direct-upload.yml',
  '.gitignore',
  '.node-version',
  'README.md',
  '_headers',
  'app.js',
  'index.html',
  'package.json',
  'slides-template.md',
  'slides.css',
  'styles.css',
  'wrangler.toml',
  'scripts/build-site.mjs',
  'scripts/content-utils.mjs',
  'scripts/export-pdf.js',
  'scripts/generate-posts-index.mjs',
  'scripts/generate-wechat-article.js',
  'scripts/md-to-slides.js',
  'scripts/slides-data-to-md.js',
];

const REPLACEMENTS = [
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

function applySiteReplacements(content) {
  return REPLACEMENTS.reduce((output, [from, to]) => output.split(from).join(to), content);
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Source repo not found: ${sourceDir}`);
  process.exit(1);
}

const changedFiles = [];
const missingFiles = [];

for (const relativePath of SYNC_FILES) {
  const sourcePath = path.join(sourceDir, relativePath);
  const targetPath = path.join(rootDir, relativePath);

  if (!fs.existsSync(sourcePath)) {
    missingFiles.push(relativePath);
    continue;
  }

  const sourceContent = fs.readFileSync(sourcePath, 'utf8');
  const nextContent = applySiteReplacements(sourceContent);
  const prevContent = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : null;

  if (prevContent === nextContent) continue;

  changedFiles.push(relativePath);
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
  missingFiles,
  note: 'Content files under posts/ and site-specific assets are intentionally excluded.',
}, null, 2));
