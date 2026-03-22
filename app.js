import siteConfig from './site.config.mjs';
import { mdToHtml, stripFrontMatter } from './frontend/markdown.mjs';
import {
  renderFilters,
  renderList,
  selectedFilterCount,
} from './frontend/posts-ui.mjs';

let posts = [];
let activeTag = null;
let activeMonth = null;

const postListEl = document.getElementById('post-list');
const tagFilterEl = document.getElementById('tag-filter');
const monthFilterEl = document.getElementById('month-filter');
const resetFilterBtn = document.getElementById('reset-filter');
const filterToggleBtn = document.getElementById('filter-toggle');
const indexPanelEl = document.getElementById('index-panel');
const tagMoreBtn = document.getElementById('tag-more');

const viewer = document.getElementById('viewer');
const contentEl = document.getElementById('post-content');
const backBtn = document.getElementById('back-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');
const sharePostBtn = document.getElementById('share-post-btn');
const postBackFabBtn = document.getElementById('post-back-fab-btn');
const postRefreshFabBtn = document.getElementById('post-refresh-fab-btn');
const wechatBtn = document.getElementById('wechat-btn');
const summaryBtn = document.getElementById('summary-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const postsSection = document.getElementById('posts');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userSessionEl = document.getElementById('user-session');
const userAvatarEl = document.getElementById('user-avatar');
const userNameEl = document.getElementById('user-name');
const authNoteEl = document.getElementById('auth-note');
const siteToastEl = document.getElementById('site-toast');
const themeIconEl = themeToggleBtn?.querySelector('.theme-icon');

let currentPost = null;
let isMobileFilterOpen = false;
let showAllMobileTags = false;
let pendingAuthMessage = '';
let mermaidLoaderPromise = null;
const defaultDocumentTitle = document.title;

const MERMAID_SCRIPT_SRC = './assets/vendor/mermaid.min.js?v=202603221255';

function isMobileViewport() {
  return window.matchMedia('(max-width: 900px)').matches;
}

function syncFilterPanelState() {
  if (!indexPanelEl || !filterToggleBtn) return;

  const count = selectedFilterCount(activeTag, activeMonth);
  const suffix = count > 0 ? `(${count})` : '';

  if (isMobileViewport()) {
    indexPanelEl.classList.toggle('collapsed-mobile', !isMobileFilterOpen);
    filterToggleBtn.textContent = isMobileFilterOpen ? `收起${suffix}` : `筛选${suffix}`;
    filterToggleBtn.setAttribute('aria-expanded', isMobileFilterOpen ? 'true' : 'false');
  } else {
    indexPanelEl.classList.remove('collapsed-mobile');
    const collapsed = indexPanelEl.classList.contains('collapsed-desktop');
    filterToggleBtn.textContent = collapsed ? `展开${suffix}` : `收起${suffix}`;
    filterToggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
}

document.getElementById('year').textContent = new Date().getFullYear();

function renderPostList() {
  renderList({
    posts,
    activeTag,
    activeMonth,
    postListEl,
    isMobileViewport,
  });
}

function renderFilterPanel() {
  renderFilters({
    posts,
    activeTag,
    activeMonth,
    showAllMobileTags,
    tagFilterEl,
    monthFilterEl,
    tagMoreBtn,
    isMobileViewport,
    syncFilterPanelState,
  });
}

function getMermaidTheme() {
  return document.body.getAttribute('data-theme') === THEME_LIGHT ? 'neutral' : 'dark';
}

function getMermaidThemeVariables() {
  if (document.body.getAttribute('data-theme') === THEME_LIGHT) {
    return {
      background: '#F8FAFE',
      primaryColor: '#EEF4FF',
      primaryBorderColor: '#7EA7E8',
      primaryTextColor: '#16243E',
      secondaryColor: '#EAFBF7',
      secondaryBorderColor: '#65C8B7',
      secondaryTextColor: '#123C44',
      tertiaryColor: '#FFF4E6',
      tertiaryBorderColor: '#E4B46A',
      tertiaryTextColor: '#5F3710',
      lineColor: '#7A8FB5',
      textColor: '#1F3150',
      fontSize: '18px',
      fontFamily: '"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif',
      nodeBorder: '#AFC3E8',
      clusterBkg: '#F8FAFE',
      clusterBorder: '#D5E1F7',
      edgeLabelBackground: '#FFFFFF',
    };
  }

  return {
    background: '#111B2D',
    primaryColor: '#192842',
    primaryBorderColor: '#6E8FC3',
    primaryTextColor: '#EAF0FF',
    secondaryColor: '#132D33',
    secondaryBorderColor: '#52B7A6',
    secondaryTextColor: '#E7FFFB',
    tertiaryColor: '#2E2418',
    tertiaryBorderColor: '#CF9A52',
    tertiaryTextColor: '#FFF2DE',
    lineColor: '#7089B8',
    textColor: '#E7EEFF',
    fontSize: '18px',
    fontFamily: '"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif',
    nodeBorder: '#4A6088',
    clusterBkg: '#111B2D',
    clusterBorder: '#2A3B5C',
    edgeLabelBackground: '#182339',
  };
}

function renderMermaidFallback(target, source) {
  target.classList.add('is-error');
  target.innerHTML = `<pre><code class="lang-mermaid">${escapeHtml(source)}</code></pre>`;
}

function loadMermaidLibrary() {
  if (window.mermaid) {
    return Promise.resolve(window.mermaid);
  }

  if (mermaidLoaderPromise) {
    return mermaidLoaderPromise;
  }

  mermaidLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = MERMAID_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.mermaid) {
        resolve(window.mermaid);
        return;
      }
      reject(new Error('Mermaid loaded without global object.'));
    };
    script.onerror = () => reject(new Error('Failed to load Mermaid bundle.'));
    document.head.appendChild(script);
  });

  return mermaidLoaderPromise;
}

