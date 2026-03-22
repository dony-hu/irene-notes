export function escapeHtml(s = '') {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function escapeAttr(s = '') {
  return escapeHtml(s).replaceAll('\n', ' ').trim();
}

export function toMonth(dateStr = '') {
  return String(dateStr).slice(0, 7);
}
