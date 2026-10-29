/** @jsxImportSource preact */
/**
 * Next.js-style Previous / Next Article Navigation Cards.
 */

import type { DocItem } from '../data/docs-nav.js';

export interface DocsPaginationProps {
  prev?: DocItem | undefined;
  next?: DocItem | undefined;
}

export function DocsPagination({ prev, next }: DocsPaginationProps) {
  if (!prev && !next) return null;

  return (
    <div class="mt-16 pt-8 border-t border-slate-800/80">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {prev ? (
          <a
            href={prev.slug}
            class="group block p-4 rounded-xl border border-slate-800 bg-[#070b13] hover:border-emerald-500/50 hover:bg-slate-900/50 transition-all"
          >
            <div class="text-xs text-slate-400 group-hover:text-emerald-400 flex items-center gap-1 transition-colors">
              <span>&larr;</span> <span>Previous</span>
            </div>
            <div class="text-sm font-semibold text-white mt-1 group-hover:text-emerald-300 transition-colors">
              {prev.title}
            </div>
          </a>
        ) : (
          <div />
        )}

        {next ? (
          <a
            href={next.slug}
            class="group block p-4 rounded-xl border border-slate-800 bg-[#070b13] hover:border-emerald-500/50 hover:bg-slate-900/50 text-right transition-all sm:col-start-2"
          >
            <div class="text-xs text-slate-400 group-hover:text-emerald-400 flex items-center justify-end gap-1 transition-colors">
              <span>Next</span> <span>&rarr;</span>
            </div>
            <div class="text-sm font-semibold text-white mt-1 group-hover:text-emerald-300 transition-colors">
              {next.title}
            </div>
          </a>
        ) : null}
      </div>
    </div>
  );
}

