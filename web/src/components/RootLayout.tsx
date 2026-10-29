/** @jsxImportSource preact */
/**
 * Next.js-style Root HTML Shell Layout for Froot Website.
 */

import type { ComponentChildren } from 'preact';

export interface RootLayoutProps {
  title?: string;
  description?: string;
  children: ComponentChildren;
}

export function RootLayout({
  title = 'Froot Framework — Ultra-Fast, Monomorphic TypeScript Web Framework',
  description = 'Next-generation TypeScript web framework engineered for peak V8 performance, monomorphic inline caching, and multi-runtime execution across Node.js, Bun, Deno, and Edge.',
  children,
}: RootLayoutProps) {
  return (
    <html lang="en" class="dark scroll-smooth">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#090d16" />

        {/* OpenGraph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />

        {/* Tailwind CSS CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
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
          }}
        />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-[#090d16] text-slate-100 font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300 min-h-screen">
        {children}
      </body>
    </html>
  );
}

