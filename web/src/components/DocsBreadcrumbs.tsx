/** @jsxImportSource preact */
/**
 * Next.js-style Breadcrumb Navigation for Docs Pages.
 */

export interface DocsBreadcrumbsProps {
  category: string;
  title: string;
}

export function DocsBreadcrumbs({ category, title }: DocsBreadcrumbsProps) {
  return (
    <nav class="flex items-center gap-2 text-xs text-slate-400 mb-6 font-mono" aria-label="Breadcrumb">
      <a href="/docs" class="hover:text-emerald-400 transition-colors">
        Docs
      </a>
      <span>/</span>
      <span class="text-slate-400">{category}</span>
      <span>/</span>
      <span class="text-emerald-400 font-medium">{title}</span>
    </nav>
  );
}

