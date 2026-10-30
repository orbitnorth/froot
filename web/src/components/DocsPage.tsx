/** @jsxImportSource preact */
/**
 * Next.js-style Document Article Page Component with Right-Rail Table of Contents (TOC).
 */

import type { DocItem } from '../data/docs-nav.js';
import { DocsBreadcrumbs } from './DocsBreadcrumbs.js';
import { DocsPagination } from './DocsPagination.js';

export interface DocHeading {
  id: string;
  text: string;
  level?: number | undefined;
}

export interface DocsPageProps {
  title: string;
  category: string;
  summary: string;
  markdownHtml: string;
  headings?: DocHeading[] | undefined;
  prev?: DocItem | undefined;
  next?: DocItem | undefined;
}

function extractHeadingsFromHtml(rawHtml: string = ''): DocHeading[] {
  const headings: DocHeading[] = [];
  const regex = /<h([23])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = regex.exec(rawHtml)) !== null) {
    const level = parseInt(match[1] || '2', 10);
    const id = match[2] || '';
    const text = (match[3] || '').replace(/<[^>]+>/g, '').trim();
    if (id && text) {
      headings.push({ id, text, level });
    }
  }
  return headings;
}

export function DocsPage({
  title,
  category,
  summary,
  markdownHtml,
  headings: explicitHeadings,
  prev,
  next,
}: DocsPageProps) {
  const safeHtml = markdownHtml || '';
  const headings = explicitHeadings && explicitHeadings.length > 0
    ? explicitHeadings
    : extractHeadingsFromHtml(safeHtml);

  // Filter TOC headings to levels 2 and 3
  const tocHeadings = headings.filter((h) => !h.level || h.level === 2 || h.level === 3);

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
          {summary && <p class="text-base text-slate-300 leading-relaxed">{summary}</p>}
        </header>

        {/* Document Content (rendered from Markdown) */}
        <article
          class="prose max-w-none text-slate-300"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        {/* Previous / Next Article Navigation Cards */}
        <DocsPagination prev={prev} next={next} />
      </div>

      {/* Right Table of Contents Rail (Desktop Only - Next.js Style) */}
      {tocHeadings.length > 0 && (
        <aside class="hidden xl:block w-56 shrink-0 sticky top-12 self-start py-2">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <span>On This Page</span>
          </div>
          <nav class="space-y-1.5 border-l border-white/[0.08] pl-3">
            {tocHeadings.map((h) => {
              const isH3 = h.level === 3;
              return (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  class={`block text-xs transition-colors leading-snug ${
                    isH3
                      ? 'pl-3 text-slate-500 hover:text-emerald-400 text-[11px]'
                      : 'text-slate-400 hover:text-emerald-400 font-medium'
                  }`}
                >
                  {h.text}
                </a>
              );
            })}
          </nav>
        </aside>
      )}
    </div>
  );
}
