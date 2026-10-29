import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
export function DocsBreadcrumbs({ category, title }) {
    return (_jsxs("nav", { class: "flex items-center gap-2 text-xs text-slate-400 mb-6 font-mono", "aria-label": "Breadcrumb", children: [_jsx("a", { href: "/docs", class: "hover:text-emerald-400 transition-colors", children: "Docs" }), _jsx("span", { children: "/" }), _jsx("span", { class: "text-slate-400", children: category }), _jsx("span", { children: "/" }), _jsx("span", { class: "text-emerald-400 font-medium", children: title })] }));
}
//# sourceMappingURL=DocsBreadcrumbs.js.map