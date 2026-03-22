import { escapeAttr, toMonth } from './utils.mjs';

function getAllTags(list) {
  const set = new Set();
  list.forEach((post) => (post.tags || []).forEach((tag) => set.add(tag)));
  return Array.from(set);
}

function getAllMonths(list) {
  const set = new Set();
  list.forEach((post) => {
    const month = toMonth(post.date);
    if (month) set.add(month);
  });
  return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
}

function formatPostDisplayDate(post, isMobileViewport) {
  const raw = post.updatedAt || post.updated || post.datetime || post.date || '';
  if (!raw) return '';
  if (isMobileViewport()) {
    const match = String(raw).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : raw;
  }
  return raw;
}

export function selectedFilterCount(activeTag, activeMonth) {
  return Number(Boolean(activeTag)) + Number(Boolean(activeMonth));
}

export function filterPosts(posts, activeTag, activeMonth) {
  return posts.filter((post) => {
    const hitTag = !activeTag || (post.tags || []).includes(activeTag);
    const hitMonth = !activeMonth || toMonth(post.date) === activeMonth;
    return hitTag && hitMonth;
  });
}

export function renderList({ posts, activeTag, activeMonth, postListEl, isMobileViewport }) {
  const current = filterPosts(posts, activeTag, activeMonth);

  if (!current.length) {
    postListEl.innerHTML = '<li><div class="post-meta">当前筛选下暂无文章</div></li>';
    return;
  }

  postListEl.innerHTML = current
    .map(
      (post) => `
    <li class="post-item">
      <a class="post-card ${post.visibility === 'internal' ? 'is-internal' : 'is-public'}" href="#${post.slug}" data-slug="${post.slug}">
        <div class="post-card-title-row">
          <div class="post-title-inline">
            <span class="post-link">${post.title}</span>
            ${post.visibility === 'internal' ? '<span class="post-visibility is-internal post-visibility-inline">内部</span>' : ''}
          </div>
          <span class="post-date">${formatPostDisplayDate(post, isMobileViewport)}</span>
        </div>
        ${post.summary ? `<p class="post-summary">${escapeAttr(post.summary)}</p>` : ''}
      </a>
    </li>
  `,
    )
    .join('');
}

export function renderFilters({
  posts,
  activeTag,
  activeMonth,
  showAllMobileTags,
  tagFilterEl,
  monthFilterEl,
  tagMoreBtn,
  isMobileViewport,
  syncFilterPanelState,
}) {
  const tags = getAllTags(posts);
  const months = getAllMonths(posts);
  const visibleTags =
    isMobileViewport() && !showAllMobileTags && !activeTag ? tags.slice(0, 6) : tags;

  tagFilterEl.innerHTML = visibleTags
    .map(
      (tag) => `<button class="chip ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</button>`,
    )
    .join('');

  if (tagMoreBtn) {
    const shouldShow = isMobileViewport() && tags.length > 6 && !activeTag;
    tagMoreBtn.classList.toggle('hidden', !shouldShow);
    if (shouldShow) {
      tagMoreBtn.textContent = showAllMobileTags ? '收起标签' : '展开更多标签';
    }
  }

  monthFilterEl.innerHTML = ['<option value="">全部月份</option>']
    .concat(
      months.map(
        (month) => `<option value="${month}" ${activeMonth === month ? 'selected' : ''}>${month}</option>`,
      ),
    )
    .join('');

  syncFilterPanelState();
}
