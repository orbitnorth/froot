import { jsx as _jsx, jsxs as _jsxs } from "preact/jsx-runtime";
export function RootLayout({ title = 'Froot Framework — Ultra-Fast, Monomorphic TypeScript Web Framework', description = 'Next-generation TypeScript web framework engineered for peak V8 performance, monomorphic inline caching, and multi-runtime execution across Node.js, Bun, Deno, and Edge.', children, }) {
    return (_jsxs("html", { lang: "en", class: "dark scroll-smooth", children: [_jsxs("head", { children: [_jsx("meta", { charset: "UTF-8" }), _jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }), _jsx("title", { children: title }), _jsx("meta", { name: "description", content: description }), _jsx("meta", { name: "theme-color", content: "#090d16" }), _jsx("meta", { property: "og:title", content: title }), _jsx("meta", { property: "og:description", content: description }), _jsx("meta", { property: "og:type", content: "website" }), _jsx("script", { src: "https://cdn.tailwindcss.com" }), _jsx("script", { dangerouslySetInnerHTML: {
                            __html: `
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  colors: {
                    froot: {
                      50: '#ecfdf5',
                      100: '#d1fae5',
                      400: '#34d399',
                      500: '#10b981',
                      600: '#059669',
                      900: '#064e3b',
                    },
                    dark: {
                      800: '#0f172a',
                      900: '#090d16',
                      950: '#050811',
                    }
                  },
                  fontFamily: {
                    sans: ['Inter', 'system-ui', 'sans-serif'],
                    mono: ['JetBrains Mono', 'monospace'],
                  }
                }
              }
            };
          `,
                        } }), _jsx("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }), _jsx("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" }), _jsx("link", { href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap", rel: "stylesheet" }), _jsx("link", { rel: "stylesheet", href: "/styles.css" })] }), _jsx("body", { class: "bg-[#090d16] text-slate-100 font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300 min-h-screen", children: children })] }));
}
//# sourceMappingURL=RootLayout.js.map