async function renderMermaidDiagrams(container = contentEl) {
  if (!container?.querySelectorAll) return;

  const diagrams = Array.from(container.querySelectorAll('.mermaid-diagram[data-mermaid-source]'));
  if (!diagrams.length) return;

  let mermaid;
  try {
    mermaid = await loadMermaidLibrary();
  } catch (error) {
    console.warn('failed to load mermaid', error);
    diagrams.forEach((diagramEl) => {
      const source = decodeURIComponent(diagramEl.dataset.mermaidSource || '');
      renderMermaidFallback(diagramEl, source);
    });
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: getMermaidTheme(),
    themeVariables: getMermaidThemeVariables(),
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      nodeSpacing: 64,
      rankSpacing: 82,
      padding: 24,
      useMaxWidth: true,
    },
  });

  for (let index = 0; index < diagrams.length; index += 1) {
    const diagramEl = diagrams[index];
    const source = decodeURIComponent(diagramEl.dataset.mermaidSource || '');

    if (!source) continue;

    try {
      const renderId = `mermaid-${Date.now()}-${index}`;
      const result = await mermaid.render(renderId, source);
      diagramEl.classList.remove('is-error');
      diagramEl.innerHTML = result.svg;
      if (typeof result.bindFunctions === 'function') {
        result.bindFunctions(diagramEl);
      }
    } catch (error) {
      console.warn('failed to render mermaid diagram', error);
      renderMermaidFallback(diagramEl, source);
    }
  }
}

