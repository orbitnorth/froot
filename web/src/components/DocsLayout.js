import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { DocsSidebar } from './DocsSidebar.js';
export function DocsLayout({ currentSlug, children }) {
    return (_jsxs("div", { class: "flex min-h-screen", children: [_jsx("div", { id: "docs-backdrop", class: "fixed inset-0 bg-black/60 z-40 hidden md:hidden", onclick: "toggleDocsSidebar()" }), _jsx(DocsSidebar, { currentSlug: currentSlug }), _jsxs("div", { class: "flex-1 min-w-0 md:ml-72 lg:ml-80 flex flex-col min-h-screen", children: [_jsxs("div", { class: "md:hidden sticky top-0 z-30 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800 p-3.5 flex items-center justify-between", children: [_jsxs("button", { type: "button", class: "flex items-center gap-2 text-slate-300 hover:text-white", onclick: "toggleDocsSidebar()", children: [_jsx("svg", { class: "w-5 h-5 text-emerald-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2", d: "M4 6h16M4 12h16M4 18h16" }) }), _jsx("span", { class: "text-xs font-semibold", children: "Docs Navigation" })] }), _jsx("a", { href: "/", class: "text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1", children: _jsx("span", { children: "\u2190 Landing Page" }) })] }), _jsx("main", { class: "flex-1 max-w-4xl w-full mx-auto px-6 py-10 lg:px-12", children: children }), _jsx("footer", { class: "mt-auto border-t border-slate-800/60 py-6 px-6 text-center text-xs text-slate-400", children: _jsxs("p", { children: ["Froot Framework Documentation \u2022 Built with Froot SSG & Preact \u2022", ' ', _jsx("a", { href: "/llms.txt", class: "text-emerald-400 hover:underline", children: "llms.txt" })] }) })] }), _jsx("script", { dangerouslySetInnerHTML: {
                    __html: `
          function toggleDocsSidebar() {
            const sidebar = document.getElementById('docs-sidebar');
            const backdrop = document.getElementById('docs-backdrop');
            if (sidebar && backdrop) {
              sidebar.classList.toggle('-translate-x-full');
              backdrop.classList.toggle('hidden');
            }
          }

          function filterDocsNav(query) {
            const q = (query || '').toLowerCase().trim();
            const links = document.querySelectorAll('.doc-nav-link');
            links.forEach(link => {
              const title = link.getAttribute('data-title') || '';
              const parentLi = link.closest('li');
              if (!q || title.includes(q)) {
                if (parentLi) parentLi.style.display = '';
              } else {
                if (parentLi) parentLi.style.display = 'none';
              }
            });
          }

          function copyCode(btn) {
            const pre = btn.closest('.code-card')?.querySelector('pre code');
            if (!pre) return;
            navigator.clipboard.writeText(pre.innerText).then(() => {
              const orig = btn.innerText;
              btn.innerText = 'Copied!';
              setTimeout(() => { btn.innerText = orig; }, 2000);
            });
          }
        `,
                } })] }));
}
//# sourceMappingURL=DocsLayout.js.map