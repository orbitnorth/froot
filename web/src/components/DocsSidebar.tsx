/** @jsxImportSource preact */
/**
 * Next.js-style Left Navigation Sidebar for Documentation Hub.
 * (NO NAVBAR is rendered on Docs pages — all navigation lives in this left sidebar!)
 */

import { DOCS_NAV } from '../data/docs-nav.js';

export interface DocsSidebarProps {
  currentSlug: string;
}

export function DocsSidebar({ currentSlug }: DocsSidebarProps) {
  return (
    <aside
      id="docs-sidebar"
      class="fixed inset-y-0 left-0 z-50 w-72 lg:w-80 bg-[#070b13] border-r border-slate-800 flex flex-col transition-transform -translate-x-full md:translate-x-0 no-scrollbar select-none"
    >
      {/* Sidebar Header & Back to Landing Link */}
      <div class="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2.5 group">
          <span class="text-2xl transition-transform group-hover:scale-110">🍏</span>
          <div>
            <div class="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>
                Froot<span class="text-emerald-400">.ts</span>
              </span>
              <span class="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                DOCS
              </span>
            </div>
            <span class="text-xs text-slate-400 group-hover:text-emerald-400 flex items-center gap-1 transition-colors mt-0.5">
              <span>&larr; Back to Landing Page</span>
            </span>
          </div>
        </a>

        {/* Mobile Close Button */}
        <button
          type="button"
          aria-label="Close navigation"
          class="md:hidden text-slate-400 hover:text-white p-1"
          onclick="toggleDocsSidebar()"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Quick Search Filter with Next.js-style shortcut badge */}
      <div class="p-3 border-b border-slate-800/60">
        <div class="relative">
          <svg
            class="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="docs-search-input"
            type="text"
            placeholder="Search docs..."
            oninput="filterDocsNav(this.value)"
            class="w-full bg-slate-900/90 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-9 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
          <span class="absolute right-2.5 top-2 text-[10px] font-mono text-slate-500 border border-slate-800 bg-slate-950 px-1.5 py-0.5 rounded">
            ⌘K
          </span>
        </div>
      </div>

      {/* Left Navigation Tree without scrollbar */}
      <nav class="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6" id="docs-nav-tree">
        {DOCS_NAV.map((cat) => (
          <div key={cat.title} class="space-y-2">
            <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
              {cat.title}
            </div>
            <ul class="space-y-1">
              {cat.items.map((item) => {
                const isActive =
                  item.slug === currentSlug ||
                  (item.slug === '/docs' &&
                    (currentSlug === '/docs' || currentSlug === '/docs/overview' || currentSlug === ''));

                const activeClass = isActive
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-400 pl-2.5 shadow-sm shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]';

                return (
                  <li key={item.slug}>
                    <a
                      href={item.slug}
                      data-title={item.title.toLowerCase()}
                      class={`doc-nav-link flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeClass}`}
                    >
                      <span>{item.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer Links */}
      <div class="p-4 border-t border-slate-800/80 bg-[#050811]/60 flex items-center justify-between text-xs text-slate-400">
        <a href="/llms.txt" class="hover:text-emerald-400 transition-colors font-mono">
          llms.txt
        </a>
        <a
          href="https://github.com/orbitnorth/froot"
          target="_blank"
          rel="noreferrer"
          class="hover:text-emerald-400 transition-colors"
        >
          GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/frootjs"
          target="_blank"
          rel="noreferrer"
          class="hover:text-emerald-400 transition-colors"
        >
          npm
        </a>
      </div>
    </aside>
  );
}

