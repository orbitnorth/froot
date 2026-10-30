/** @jsxImportSource preact */
/**
 * Next.js-style Document Article Page Component with Right-Rail Table of Contents (TOC).
 */

import type { DocItem } from '../data/docs-nav.js';
import { DocsBreadcrumbs } from './DocsBreadcrumbs.js';
import { DocsPagination } from './DocsPagination.js';

export interface DocsPageProps {
  title: string;
  category: string;
  summary: string;
  markdownHtml: string;
  prev?: DocItem | undefined;
  next?: DocItem | undefined;
}

function processMarkdownHtml(rawHtml: string): { html: string; headings: Array<{ id: string; text: string }> } {
  const headings: Array<{ id: string; text: string }> = [];

  const html = rawHtml.replace(/<h2(.*?)>(.*?)<\/h2>/gi, (_, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    headings.push({ id, text });
    return `<h2 id="${id}"${attrs}>${inner}</h2>`;
  });

  return { html, headings };
}

export function DocsPage({
  title,
  category,
  summary,
  markdownHtml,
  prev,
  next,
}: DocsPageProps) {
  const { html, headings } = processMarkdownHtml(markdownHtml);

  return (
    <div class="xl:flex xl:gap-12">
      {/* Main Document Content */}
      <div class="flex-1 min-w-0">
        {/* Breadcrumbs */}
        <DocsBreadcrumbs category={category} title={title} />

        {/* Document Header */}
        <header class="mb-10 pb-6 border-b border-white/[0.08]">
          <div class="inline-block text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-md mb-3">
            {category}
          </div>
          <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            {title}
          </h1>
          <p class="text-base text-slate-300 leading-relaxed">{summary}</p>
        </header>

        {/* Document Content (rendered from Markdown) */}
        <article
          class="prose max-w-none text-slate-300"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Previous / Next Article Navigation Cards */}
        <DocsPagination prev={prev} next={next} />
      </div>

      {/* Right Table of Contents Rail (Desktop Only - Next.js Style) */}
      {headings.length > 0 && (
        <aside class="hidden xl:block w-56 shrink-0 sticky top-12 self-start py-2">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            On This Page
          </div>
          <nav class="space-y-2 border-l border-white/[0.08] pl-3.5">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                class="block text-xs text-slate-400 hover:text-emerald-400 transition-colors leading-snug"
              >
                {h.text}
              </a>
            ))}
          </nav>
        </aside>
      )}
    </div>
  );
}