function ensureLightbox() {
  if (document.getElementById('lightbox-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'lightbox-overlay';
  overlay.className = 'lightbox-overlay hidden';
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="关闭预览">×</button>
    <img class="lightbox-image" alt="preview" />
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.classList.add('hidden');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
      close();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

function renderEmbeddedSlideDeck(slug, target) {
  const src = (target.url || `./slides/${slug}.html`) + '?embed=1';
  contentEl.innerHTML = `
    <div class="slide-embed-wrap">
      <iframe class="slide-embed-iframe" src="${src}" title="${target.title || slug}" loading="lazy" scrolling="no"></iframe>
    </div>
  `;
}

function renderProtectedPostMessage() {
  contentEl.innerHTML = `
    <div class="protected-post">
      <h2>这篇内容属于内部资料</h2>
      <p>当前登录态已失效，或你还没有完成飞书登录。</p>
      <p>登录成功后再返回当前页面，就可以继续查看。</p>
      <div class="protected-post-actions">
        <a class="btn" href="${buildAuthUrl('login')}">使用飞书登录</a>
      </div>
    </div>
  `;
}

async function openPost(slug, options = {}) {
  const target = posts.find((p) => p.slug === slug);
  if (!target) return;
  currentPost = target;
  document.title = target.title || defaultDocumentTitle;

  if (!options.skipHistory) {
    const nextHash = `#${slug}`;
    if (location.hash !== nextHash) {
      history.pushState({ slug }, '', nextHash);
    }
  }

  if (target.type === 'webslides') {
    renderEmbeddedSlideDeck(slug, target);
  } else {
    const response = await fetch(`./posts/${slug}.md`);
    if (response.status === 401) {
      renderProtectedPostMessage();
      viewer.classList.remove('hidden');
      postsSection.classList.add('hidden');
      return;
    }

    const text = await response.text();
    contentEl.innerHTML = mdToHtml(text);
    await renderMermaidDiagrams(contentEl);
  }

  viewer.classList.remove('hidden');
  postsSection.classList.add('hidden');
}

function getCurrentReturnTo() {
  return `${location.pathname}${location.search}${location.hash}`;
}

function buildAuthUrl(action) {
  return `/api/auth/feishu/${action}?return_to=${encodeURIComponent(getCurrentReturnTo())}`;
}

function setAuthNote(message = '') {
  if (!authNoteEl) return;

  authNoteEl.textContent = message;
  authNoteEl.classList.toggle('hidden', !message);
}

function mapAuthError(code) {
  const messages = {
    access_denied: '你取消了飞书授权，本次未登录。',
    invalid_state: '登录状态校验失败，请重新发起飞书登录。',
    login_failed: '飞书登录失败，请检查应用配置后重试。',
    tenant_not_allowed: '当前飞书企业不在允许名单内。',
  };

  return messages[code] || '飞书登录未完成，请稍后再试。';
}

function consumeAuthError() {
  const url = new URL(location.href);
  const authError = url.searchParams.get('auth_error');

  if (!authError) return;

  pendingAuthMessage = mapAuthError(authError);
  url.searchParams.delete('auth_error');
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function renderAuthState(authState = {}) {
  if (!loginBtn || !userSessionEl) return;

  const enabled = Boolean(authState.enabled);
  const authenticated = Boolean(authState.authenticated && authState.user);

  loginBtn.classList.toggle('hidden', !enabled || authenticated);
  userSessionEl.classList.toggle('hidden', !enabled || !authenticated);

  if (!enabled) {
    setAuthNote('飞书登录尚未配置。请先在 Cloudflare Pages 中补齐飞书环境变量。');
    return;
  }

  if (!authenticated) {
    setAuthNote(pendingAuthMessage || '登录后可查看内部文章与工作手册。');
    pendingAuthMessage = '';
    return;
  }

  const user = authState.user || {};
  userNameEl.textContent = user.name || '飞书用户';

  if (user.avatarUrl) {
    userAvatarEl.src = user.avatarUrl;
    userAvatarEl.classList.remove('hidden');
  } else {
    userAvatarEl.removeAttribute('src');
    userAvatarEl.classList.add('hidden');
  }

  setAuthNote('');
  pendingAuthMessage = '';
}

async function loadAuthState() {
  consumeAuthError();

  if (!loginBtn || !userSessionEl) return;

  loginBtn.href = buildAuthUrl('login');

  try {
    const response = await fetch('/api/auth/feishu/me', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`auth_state_http_${response.status}`);
    }
    const authState = await response.json();
    renderAuthState(authState);
  } catch (e) {
    console.warn('failed to load auth state', e);
    renderAuthState({ enabled: true, authenticated: false });
    setAuthNote('飞书登录状态读取失败，请稍后刷新重试。');
  }
}

postsSection.addEventListener('click', (e) => {
  const el = e.target.closest('a[data-slug]');
  if (!el) return;
  e.preventDefault();
  openPost(el.dataset.slug);
});

if (tagFilterEl) {
  tagFilterEl.addEventListener('click', (e) => {
    const el = e.target.closest('button[data-tag]');
    if (!el) return;
    const tag = el.dataset.tag;
    activeTag = activeTag === tag ? null : tag;
    if (activeTag) showAllMobileTags = true;
    renderFilterPanel();
    renderPostList();
  });
}

if (tagMoreBtn) {
  tagMoreBtn.addEventListener('click', () => {
    showAllMobileTags = !showAllMobileTags;
    renderFilterPanel();
  });
}

if (monthFilterEl) {
  monthFilterEl.addEventListener('change', () => {
    activeMonth = monthFilterEl.value || null;
    renderFilterPanel();
    renderPostList();
  });
}

if (resetFilterBtn) {
  resetFilterBtn.addEventListener('click', () => {
    activeTag = null;
    activeMonth = null;
    showAllMobileTags = false;
    renderFilterPanel();
    renderPostList();
  });
}

if (filterToggleBtn) {
  filterToggleBtn.addEventListener('click', () => {
    if (isMobileViewport()) {
      isMobileFilterOpen = !isMobileFilterOpen;
    } else {
      indexPanelEl?.classList.toggle('collapsed-desktop');
    }
    syncFilterPanelState();
  });
}

window.addEventListener('resize', () => {
  if (!isMobileViewport()) {
    isMobileFilterOpen = false;
  }
  syncFilterPanelState();
  renderFilterPanel();
});

window.addEventListener('popstate', async () => {
  if (location.hash) {
    await openPost(location.hash.replace('#', ''), { skipHistory: true });
    return;
  }
  showListView({ skipHistory: true });
});

function showListView(options = {}) {
  viewer.classList.add('hidden');
  postsSection.classList.remove('hidden');
  currentPost = null;
  document.title = defaultDocumentTitle;
  if (!options.skipHistory && location.hash) {
    history.pushState({}, '', `${location.pathname}${location.search}`);
  }
}

backBtn.addEventListener('click', () => {
  showListView();
});

if (postBackFabBtn) {
  postBackFabBtn.addEventListener('click', () => {
    showListView();
  });
}

if (postRefreshFabBtn) {
  postRefreshFabBtn.addEventListener('click', async () => {
    if (!currentPost) {
      location.reload();
      return;
    }
    await openPost(currentPost.slug, { skipHistory: true });
    showToast('已刷新');
  });
}

if (viewer) {
  viewer.addEventListener('click', (e) => {
    const img = e.target.closest('img[data-lightbox="1"]');
    if (!img) return;
    ensureLightbox();
    const overlay = document.getElementById('lightbox-overlay');
    const big = overlay?.querySelector('.lightbox-image');
    if (!overlay || !big) return;
    big.src = img.getAttribute('src') || '';
    big.alt = img.getAttribute('alt') || 'preview';
    overlay.classList.remove('hidden');
  });
}

let toastTimer = null;

function showToast(message = '') {
  if (!siteToastEl || !message) return;
  siteToastEl.textContent = message;
  siteToastEl.classList.remove('hidden');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    siteToastEl.classList.add('hidden');
  }, 1800);
}

if (sharePostBtn) {
  sharePostBtn.addEventListener('click', async () => {
    if (!currentPost) return;

    const shareData = {
      title: currentPost.title || defaultDocumentTitle,
      text: currentPost.summary || currentPost.title || defaultDocumentTitle,
      url: location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard?.writeText(shareData.url);
      showToast('链接已复制');
    } catch (e) {
      if (!shareData.url) return;
      try {
        await navigator.clipboard?.writeText(shareData.url);
        showToast('链接已复制');
      } catch (_err) {
        showToast('当前浏览器暂不支持分享');
      }
    }
  });
}

if (exportPdfBtn) {
  exportPdfBtn.addEventListener('click', () => {
    if (!currentPost) return;
    const printTitle = currentPost.title || defaultDocumentTitle;
    const previousTitle = document.title;
    document.title = printTitle;

    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };

    window.addEventListener('afterprint', restoreTitle, { once: true });
    window.print();
  });
}

