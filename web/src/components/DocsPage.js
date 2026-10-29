import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
import { DocsBreadcrumbs } from './DocsBreadcrumbs.js';
import { DocsPagination } from './DocsPagination.js';
export function DocsPage({ title, category, summary, markdownHtml, prev, next, }) {
    return (_jsxs("div", { children: [_jsx(DocsBreadcrumbs, { category: category, title: title }), _jsxs("header", { class: "mb-10 pb-6 border-b border-slate-800", children: [_jsx("div", { class: "inline-block text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md mb-3", children: category }), _jsx("h1", { class: "text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3", children: title }), _jsx("p", { class: "text-base text-slate-300 leading-relaxed", children: summary })] }), _jsx("article", { class: "prose max-w-none text-slate-300", dangerouslySetInnerHTML: { __html: markdownHtml } }), _jsx(DocsPagination, { prev: prev, next: next })] }));
}
//# sourceMappingURL=DocsPage.js.map