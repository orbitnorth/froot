/**
 * Zero-dependency fast Markdown and Frontmatter Parser for @froot/fullstack.
 * Provides a lightweight Next.js MDX alternative.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface ParsedMarkdown {
  frontmatter: Record<string, string>;
  html: string;
  raw: string;
}

const ESCAPE_REGEX = /[&<>"']/g;
const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(str: string): string {
  return str.replace(ESCAPE_REGEX, (match) => ESCAPE_MAP[match] || match);
}

/**
 * Extracts YAML frontmatter headers from markdown files.
 */
export function parseFrontmatter(markdown: string): { frontmatter: Record<string, string>; content: string } {
  const frontmatter: Record<string, string> = {};
  const trimmed = markdown.trimStart();

  if (!trimmed.startsWith('---')) {
    return { frontmatter, content: markdown };
  }

  const endIdx = trimmed.indexOf('\n---', 3);
  if (endIdx === -1) {
    return { frontmatter, content: markdown };
  }

  const headerBlock = trimmed.slice(3, endIdx).trim();
  const content = trimmed.slice(endIdx + 4).trimStart();

  for (const line of headerBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content };
}

/**
 * Converts a Markdown string into clean, semantic HTML.
 */
export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';
  const codeBuffer: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let tableBuffer: string[] = [];

  function flushTable(): void {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer.map((r) => r.trim()).filter(Boolean);
    tableBuffer = [];
    if (rows.length < 2) return;

    const firstRow = rows[0];
    if (!firstRow) return;

    let html = '<table>\n<thead>\n<tr>';
    const headers = firstRow
      .split('|')
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    for (const h of headers) {
      html += `<th>${formatInline(h)}</th>`;
    }
    html += '</tr>\n</thead>\n<tbody>\n';

    for (let i = 2; i < rows.length; i++) {
      const rowLine = rows[i];
      if (!rowLine) continue;
      const cells = rowLine
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      html += '<tr>';
      for (const cell of cells) {
        html += `<td>${formatInline(cell)}</td>`;
      }
      html += '</tr>\n';
    }
    html += '</tbody>\n</table>';
    output.push(html);
  }

  function flushList(): void {
    if (inList) {
      output.push(`</${inList}>`);
      inList = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const line = rawLine;

    // Fenced Code Blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushList();
        const codeText = escapeHtml(codeBuffer.join('\n'));
        const langClass = codeLang ? ` class="language-${codeLang}"` : '';
        output.push(
          `<div class="code-card my-4 rounded-xl border border-slate-800 bg-[#070b13] overflow-hidden">` +
            `<div class="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs text-slate-400 font-mono">` +
              `<span>${codeLang || 'terminal'}</span>` +
              `<button class="copy-btn hover:text-emerald-400 transition-colors" onclick="copyCode(this)">Copy</button>` +
            `</div>` +
            `<pre class="p-4 overflow-x-auto text-sm text-slate-200 font-mono"><code${langClass}>${codeText}</code></pre>` +
          `</div>`
        );
        inCodeBlock = false;
        codeBuffer.length = 0;
        codeLang = '';
        continue;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        continue;
      }
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      tableBuffer.push(trimmed);
      continue;
    } else {
      flushTable();
    }

    // Empty line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith('#')) {
      flushList();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match && match[1] && match[2]) {
        const level = match[1].length;
        const headingText = match[2];
        const text = formatInline(headingText);
        const id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        output.push(`<h${level} id="${id}">${text}</h${level}>`);
        continue;
      }
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteText = formatInline(trimmed.slice(1).trim());
      output.push(`<blockquote class="border-l-4 border-emerald-500 pl-4 py-1 my-3 text-slate-300 italic bg-emerald-500/5 rounded-r">${quoteText}</blockquote>`);
      continue;
    }

    // Unordered list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (inList !== 'ul') {
        flushList();
        output.push('<ul>');
        inList = 'ul';
      }
      const itemText = formatInline(trimmed.slice(2));
      output.push(`<li>${itemText}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch && olMatch[2]) {
      if (inList !== 'ol') {
        flushList();
        output.push('<ol>');
        inList = 'ol';
      }
      const itemText = formatInline(olMatch[2]);
      output.push(`<li>${itemText}</li>`);
      continue;
    }

    // Regular paragraph
    flushList();
    output.push(`<p>${formatInline(trimmed)}</p>`);
  }

  flushList();
  flushTable();

  return output.join('\n');
}

function formatInline(text: string): string {
  let res = text;
  res = res.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  res = res.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  res = res.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  res = res.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  res = res.replace(/_([^_]+)_/g, '<em>$1</em>');
  res = res.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return res;
}

/**
 * Reads a markdown file from disk, parses frontmatter, and converts content to HTML.
 */
export async function renderMarkdownFile(filePath: string): Promise<ParsedMarkdown> {
  const resolved = path.resolve(filePath);
  const raw = await fs.readFile(resolved, 'utf8');
  const { frontmatter, content } = parseFrontmatter(raw);
  const html = renderMarkdown(content);
  return { frontmatter, html, raw };
}