if (wechatBtn) {
  wechatBtn.addEventListener('click', () => {
    if (!currentPost) return;
    const slug = currentPost.slug;
    const src = `./posts/${slug}.md`;
    const cmd = `node scripts/generate-wechat-article.js --source "${src}" --title "${currentPost.title || slug}"`;
    alert(`请在项目根目录执行:\n\n${cmd}`);
  });
}

if (summaryBtn) {
  summaryBtn.addEventListener('click', async () => {
    if (!currentPost) return;
    const slug = currentPost.slug;
    const src = `./posts/${slug}.md`;

    try {
      const text = stripFrontMatter(await fetch(src).then((r) => r.text()));
      const lines = text
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith('#') && !s.startsWith('@') && !s.startsWith('---'));

      const bullets = lines
        .slice(0, 30)
        .filter((s) => !s.startsWith('!['))
        .slice(0, 3)
        .map((s, i) => `${i + 1}. ${s.replace(/^[-*+]\s+/, '')}`);

      const output = bullets.length ? bullets.join('\n') : '1. 这篇文章建议补充摘要内容。';
      navigator.clipboard?.writeText(output).catch(() => {});
      alert(`已生成3条摘要（并尝试复制到剪贴板）：\n\n${output}`);
    } catch (e) {
      alert('摘要生成失败，请稍后重试');
    }
  });
}

