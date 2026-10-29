/** @jsxImportSource preact */
/**
 * Next.js-style Document Article Page Component.
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

export function DocsPage({
  title,
  category,
  summary,
  markdownHtml,
  prev,
  next,
}: DocsPageProps) {
  return (
    <div>
      {/* Breadcrumbs */}
      <DocsBreadcrumbs category={category} title={title} />

      {/* Document Header */}
      <header class="mb-10 pb-6 border-b border-slate-800">
        <div class="inline-block text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md mb-3">
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
        dangerouslySetInnerHTML={{ __html: markdownHtml }}
      />

      {/* Previous / Next Article Navigation Cards */}
      <DocsPagination prev={prev} next={next} />
    </div>
  );
}

