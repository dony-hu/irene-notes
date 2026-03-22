import { escapeHtml } from './utils.mjs';

function parseInline(text = '') {
  let out = escapeHtml(text);

  out = out.replace(/!\[(.*?)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_match, alt, src, title) => {
    const safeSrc = String(src || '');
    if (!safeSrc || /^javascript:/i.test(safeSrc)) return '';
    const safeAlt = escapeHtml(alt || 'image');
    const safeTitle = escapeHtml(title || '');
    const caption = safeTitle || safeAlt;
    return `<figure class="md-figure"><img class="md-image" loading="lazy" decoding="async" src="${safeSrc}" alt="${safeAlt}" ${safeTitle ? `title="${safeTitle}"` : ''} data-lightbox="1"/><figcaption>${caption}</figcaption></figure>`;
  });

  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
  out = out.replace(/\[(.*?)\]\(([^\s)]+)\)/g, (_match, textValue, href) => {
    const safeHref = String(href || '');
    if (/^javascript:/i.test(safeHref)) return textValue;
    const isExternal = /^https?:\/\//i.test(safeHref);
    if (isExternal) {
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${textValue}</a>`;
    }
    return `<a href="${safeHref}">${textValue}</a>`;
  });
  out = out.replace(/&lt;br\s*\/?&gt;/gi, '<br/>');
  return out;
}

function renderPdfEmbed(src = '', title = 'PDF 文档') {
  const safeSrc = String(src || '');
  const safeTitle = escapeHtml(title || 'PDF 文档');
  if (!safeSrc || /^javascript:/i.test(safeSrc)) return '';
  return `
    <div class="pdf-embed-wrap">
      <div class="pdf-embed-toolbar">
        <a class="btn btn-small" href="${safeSrc}" target="_blank" rel="noopener noreferrer">新窗口打开 PDF</a>
        <a class="btn btn-small" href="${safeSrc}" download>下载 PDF</a>
      </div>
      <iframe class="pdf-embed-iframe" src="${safeSrc}#view=FitH" title="${safeTitle}" loading="lazy"></iframe>
    </div>
  `;
}

export function stripFrontMatter(mdRaw = '') {
  const normalized = mdRaw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const match = normalized.match(/^---\n[\s\S]*?\n---(?:\n|$)/);
  return match ? normalized.slice(match[0].length) : normalized;
}

export function mdToHtml(mdRaw = '') {
  const md = stripFrontMatter(mdRaw);
  const lines = md.split('\n');
  const html = [];

  let inCode = false;
  let codeLang = '';
  let codeLines = [];
  let inUl = false;
  let inOl = false;
  let para = [];

  const isTableSep = (line = '') => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const splitTableRow = (line = '') => {
    let row = line.trim();
    if (row.startsWith('|')) row = row.slice(1);
    if (row.endsWith('|')) row = row.slice(0, -1);
    return row.split('|').map((cell) => cell.trim());
  };

  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${parseInline(para.join('<br/>'))}</p>`);
      para = [];
    }
  };

  const closeLists = () => {
    if (inUl) {
      html.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      html.push('</ol>');
      inOl = false;
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.trim().startsWith('```')) {
      flushPara();
      closeLists();
      if (!inCode) {
        inCode = true;
        codeLang = line.trim().slice(3).trim().toLowerCase();
        codeLines = [];
      } else {
        const codeValue = codeLines.join('\n');
        if (codeLang === 'mermaid') {
          html.push(
            `<div class="mermaid-block"><div class="mermaid-diagram" data-mermaid-source="${escapeHtml(encodeURIComponent(codeValue))}"></div></div>`,
          );
        } else {
          html.push(`<pre><code class="lang-${escapeHtml(codeLang)}">${escapeHtml(codeValue)}</code></pre>`);
        }
        inCode = false;
        codeLang = '';
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushPara();
      closeLists();
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      flushPara();
      closeLists();
      html.push('<hr/>');
      continue;
    }

    const imageOnly = line.match(/^!\[(.*?)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)\s*$/);
    if (imageOnly) {
      flushPara();
      closeLists();
      const alt = escapeHtml(imageOnly[1] || 'image');
      const src = String(imageOnly[2] || '');
      const title = escapeHtml(imageOnly[3] || '');
      if (src && !/^javascript:/i.test(src)) {
        const caption = title || alt;
        html.push(`<figure class="md-figure"><img class="md-image" loading="lazy" decoding="async" src="${src}" alt="${alt}" ${title ? `title="${title}"` : ''} data-lightbox="1"/><figcaption>${caption}</figcaption></figure>`);
      }
      continue;
    }

    const pdfEmbed = line.match(/^\[pdf\]\(([^\s)]+)(?:\s+"([^"]*)")?\)\s*$/i);
    if (pdfEmbed) {
      flushPara();
      closeLists();
      html.push(renderPdfEmbed(pdfEmbed[1], pdfEmbed[2] || 'PDF 文档'));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushPara();
      closeLists();
      const level = heading[1].length;
      html.push(`<h${level}>${parseInline(heading[2])}</h${level}>`);
      continue;
    }

    if (line.includes('|') && index + 1 < lines.length && isTableSep(lines[index + 1])) {
      flushPara();
      closeLists();

      const headers = splitTableRow(line);
      html.push('<div class="table-wrap"><div class="table-scroll-hint">← 左右滑动查看完整表格</div><table class="md-table"><thead><tr>');
      headers.forEach((header) => html.push(`<th>${parseInline(header)}</th>`));
      html.push('</tr></thead><tbody>');

      index += 2;
      while (index < lines.length) {
        const rowLine = lines[index];
        if (!rowLine || !rowLine.includes('|') || /^\s*$/.test(rowLine)) {
          index -= 1;
          break;
        }
        const cols = splitTableRow(rowLine);
        html.push('<tr>');
        cols.forEach((cell) => html.push(`<td>${parseInline(cell)}</td>`));
        html.push('</tr>');
        index += 1;
      }
      html.push('</tbody></table></div>');
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushPara();
      closeLists();
      html.push(`<blockquote><p>${parseInline(quote[1])}</p></blockquote>`);
      continue;
    }

    const ul = line.match(/^[-*+]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (!inUl) {
        closeLists();
        inUl = true;
        html.push('<ul>');
      }
      html.push(`<li>${parseInline(ul[1])}</li>`);
      continue;
    }

    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!inOl) {
        closeLists();
        inOl = true;
        html.push('<ol>');
      }
      html.push(`<li>${parseInline(ol[1])}</li>`);
      continue;
    }

    para.push(line);
  }

  flushPara();
  closeLists();

  if (inCode) {
    const codeValue = codeLines.join('\n');
    if (codeLang === 'mermaid') {
      html.push(
        `<div class="mermaid-block"><div class="mermaid-diagram" data-mermaid-source="${escapeHtml(encodeURIComponent(codeValue))}"></div></div>`,
      );
    } else {
      html.push(`<pre><code class="lang-${escapeHtml(codeLang)}">${escapeHtml(codeValue)}</code></pre>`);
    }
  }

  return html.join('\n');
}