if (loginBtn) {
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    location.assign(buildAuthUrl('login'));
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    location.assign(buildAuthUrl('logout'));
  });
}

const THEME_KEY = siteConfig.themeStorageKey || 'jerry-notes-theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

function applyTheme(mode) {
  const real = mode === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
  document.body.setAttribute('data-theme', real);
  if (themeToggleBtn) {
    themeToggleBtn.setAttribute('aria-label', real === THEME_LIGHT ? '切换到黑夜主题' : '切换到白天主题');
    themeToggleBtn.setAttribute('title', real === THEME_LIGHT ? '切换到黑夜主题' : '切换到白天主题');
  }
  if (themeIconEl) {
    themeIconEl.textContent = real === THEME_LIGHT ? '🌙' : '☀️';
  }
  void renderMermaidDiagrams(contentEl);
}

function initTheme() {
  const preset = document.documentElement.getAttribute('data-theme');
  const mode = localStorage.getItem(THEME_KEY) || preset || THEME_LIGHT;
  applyTheme(mode);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const cur = localStorage.getItem(THEME_KEY) || THEME_DARK;
      const next = cur === THEME_DARK ? THEME_LIGHT : THEME_DARK;
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }
}

async function bootstrap() {
  try {
    const data = await fetch('./posts/posts.json').then((r) => r.json());
    posts = data;
  } catch (e) {
    console.warn('failed to load posts.json, fallback to empty list', e);
    posts = [];
  }

  initTheme();
  await loadAuthState();
  renderFilterPanel();
  renderPostList();

  if (location.hash) {
    await openPost(location.hash.replace('#', ''), { skipHistory: true });
  }
}

bootstrap();
